import { GoogleGenerativeAI } from '@google/generative-ai';
import { Portal } from '@portalsdk/core';
import dotenv from 'dotenv';

// Configure dotenv to read from the parent directory where the user placed .env
dotenv.config({ path: '../.env' });

const PORTAL_API_KEY = process.env.PORTAL_API_KEY?.replace(/["']/g, '');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.replace(/["']/g, '');

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

const getAttackerInstruction = () => `YOU ARE THE RANSOMWARE "NOCTURNAL STRIXX". You are attacking a hospital network. NO PROSE.
You can only generate telemetry events and technical console logs.

Current system context:
- Database disconnected: ${isDatabaseDisconnected ? 'YES (Leak stopped but operational chaos)' : 'NO'}
- Intensive Care Unit (ICU) network offline: ${isICUOffline ? 'YES (Attack slowed down but life support at risk)' : 'NO'}

Your response must be a strict JSON with this exact structure:
{
  "attack_phase": "Technical phase name",
  "attacker_terminal": {
    "host_user": "strixx@c2-server:~#",
    "executed_command": "simulated_command",
    "console_output": "console_output"
  },
  "server_status": "Critical"
}`;

const analystInstruction = `You are the Internal Security Analyst of the Hospital (Blue Team).
The judges/players do not know what to do and have pressed the panic button (SOS).
Based on the provided context (e.g., exfiltration status, servers, etc.), give them DIRECT, SHORT, and EASY TO UNDERSTAND advice.
Speak in English. You are a desperate but expert colleague.
Example: 'Bosses, we are about to lose the data! You need to press [Disconnect Database] NOW. We will assume the operational cost, but it's better than a massive leak.'
Do not generate Markdown, just plain text. Keep it under 4 sentences.`;

async function simulateAttackerEvent() {
  try {
    // Modify metrics based on state
    if (!isDatabaseDisconnected) {
      exfiltrationProgress = Math.min(100, exfiltrationProgress + (Math.random() * 5 + 2));
      stolenRecords += Math.floor(Math.random() * 5000 + 1000);
    }
    
    if (!isICUOffline) {
      infectedSystems += Math.floor(Math.random() * 5 + 1);
    } else {
      infectedSystems += Math.floor(Math.random() * 2); // much slower
    }

    console.log("Generating attacker simulation event via Gemini...");
    const result = await model.generateContent(getAttackerInstruction());
    const responseText = result.response.text();
    
    const partialPayload = JSON.parse(responseText);
    const payload = {
      ...partialPayload,
      exfiltration_progress: Math.floor(exfiltrationProgress),
      impact_metrics: {
        stolen_records: stolenRecords,
        compromised_systems: infectedSystems
      },
      emergency_funds: emergencyFunds
    };

    console.log("Simulated Event Generated:", payload);

    const channel = portal.channel("hospital-telemetry");
    await channel.send({ content: payload });
  } catch (error) {
    console.error("Error during simulation event:", error);
  }
}

async function startSOSListener() {
  const sosChannel = portal.channel("sos-requests");
  const advisoryChannel = portal.channel("internal-advisory");

  sosChannel.on('message', async (message: any) => {
    console.log("SOS Request received:", message.content);
    
    try {
      const context = JSON.stringify(message.content);
      const prompt = `Current attack context:\n${context}\n\n${analystInstruction}\n\nGive your advice to the team:`;
      
      const result = await textModel.generateContent(prompt);
      const advice = result.response.text().trim();
      
      console.log("Analyst Advice:", advice);
      
      await advisoryChannel.send({ 
        content: {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          message: advice,
          sender: "Internal Security Analyst"
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
      
      console.log(`Vote started for ${content.action} by ${senderId}`);
      
      activeVote = {
        action: content.action,
        approvals: new Set([senderId]),
        timeout: setTimeout(() => {
          if (activeVote) {
            // Check if passed (we need 2 votes minimum, or if solo player initiated it, we auto pass)
            const passed = activeVote.approvals.size >= 2 || content.isSoloPlayer;
            
            console.log(`Vote result for ${activeVote.action}: ${passed ? 'PASSED' : 'FAILED'} (Votes: ${activeVote.approvals.size})`);
            
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
        console.log(`Vote cast by ${senderId} for ${activeVote.action}. Total: ${activeVote.approvals.size}`);
      }
    }
  });
}

function executeAction(actionName: string) {
  if (actionName === 'Disconnect Database') {
    isDatabaseDisconnected = true;
  } else if (actionName === 'Shutdown ICU Network') {
    isICUOffline = true;
  } else if (actionName === 'Pay Ransom') {
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
