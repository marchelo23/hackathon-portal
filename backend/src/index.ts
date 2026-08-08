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

    console.log("Generating attacker simulation event via OpenAI...");
    
    let partialPayload;
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: getAttackerInstruction() }],
        response_format: { type: "json_object" }
      });
      const responseText = response.choices[0].message.content || '{}';
      partialPayload = JSON.parse(responseText);
    } catch (apiError) {
      console.warn("OpenAI API failed (probably rate limit or network issue), using fallback mock data...");
      partialPayload = {
        attack_phase: "Automated Exfiltration (Fallback Mode)",
        attacker_terminal: {
          host_user: "strixx@c2-server:~#",
          executed_command: "./exfil_agent --bypass-fw",
          console_output: "Connection established. Transferring bits... [Rate Limit Exceeded locally]"
        },
        server_status: "Compromised"
      };
    }
    
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
    const data = message.content?.content || message.content;
    console.log("SOS Request received:", data);
    
    try {
      const context = JSON.stringify(data);
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
  
  actionsChannel.on('message', (message: any) => {
    const data = message.content?.content || message.content;
    if (!data) return;
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
            votes: 1
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
setInterval(simulateAttackerEvent, 30000);
