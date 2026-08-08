import { OpenAI } from 'openai';
import { Portal } from '@portalsdk/core';
import dotenv from 'dotenv';

// Configure dotenv to read from the parent directory where the user placed .env
dotenv.config({ path: '../.env' });

const PORTAL_API_KEY = process.env.PORTAL_API_KEY?.replace(/["']/g, '');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.replace(/["']/g, '');

if (!PORTAL_API_KEY || !OPENAI_API_KEY) {
  console.error("Missing PORTAL_API_KEY or OPENAI_API_KEY in environment variables.");
  process.exit(1);
}

// Initialize clients
const portal = new Portal({ apiKey: PORTAL_API_KEY });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Global state for simulation
let exfiltrationProgress = 0;
let stolenRecords = 0;
let infectedSystems = 0;
let emergencyFunds = 250000;
let isDatabaseDisconnected = false;
let isICUOffline = false;

let patientSafety = 100;
let counterVirusProgress = 0;
let isDeployingVirus = false;
let gameStatus: 'PLAYING' | 'WON' | 'LOST' = 'PLAYING';
let gameSessionId = Date.now().toString();
let sosUses = 0;
let isFirstTick = true;

function resetGame() {
  exfiltrationProgress = 0;
  stolenRecords = 0;
  infectedSystems = 0;
  emergencyFunds = 250000;
  isDatabaseDisconnected = false;
  isICUOffline = false;
  patientSafety = 100;
  counterVirusProgress = 0;
  isDeployingVirus = false;
  gameStatus = 'PLAYING';
  gameSessionId = Date.now().toString();
  sosUses = 0;
  isFirstTick = true;
  activeVote = null;
}

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
Based on the provided context (e.g., exfiltration status, servers, patient safety), give them DIRECT, SHORT, and SPECIFIC advice on which button to press.
Speak in English. You are a desperate but expert colleague.
Example 1: 'Bosses, the exfiltration is too high! You need to press [Disconnect Database] NOW. We will assume the operational cost, but it's better than a massive leak.'
Example 2: 'Patient safety is dropping dangerously low! You must press [Reconnect Database] or [Reconnect ICU Network] immediately before patients die!'
Example 3: 'We are buying time, Negotiator please use [Stall Attackers] or CFO use [Pay Ransom] to delay the exfiltration while the Counter-Virus compiles.'
Do not generate Markdown, just plain text. Keep it under 4 sentences.`;

let lastPartialPayload: any = {
  attack_phase: "Initial Breach",
  attacker_terminal: { host_user: "strixx@c2:~#", executed_command: "ping", console_output: "Alive" },
  server_status: "Critical"
};

async function broadcastTelemetry() {
  const payload = {
    ...lastPartialPayload,
    exfiltration_progress: Math.floor(exfiltrationProgress),
    patient_safety: Math.floor(patientSafety),
    counter_virus_progress: Math.floor(counterVirusProgress),
    game_status: gameStatus,
    game_session_id: gameSessionId,
    sos_uses_left: Math.max(0, 3 - sosUses),
    is_database_disconnected: isDatabaseDisconnected,
    is_icu_offline: isICUOffline,
    impact_metrics: {
      stolen_records: stolenRecords,
      compromised_systems: infectedSystems
    },
    emergency_funds: emergencyFunds
  };
  const channel = portal.channel("hospital-telemetry");
  await channel.send({ content: payload });
}

async function simulateAttackerEvent() {
  if (gameStatus !== 'PLAYING') return; // Stop advancing if game over

  if (isFirstTick) {
    isFirstTick = false;
    const initialContextMessage = "CRITICAL ALERT: The Nocturnal Strixx ransomware has breached the perimeter. Start the AI Counter-Virus immediately! You have 3 SOS emergency requests available. Good luck.";
    const internalAdvisoryChannel = portal.channel("internal-advisory");
    await internalAdvisoryChannel.send({
      content: {
        sender: "AI Crisis Advisor",
        message: initialContextMessage,
        priority: "CRITICAL",
        session_id: gameSessionId,
        timestamp: Date.now()
      }
    });
  }

  // Modify metrics based on state
  if (!isDatabaseDisconnected) {
    exfiltrationProgress = Math.min(100, exfiltrationProgress + (Math.random() * 4 + 8)); // 8-12% per tick
    stolenRecords += Math.floor(Math.random() * 8000 + 2000);
  } else {
    // Database disconnected stops exfiltration, but hurts patient safety severely!
    patientSafety = Math.max(0, patientSafety - (Math.random() * 4 + 8)); // 8-12% drop per tick
  }
  
  if (!isICUOffline) {
    infectedSystems += Math.floor(Math.random() * 10 + 5);
  } else {
    infectedSystems += Math.floor(Math.random() * 3);
    patientSafety = Math.max(0, patientSafety - (Math.random() * 3 + 4)); // 4-7% drop per tick
  }

  if (isDeployingVirus) {
    counterVirusProgress = Math.min(100, counterVirusProgress + (Math.random() * 4 + 6)); // 6-10% per tick (takes ~10-16 ticks)
  }

  // Check Win/Loss
  if (exfiltrationProgress >= 100 || patientSafety <= 0) {
    gameStatus = 'LOST';
  } else if (counterVirusProgress >= 100) {
    gameStatus = 'WON';
  }

  console.log("Generating attacker simulation event via OpenAI...");
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: getAttackerInstruction() }],
      response_format: { type: "json_object" }
    });
    const responseText = response.choices[0].message.content || '{}';
    lastPartialPayload = JSON.parse(responseText);
  } catch (apiError) {
    console.warn("OpenAI API failed (probably rate limit or network issue), using fallback mock data...");
  }
  
  await broadcastTelemetry();
}

async function startSOSListener() {
  const sosChannel = portal.channel("sos-requests");
  const advisoryChannel = portal.channel("internal-advisory");

  sosChannel.acquire();
  advisoryChannel.acquire();

  sosChannel.on('message', async (message: any) => {
    const data = message.content?.content || message.content;
    if (data.session_id !== gameSessionId) return; // Ignore historical or invalid requests

    if (sosUses >= 3) {
      console.log("SOS Limit reached, ignoring request");
      return;
    }

    sosUses++;
    console.log(`SOS Request received (Used: ${sosUses}/3):`, data);
    
    try {
      const detailedContext = {
        ...data,
        database_status: isDatabaseDisconnected ? "DISCONNECTED (Safe from leak, but Patient Safety dropping!)" : "CONNECTED (Leaking data!)",
        icu_status: isICUOffline ? "OFFLINE (Slows infection, hurts safety)" : "ONLINE (Vulnerable)",
        patient_safety: `${Math.floor(patientSafety)}%`,
        exfiltration_progress: `${Math.floor(exfiltrationProgress)}%`,
        counter_virus_progress: `${Math.floor(counterVirusProgress)}%`
      };
      const context = JSON.stringify(detailedContext);
      const prompt = `Current attack context:\n${context}\n\n${analystInstruction}\n\nGive your advice to the team:`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: prompt }]
      });
      
      const advice = response.choices[0].message.content?.trim() || 'Warning: Cannot reach AI advisory...';
      
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
  
  actionsChannel.acquire();

  actionsChannel.on('message', (message: any) => {
    const data = message.content?.content || message.content;
    if (!data) return;
    if (data.session_id !== gameSessionId) return; // Ignore historical messages!

    const senderId = message.senderId || data.sender;

    if (data.type === 'vote_started') {
      if (activeVote) return;
      
      console.log(`Vote started for ${data.action} by ${senderId}`);
      
      // Auto-pass immediately if Solo Player
      if (data.isSoloPlayer) {
        console.log(`Solo Player Mode: Auto-passing vote for ${data.action}`);
        executeAction(data.action);
        actionsChannel.send({ 
          content: { 
            type: 'vote_result', 
            action: data.action, 
            passed: true,
            votes: 1,
            session_id: gameSessionId
          } 
        });
        return;
      }

      activeVote = {
        action: data.action,
        approvals: new Set([senderId]),
        timeout: setTimeout(() => {
          if (activeVote) {
            // Regular check if passed
            const passed = activeVote.approvals.size >= 2;
            
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
      
    } else if (data.type === 'vote_cast' && activeVote && activeVote.action === data.action) {
      if (data.vote === 'approve') {
        activeVote.approvals.add(senderId);
        console.log(`Vote cast by ${senderId} for ${activeVote.action}. Total: ${activeVote.approvals.size}`);
      }
    }
  });
}

function executeAction(actionName: string) {
  if (actionName === 'Disconnect Database') {
    isDatabaseDisconnected = true;
  } else if (actionName === 'Reconnect Database') {
    isDatabaseDisconnected = false;
  } else if (actionName === 'Shutdown ICU Network') {
    isICUOffline = true;
    patientSafety = Math.max(0, patientSafety - 15); // immediate penalty
  } else if (actionName === 'Reconnect ICU Network') {
    isICUOffline = false;
  } else if (actionName === 'Pay Ransom') {
    emergencyFunds = Math.max(0, emergencyFunds - 50000);
    // Give some time penalty relief
    exfiltrationProgress = Math.max(0, exfiltrationProgress - 15);
  } else if (actionName === 'Deploy AI Counter-Virus') {
    isDeployingVirus = true;
  } else if (actionName === 'Stall Attackers') {
    // Negotiator buys time, slight reduction, no cost
    exfiltrationProgress = Math.max(0, exfiltrationProgress - 5);
  } else if (actionName === 'Reset Simulation') {
    resetGame();
  }
  
  // Immediately update UI without advancing time!
  broadcastTelemetry();
}

// Start simulation loop
console.log("Starting Nocturnal StrixX Backend (Crisis Room Edition)...");
startSOSListener();
startVoteListener();
simulateAttackerEvent();
setInterval(simulateAttackerEvent, 20000); // 20 seconds per tick to allow time for voting
