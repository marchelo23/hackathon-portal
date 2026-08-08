import { OpenAI } from 'openai';
import { Portal } from '@portalsdk/core';
import dotenv from 'dotenv';
import WS from 'ws';

(global as any).WebSocket = WS;

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

const getAttackerInstruction = (isDatabaseDisconnected: boolean, isICUOffline: boolean) => `YOU ARE THE RANSOMWARE "NOCTURNAL STRIXX". You are attacking a hospital network. NO PROSE.
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

interface Player {
  id: string;
  name: string;
  role: string;
  lastSeen: number;
}

class Room {
  roomId: string;
  players: Map<string, Player> = new Map();
  
  exfiltrationProgress = 0;
  stolenRecords = 0;
  infectedSystems = 0;
  emergencyFunds = 250000;
  isDatabaseDisconnected = false;
  isICUOffline = false;
  patientSafety = 100;
  counterVirusProgress = 0;
  isDeployingVirus = false;
  gameStatus: 'PLAYING' | 'WON' | 'LOST' = 'PLAYING';
  gameSessionId = Date.now().toString();
  sosUses = 0;
  isFirstTick = true;
  
  activeVote: { action: string, approvals: Set<string>, timeout: NodeJS.Timeout | null } | null = null;
  
  lastPartialPayload: any = {
    attack_phase: "Initial Breach",
    attacker_terminal: { host_user: "strixx@c2:~#", executed_command: "ping", console_output: "Alive" },
    server_status: "Critical"
  };

  constructor(roomId: string) {
    this.roomId = roomId;
  }

  resetGame() {
    this.exfiltrationProgress = 0;
    this.stolenRecords = 0;
    this.infectedSystems = 0;
    this.emergencyFunds = 250000;
    this.isDatabaseDisconnected = false;
    this.isICUOffline = false;
    this.patientSafety = 100;
    this.counterVirusProgress = 0;
    this.isDeployingVirus = false;
    this.gameStatus = 'PLAYING';
    this.gameSessionId = Date.now().toString();
    this.sosUses = 0;
    this.isFirstTick = true;
    if (this.activeVote?.timeout) clearTimeout(this.activeVote.timeout);
    this.activeVote = null;
  }

  async broadcastTelemetry() {
    const payload = {
      ...this.lastPartialPayload,
      exfiltration_progress: Math.floor(this.exfiltrationProgress),
      patient_safety: Math.floor(this.patientSafety),
      counter_virus_progress: Math.floor(this.counterVirusProgress),
      game_status: this.gameStatus,
      game_session_id: this.gameSessionId,
      sos_uses_left: Math.max(0, 3 - this.sosUses),
      is_database_disconnected: this.isDatabaseDisconnected,
      is_icu_offline: this.isICUOffline,
      impact_metrics: {
        stolen_records: this.stolenRecords,
        compromised_systems: this.infectedSystems
      },
      emergency_funds: this.emergencyFunds,
      active_vote: this.activeVote ? {
        action: this.activeVote.action,
        approvals: Array.from(this.activeVote.approvals).length,
        required: 2
      } : null
    };
    const channel = portal.channel(`hospital-telemetry-${this.roomId}`);
    await channel.send({ content: payload });
  }

  async simulateTick() {
    if (this.gameStatus !== 'PLAYING') return; // Stop advancing if game over

    if (this.isFirstTick) {
      this.isFirstTick = false;
      const initialContextMessage = "CRITICAL ALERT: The Nocturnal Strixx ransomware has breached the perimeter. Start the AI Counter-Virus immediately! You have 3 SOS emergency requests available. Good luck.";
      const internalAdvisoryChannel = portal.channel(`internal-advisory-${this.roomId}`);
      await internalAdvisoryChannel.send({
        content: {
          sender: "AI Crisis Advisor",
          message: initialContextMessage,
          priority: "CRITICAL",
          session_id: this.gameSessionId,
          timestamp: Date.now()
        }
      });
    }

    // Modify metrics based on state
    if (!this.isDatabaseDisconnected) {
      this.exfiltrationProgress = Math.min(100, this.exfiltrationProgress + (Math.random() * 4 + 8));
      this.stolenRecords += Math.floor(Math.random() * 8000 + 2000);
    } else {
      this.patientSafety = Math.max(0, this.patientSafety - (Math.random() * 4 + 8));
    }
    
    if (!this.isICUOffline) {
      this.infectedSystems += Math.floor(Math.random() * 10 + 5);
    } else {
      this.infectedSystems += Math.floor(Math.random() * 3);
      this.patientSafety = Math.max(0, this.patientSafety - (Math.random() * 3 + 4));
    }

    if (this.isDeployingVirus) {
      this.counterVirusProgress = Math.min(100, this.counterVirusProgress + (Math.random() * 4 + 6));
    }

    // Check Win/Loss
    if (this.exfiltrationProgress >= 100 || this.patientSafety <= 0) {
      this.gameStatus = 'LOST';
    } else if (this.counterVirusProgress >= 100) {
      this.gameStatus = 'WON';
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: getAttackerInstruction(this.isDatabaseDisconnected, this.isICUOffline) }],
        response_format: { type: "json_object" }
      });
      const responseText = response.choices[0].message.content || '{}';
      this.lastPartialPayload = JSON.parse(responseText);
    } catch (apiError) {
      console.warn(`[Room ${this.roomId}] OpenAI API failed, using fallback mock data...`);
    }
    
    await this.broadcastTelemetry();
  }

  executeAction(actionName: string) {
    if (actionName === 'Disconnect Database') {
      this.isDatabaseDisconnected = true;
    } else if (actionName === 'Reconnect Database') {
      this.isDatabaseDisconnected = false;
    } else if (actionName === 'Shutdown ICU Network') {
      this.isICUOffline = true;
      this.patientSafety = Math.max(0, this.patientSafety - 15);
    } else if (actionName === 'Reconnect ICU Network') {
      this.isICUOffline = false;
    } else if (actionName === 'Pay Ransom') {
      this.emergencyFunds = Math.max(0, this.emergencyFunds - 50000);
      this.exfiltrationProgress = Math.max(0, this.exfiltrationProgress - 15);
    } else if (actionName === 'Deploy AI Counter-Virus') {
      this.isDeployingVirus = true;
    } else if (actionName === 'Stall Attackers') {
      this.exfiltrationProgress = Math.max(0, this.exfiltrationProgress - 5);
    } else if (actionName === 'Reset Simulation') {
      this.resetGame();
    }
    
    this.broadcastTelemetry();
  }
}

class GameServer {
  rooms: Map<string, Room> = new Map();
  lobbyChannel: any;
  sosChannel: any;
  voteChannel: any;

  start() {
    console.log("Starting Nocturnal StrixX Backend (Multi-Room Edition)...");
    
    this.startLobbyListener();
    this.startSOSListener();
    
    // Main Game Loop across all active rooms
    setInterval(() => {
      const now = Date.now();
      for (const [roomId, room] of this.rooms.entries()) {
        
        // Clean up inactive players (missed heartbeats for 15s)
        for (const [playerId, player] of room.players.entries()) {
          if (now - player.lastSeen > 15000) {
            console.log(`[Room ${roomId}] Player ${playerId} timed out. Removing.`);
            room.players.delete(playerId);
          }
        }
        
        // If room is empty, we could optionally pause it or destroy it.
        // For now, we just keep running it, but we could stop it if needed.
        if (room.players.size > 0) {
          room.simulateTick();
        }
      }
    }, 20000);
  }

  getOrCreateRoom(roomId: string): Room {
    if (!this.rooms.has(roomId)) {
      console.log(`[Server] Creating new room: ${roomId}`);
      const newRoom = new Room(roomId);
      this.rooms.set(roomId, newRoom);
      
      const roomActionsChannel = portal.channel(`crisis-room-actions-${roomId}`);
      roomActionsChannel.acquire();

      roomActionsChannel.on('message', (message: any) => {
        const data = message.content?.content || message.content;
        if (!data) return;
        
        const room = this.rooms.get(roomId);
        if (!room || data.session_id !== room.gameSessionId) return; 

        const senderId = message.senderId || data.sender;

        if (data.type === 'vote_started') {
          if (room.activeVote) return;
          
          console.log(`[Room ${room.roomId}] Vote started for ${data.action} by ${senderId}`);
          
          if (data.isSoloPlayer) {
            room.executeAction(data.action);
            roomActionsChannel.send({ 
              content: { 
                type: 'vote_result', 
                action: data.action, 
                passed: true,
                votes: 1,
                session_id: room.gameSessionId,
                roomId: room.roomId
              } 
            });
            return;
          }

          room.activeVote = {
            action: data.action,
            approvals: new Set([senderId]),
            timeout: setTimeout(() => {
              if (room.activeVote) {
                const passed = room.activeVote.approvals.size >= 2;
                
                if (passed) {
                  room.executeAction(room.activeVote.action);
                }
                
                roomActionsChannel.send({ 
                  content: { 
                    type: 'vote_result', 
                    action: room.activeVote.action, 
                    passed,
                    votes: room.activeVote.approvals.size,
                    roomId: room.roomId
                  } 
                });
                
                room.activeVote = null;
              }
            }, 10000)
          };
          
          // Notify others in room that vote started
          roomActionsChannel.send({ 
            content: { 
              type: 'vote_started_sync', 
              action: data.action, 
              sender: senderId,
              isSoloPlayer: false,
              roomId: room.roomId 
            } 
          });
          
        } else if (data.type === 'vote_cast' && room.activeVote && room.activeVote.action === data.action) {
          if (data.vote === 'approve') {
            room.activeVote.approvals.add(senderId);
            roomActionsChannel.send({
              content: {
                type: 'vote_cast_sync',
                action: data.action,
                roomId: room.roomId
              }
            });
          }
        }
      });

      // Run initial tick
      newRoom.simulateTick();
    }
    return this.rooms.get(roomId)!;
  }

  startLobbyListener() {
    this.lobbyChannel = portal.channel("lobby-system");
    this.lobbyChannel.acquire();

    this.lobbyChannel.on('message', (message: any) => {
      const data = message.content?.content || message.content;
      if (!data || !data.type) return;

      const roomId = data.roomId;
      const playerId = data.playerId || message.senderId;

      if (data.type === 'join_request') {
        const room = this.rooms.get(roomId);
        const playerCount = room ? room.players.size : 0;
        
        if (playerCount >= 3 && !room?.players.has(playerId)) {
          portal.channel(`lobby-events-${playerId}`).send({
            content: { type: 'join_rejected', reason: 'Room is full (max 3 players)' }
          });
        } else {
          const activeRoom = this.getOrCreateRoom(roomId);
          activeRoom.players.set(playerId, {
            id: playerId,
            name: data.name,
            role: data.role,
            lastSeen: Date.now()
          });
          console.log(`[Room ${roomId}] Player ${playerId} joined. Total: ${activeRoom.players.size}/3`);
          
          portal.channel(`lobby-events-${playerId}`).send({
            content: { type: 'join_accepted', roomId }
          });
        }
      } else if (data.type === 'heartbeat') {
        if (roomId && this.rooms.has(roomId)) {
          const room = this.rooms.get(roomId)!;
          if (room.players.has(playerId)) {
            room.players.get(playerId)!.lastSeen = Date.now();
          }
        }
      }
    });
  }

  startSOSListener() {
    this.sosChannel = portal.channel("sos-requests");
    this.sosChannel.acquire();

    this.sosChannel.on('message', async (message: any) => {
      const data = message.content?.content || message.content;
      if (!data || !data.roomId) return;

      const room = this.rooms.get(data.roomId);
      if (!room || data.session_id !== room.gameSessionId) return;

      if (room.sosUses >= 3) {
        console.log(`[Room ${room.roomId}] SOS Limit reached, ignoring request`);
        return;
      }

      room.sosUses++;
      console.log(`[Room ${room.roomId}] SOS Request received (Used: ${room.sosUses}/3):`, data);
      
      try {
        const detailedContext = {
          ...data,
          database_status: room.isDatabaseDisconnected ? "DISCONNECTED (Safe from leak, but Patient Safety dropping!)" : "CONNECTED (Leaking data!)",
          icu_status: room.isICUOffline ? "OFFLINE (Slows infection, hurts safety)" : "ONLINE (Vulnerable)",
          patient_safety: `${Math.floor(room.patientSafety)}%`,
          exfiltration_progress: `${Math.floor(room.exfiltrationProgress)}%`,
          counter_virus_progress: `${Math.floor(room.counterVirusProgress)}%`
        };
        const context = JSON.stringify(detailedContext);
        const prompt = `Current attack context:\n${context}\n\n${analystInstruction}\n\nGive your advice to the team:`;
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: prompt }]
        });
        
        const advice = response.choices[0].message.content?.trim() || 'Warning: Cannot reach AI advisory...';
        
        const advisoryChannel = portal.channel(`internal-advisory-${room.roomId}`);
        await advisoryChannel.send({ 
          content: {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            message: advice,
            sender: "Internal Security Analyst"
          }
        });
      } catch (error) {
        console.error(`[Room ${room.roomId}] Error generating analyst advice:`, error);
      }
    });
  }
}

const server = new GameServer();
server.start();
