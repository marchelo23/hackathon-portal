# 📐 System Architecture & Event Payload Specification

This document provides a deep technical breakdown of **Nocturnal StrixX - Crisis Room Simulator**, detailing event sequence flows, state machines, channel taxonomy, and JSON schemas for all real-time communications powered by the **Portal SDK**.

---

## 📌 Table of Contents

- [Channel Taxonomy](#-channel-taxonomy)
- [Sequence Diagrams](#-sequence-diagrams)
  - [1. Player Room Join & Validation Flow](#1-player-room-join--validation-flow)
  - [2. Attacker Telemetry Tick Flow](#2-attacker-telemetry-tick-flow)
  - [3. "Double Key" Consensus Voting Flow](#3-double-key-consensus-voting-flow)
  - [4. Negotiator SOS Emergency Request Flow](#4-negotiator-sos-emergency-request-flow)
- [Game State Machine](#-game-state-machine)
- [JSON Channel Event Payload Schemas](#-json-channel-event-payload-schemas)

---

## 📡 Channel Taxonomy

All real-time communications use **Portal SDK** channels. Channels are isolated either globally or per-room:

```
GLOBAL CHANNELS
├── lobby-system                   # Broadcast/Listen for join requests & heartbeats
├── sos-requests                   # Global channel listening for Negotiator SOS calls
└── lobby-events-{playerId}        # Direct feedback channel for a specific joining player

ROOM-SPECIFIC CHANNELS (Dynamic per roomId, e.g., SALA1)
├── hospital-telemetry-{roomId}     # Attacker terminal logs, game metrics & countdowns
├── crisis-room-actions-{roomId}   # Consensus voting events (vote_started, vote_cast, vote_result)
├── crisis-room-cursors-{roomId}   # Real-time player cursor position tracking (x, y, role)
└── internal-advisory-{roomId}     # Broadcast channel for AI Crisis Analyst advice text
```

---

## ⏱️ Sequence Diagrams

### 1. Player Room Join & Validation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Player as Player (Frontend)
    participant Lobby as Channel: lobby-system
    participant Direct as Channel: lobby-events-{playerId}
    participant Server as GameServer (Backend)

    Player->>Lobby: send({ type: 'join_request', roomId, playerId, name, role })
    Server->>Lobby: on('message')
    alt Room is full (3 active players)
        Server->>Direct: send({ type: 'join_rejected', reason: 'Room is full (max 3 players)' })
        Direct-->>Player: Display join error banner
    else Slot Available or Room Created
        Server->>Server: Register/update player in room map
        Server->>Direct: send({ type: 'join_accepted', roomId })
        Direct-->>Player: Navigate to Dashboard UI
    end

    loop Every 5 Seconds
        Player->>Lobby: send({ type: 'heartbeat', roomId, playerId })
    end
```

---

### 2. Attacker Telemetry Tick Flow

```mermaid
sequenceDiagram
    autonumber
    participant Room as Room Engine (Backend)
    participant OpenAI as OpenAI GPT-4o-mini
    participant TelemCh as Channel: hospital-telemetry-{roomId}
    participant UI as Frontend Dashboard

    loop Every 20 Seconds
        Room->>Room: Recalculate metrics (exfiltration, patient safety, counter-virus)
        Room->>OpenAI: chat.completions.create(model: 'gpt-4o-mini', context)
        OpenAI-->>Room: JSON (attack_phase, host_user, command, console_output)
        Room->>TelemCh: send({ content: StrixxEventPayload })
        TelemCh-->>UI: useChannel hook updates state & triggers Typewriter animation
    end
```

---

### 3. "Double Key" Consensus Voting Flow

```mermaid
sequenceDiagram
    autonumber
    actor Initiator as Player 1 (IT Architect)
    participant ActionsCh as Channel: crisis-room-actions-{roomId}
    participant Room as Room Engine (Backend)
    actor Partner as Player 2 (CFO)

    Initiator->>ActionsCh: send({ type: 'vote_started', action: 'Disconnect Database', sender })
    ActionsCh-->>Room: Room receives vote_started
    Room->>Room: Create activeVote entry & start 10s timer
    Room->>ActionsCh: send({ type: 'vote_started_sync', action, sender })
    ActionsCh-->>Partner: Opens Consensus Voting Modal on screen

    Partner->>ActionsCh: send({ type: 'vote_cast', action, vote: 'approve', sender })
    ActionsCh-->>Room: Approvals count reaches 2 (>= 2)
    Room->>Room: Clear timeout & execute executeAction('Disconnect Database')
    Room->>ActionsCh: send({ type: 'vote_result', action, passed: true, votes: 2 })
    ActionsCh-->>Initiator: Close Modal & update UI (DB Disconnected)
    ActionsCh-->>Partner: Close Modal & update UI (DB Disconnected)
```

---

### 4. Negotiator SOS Emergency Request Flow

```mermaid
sequenceDiagram
    autonumber
    actor Neg as Negotiator (Frontend)
    participant SOSCh as Channel: sos-requests
    participant Server as GameServer (Backend)
    participant OpenAI as OpenAI GPT-4o-mini
    participant AdvCh as Channel: internal-advisory-{roomId}
    actor Team as All Room Players

    Neg->>SOSCh: send({ roomId, session_id, current_state })
    SOSCh-->>Server: Server receives SOS request
    alt SOS uses < 3
        Server->>Server: Increment sosUses count
        Server->>OpenAI: chat.completions.create(analystPrompt, context)
        OpenAI-->>Server: Text advice (under 4 sentences)
        Server->>AdvCh: send({ message: advice, sender: 'Internal Security Analyst' })
        AdvCh-->>Team: Render advisory banner with typewriter animation
    else SOS uses >= 3
        Server->>Server: Ignore request (limit reached)
    end
```

---

## 🔄 Game State Machine

```mermaid
stateDiagram-v2
    [*] --> Lobby: Player selects Role & Room Code
    Lobby --> Playing: Join Accepted

    state Playing {
        [*] --> InitialBreach
        InitialBreach --> VirusCompiling: Action: Deploy AI Counter-Virus
        VirusCompiling --> VirusCompiling: 20s Telemetry Ticks (~260s total)
    }

    Playing --> Lost: Exfiltration >= 100% OR Patient Safety <= 0%
    Playing --> Won: Counter-Virus Progress >= 100%

    Lost --> Playing: Action: Reset Simulation
    Won --> Playing: Action: Reset Simulation
```

---

## 📋 JSON Channel Event Payload Schemas

### 1. `hospital-telemetry-{roomId}` Payload

```json
{
  "attack_phase": "Lateral Movement - Active Directory Breach",
  "attacker_terminal": {
    "host_user": "strixx@c2-server:~#",
    "executed_command": "mimikatz.exe sekurlsa::logonpasswords",
    "console_output": "[+] Extracting domain credentials... NT hash recovered."
  },
  "server_status": "Critical",
  "exfiltration_progress": 42,
  "patient_safety": 85,
  "counter_virus_progress": 15,
  "game_status": "PLAYING",
  "game_session_id": "1723178945123",
  "sos_uses_left": 2,
  "is_database_disconnected": false,
  "is_icu_offline": false,
  "impact_metrics": {
    "stolen_records": 48200,
    "compromised_systems": 18
  },
  "emergency_funds": 250000,
  "active_vote": null
}
```

### 2. `crisis-room-actions-{roomId}` Vote Request Payload

```json
{
  "type": "vote_started",
  "action": "Disconnect Database",
  "sender": "Agent_Smith",
  "isSoloPlayer": false,
  "session_id": "1723178945123"
}
```

### 3. `crisis-room-cursors-{roomId}` Cursor Payload

```json
{
  "id": "Agent_Smith",
  "name": "Agent_Smith",
  "role": "IT Architect",
  "x": 1240,
  "y": 680
}
```

### 4. `internal-advisory-{roomId}` Advisory Payload

```json
{
  "id": "1723179001234",
  "timestamp": "2026-08-08T21:47:10.000Z",
  "message": "Bosses, the exfiltration is too high! You need to press [Disconnect Database] NOW. We will assume the operational cost, but it's better than a massive leak.",
  "sender": "Internal Security Analyst"
}
```

---

## 🔗 Related Documentation

- 🏠 [Root README](file:///home/chelo/antigravity/PortalHack/hackathon-portal/README.md)
- 💻 [Frontend Technical Documentation](file:///home/chelo/antigravity/PortalHack/hackathon-portal/frontend/README.md)
- ⚙️ [Backend Technical Documentation](file:///home/chelo/antigravity/PortalHack/hackathon-portal/backend/README.md)
- 🛠️ [Terraform AWS Infrastructure Guide](file:///home/chelo/antigravity/PortalHack/hackathon-portal/terraform/README.md)
