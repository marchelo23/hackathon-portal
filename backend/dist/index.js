import { GoogleGenerativeAI } from '@google/generative-ai';
import { Portal } from '@portalsdk/core';
import dotenv from 'dotenv';
// Configure dotenv to read from the parent directory where the user placed .env
dotenv.config({ path: '../.env' });
const PORTAL_API_KEY = process.env.PORTAL_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!PORTAL_API_KEY || !GEMINI_API_KEY) {
    console.error("Missing PORTAL_API_KEY or GEMINI_API_KEY in environment variables.");
    process.exit(1);
}
// Initialize clients
const portal = new Portal({ apiKey: PORTAL_API_KEY });
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
    }
});
const textModel = genAI.getGenerativeModel({
    model: "gemini-3.5-flash",
});
// Global state for simulation
let exfiltrationProgress = 0;
let stolenRecords = 0;
let infectedSystems = 0;
let emergencyFunds = 250000;
let isDatabaseDisconnected = false;
let isICUOffline = false;
const getAttackerInstruction = () => `ERES EL RANSOMWARE "NOCTURNAL STRIXX". Estás atacando la red de un hospital. CERO PROSA.
Solo puedes generar eventos de telemetría y logs de consola técnica.

Contexto actual del sistema:
- Base de datos desconectada: ${isDatabaseDisconnected ? 'SÍ (Fuga detenida pero caos operativo)' : 'NO'}
- Red de Cuidados Intensivos (UCI) apagada: ${isICUOffline ? 'SÍ (Ataque ralentizado pero soporte vital en riesgo)' : 'NO'}

Tu respuesta debe ser un JSON estricto con esta estructura exacta:
{
  "fase_ataque": "Nombre técnico de la fase",
  "terminal_atacante": {
    "usuario_host": "strixx@c2-server:~#",
    "comando_ejecutado": "comando_simulado",
    "output_consola": "salida_consola"
  },
  "estado_servidores": "Crítico"
}`;
const analystInstruction = `Eres el Analista de Seguridad Interno del Hospital (Blue Team).
Los jueces/jugadores no saben qué hacer y han presionado el botón de pánico (SOS).
Basado en el contexto proporcionado (ej. estado de exfiltración, servidores, etc.), dales un consejo DIRECTO, CORTO y FÁCIL DE ENTENDER.
Habla en español. Eres un colega desesperado pero experto.
Ejemplo: '¡Jefes, estamos a punto de perder los datos! Tienen que presionar [Desconectar Base de Datos] AHORA. Asumiremos el costo operativo, pero es mejor que una fuga masiva.'
No generes Markdown, solo texto plano. Mantenlo en menos de 4 oraciones.`;
async function simulateAttackerEvent() {
    try {
        // Modify metrics based on state
        if (!isDatabaseDisconnected) {
            exfiltrationProgress = Math.min(100, exfiltrationProgress + (Math.random() * 5 + 2));
            stolenRecords += Math.floor(Math.random() * 5000 + 1000);
        }
        if (!isICUOffline) {
            infectedSystems += Math.floor(Math.random() * 5 + 1);
        }
        else {
            infectedSystems += Math.floor(Math.random() * 2); // much slower
        }
        console.log("Generating attacker simulation event via Gemini...");
        const result = await model.generateContent(getAttackerInstruction());
        const responseText = result.response.text();
        const partialPayload = JSON.parse(responseText);
        const payload = {
            ...partialPayload,
            progreso_exfiltracion: Math.floor(exfiltrationProgress),
            metricas_impacto: {
                registros_robados: stolenRecords,
                sistemas_comprometidos: infectedSystems
            },
            fondos_emergencia: emergencyFunds
        };
        console.log("Simulated Event Generated:", payload);
        const channel = portal.channel("hospital-telemetry");
        await channel.send({ content: payload });
    }
    catch (error) {
        console.error("Error during simulation event:", error);
    }
}
async function startSOSListener() {
    const sosChannel = portal.channel("sos-requests");
    const advisoryChannel = portal.channel("internal-advisory");
    sosChannel.on('message', async (message) => {
        console.log("SOS Request received:", message.content);
        try {
            const context = JSON.stringify(message.content);
            const prompt = ;
            `Contexto actual del ataque:\\n\${context}\\n\\n\${analystInstruction}\\n\\nDame tu consejo para el equipo:\`;
      
      const result = await textModel.generateContent(prompt);
      const advice = result.response.text().trim();
      
      console.log("Analyst Advice:", advice);
      
      await advisoryChannel.send({ 
        content: {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          message: advice,
          sender: "Analista de Seguridad Interno"
        }
      });
    } catch (error) {
      console.error("Error generating analyst advice:", error);
    }
  });
}

// Voting System State
let activeVote: { action: string, approvals: Set<string>, timeout: NodeJS.Timeout | null } | null = null;

async function startVoteListener() {
  const actionsChannel = portal.channel("crisis-room-actions");
  
  actionsChannel.on('message', (message: any) => {
    const content = message.content;
    const senderId = message.senderId || content.sender;

    if (content.type === 'vote_started') {
      if (activeVote) return;
      
      console.log(\`Vote started for \${content.action} by \${senderId}\`);
      
      activeVote = {
        action: content.action,
        approvals: new Set([senderId]),
        timeout: setTimeout(() => {
          if (activeVote) {
            // Check if passed (we need 2 votes minimum, or if solo player initiated it, we auto pass)
            const passed = activeVote.approvals.size >= 2 || content.isSoloPlayer;
            
            console.log(\`Vote result for \${activeVote.action}: \${passed ? 'PASSED' : 'FAILED'} (Votes: \${activeVote.approvals.size})\`);
            
            if (passed) {
              executeAction(activeVote.action);
            }
            
            actionsChannel.send({ 
              content: { 
                type: 'vote_result', 
                action: activeVote.action, 
                passed,
                votes: activeVote.approvals.size
              } 
            });
            
            activeVote = null;
          }
        }, 10000)
      };
      
    } else if (content.type === 'vote_cast' && activeVote && activeVote.action === content.action) {
      if (content.vote === 'approve') {
        activeVote.approvals.add(senderId);
        console.log(\`Vote cast by \${senderId} for \${activeVote.action}. Total: \${activeVote.approvals.size}\`);
      }
    }
  });
}

function executeAction(actionName: string) {
  if (actionName === 'Desconectar Base de Datos') {
    isDatabaseDisconnected = true;
  } else if (actionName === 'Apagar Red UCI') {
    isICUOffline = true;
  } else if (actionName === 'Pagar Rescate') {
    emergencyFunds = Math.max(0, emergencyFunds - 50000);
    // Give some time penalty relief
    exfiltrationProgress = Math.max(0, exfiltrationProgress - 10);
  }
  
  // Immediately trigger a new event to reflect changes
  simulateAttackerEvent();
}

// Start simulation loop
console.log("Starting Nocturnal StrixX Backend (Crisis Room Edition)...");
startSOSListener();
startVoteListener();
simulateAttackerEvent();
setInterval(simulateAttackerEvent, 15000);
            ;
        }
        finally { }
    });
}
