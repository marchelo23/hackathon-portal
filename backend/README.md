# ⚙️ Hackathon Portal - Backend Engine

The server-side simulation engine for **Nocturnal StrixX - Crisis Room Simulator**. Built with **Node.js**, **TypeScript**, **Portal SDK (`@portalsdk/core`)**, and **OpenAI Node SDK (`openai`)**.

---

## 📌 Overview

The backend is an event-driven game engine responsible for:
1. **Room State & Lifecycle Management**: Creating multi-room instances (`Room`), handling room join validation, heartbeat tracking, and automatic inactive player cleanup.
2. **Attacker AI Telemetry Simulation**: Running a 20-second tick simulation loop that advances attack metrics (stolen records, patient safety degradation, exfiltration) and prompts **OpenAI GPT-4o-mini** to return structured JSON telemetry logs.
3. **Consensus Voting Engine**: Managing the "Double Key" voting workflow across room channels with automatic 10-second consensus evaluation.
4. **AI Crisis Advisory Engine**: Listening for Negotiator SOS requests and generating targeted context-aware tactical advice via OpenAI GPT-4o-mini.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js v20+ (ES Modules format)
- **Language**: TypeScript 5.7+
- **Execution Helper**: `tsx` (TypeScript Execute for live dev)
- **Real-Time SDK**: `@portalsdk/core` v0.1.5 with `ws` WebSocket binding
- **AI Service**: OpenAI SDK v7.4.0 (`gpt-4o-mini`)
- **Environment Handling**: `dotenv`

---

## 📁 Directory Structure

```
backend/
├── Dockerfile            # Container definition (Node 20 Alpine)
├── package.json          # Dependencies & npm scripts
├── tsconfig.json         # TypeScript compiler options
└── src/
    └── index.ts          # Complete backend engine (GameServer, Room, AI Prompts)
```

---

## 🔑 Environment Variables

The backend requires credentials for Portal SDK and OpenAI:

```env
PORTAL_API_KEY=pk_your_portal_api_key_here
OPENAI_API_KEY=sk-your_openai_api_key_here
```

*Note: The engine automatically attempts to load environment variables from `../.env` relative to the backend workspace.*

---

## 🚀 Running the Backend

### Development Mode (with Live Reload)
```bash
# Install dependencies
pnpm install

# Run backend with tsx
pnpm dev
```

### Production Build & Run
```bash
# Compile TypeScript to dist/
pnpm build

# Start production build
pnpm start
```

### Docker Container
```bash
docker build -t hackathon-portal-backend .
docker run --env-file ../.env hackathon-portal-backend
```

---

## 🔄 Core Engine Mechanics & Class Architecture

### `GameServer` Class
- **Global Channel Listeners**:
  - `lobby-system`: Listens for `join_request` and `heartbeat` messages.
  - `sos-requests`: Listens for SOS emergency requests triggered by Negotiators.
- **Heartbeat & Inactivity Sweeper**: Every 20 seconds, sweeps all active rooms and purges players who haven't sent a heartbeat for >15 seconds.
- **Dynamic Room Instantiation**: Automatically spins up a new `Room` instance when a player joins a room code for the first time.

### `Room` Class
- **State Properties**:
  - `exfiltrationProgress` (0–100%)
  - `patientSafety` (0–100%)
  - `counterVirusProgress` (0–100%)
  - `emergencyFunds` ($250,000 start)
  - `stolenRecords` & `infectedSystems`
  - `isDatabaseDisconnected` & `isICUOffline`
  - `gameStatus` (`PLAYING` | `WON` | `LOST`)
  - `activeVote` state tracker
- **Tick Simulation (`simulateTick`)**:
  - Increments exfiltration progress and stolen record counts if DB is connected.
  - Decrements patient safety if DB or ICU network is offline.
  - Advances AI Counter-Virus progress if deployed.
  - Queries `gpt-4o-mini` for dynamic C2 console logs tailored to current system context.
  - Evaluates Win/Loss criteria and broadcasts updated telemetry over `hospital-telemetry-{roomId}`.

---

## 📡 Portal SDK Channel Architecture

| Channel Pattern | Listener / Sender | Description |
| :--- | :--- | :--- |
| `lobby-system` | Server Listens | Global channel for room join requests & player heartbeats |
| `lobby-events-{playerId}` | Server Sends | Direct message to specific player confirming or rejecting join |
| `hospital-telemetry-{roomId}` | Server Sends | Room telemetry broadcast sent every 20 seconds |
| `crisis-room-actions-{roomId}` | Server & Clients | Vote initiation (`vote_started`), vote casting (`vote_cast`), and result sync (`vote_result`) |
| `sos-requests` | Server Listens | Negotiator SOS requests requiring AI Security Analyst response |
| `internal-advisory-{roomId}` | Server Sends | Advisory messages containing tactical advice from AI |

---

## 🤖 OpenAI Integration

### 1. Attacker C2 Telemetry Prompt (`getAttackerInstruction`)
Forces `gpt-4o-mini` to act as the "NOCTURNAL STRIXX" ransomware C2 server, returning JSON containing realistic technical terminal commands (`host_user`, `executed_command`, `console_output`) that reflect current DB and ICU states.

### 2. SOS AI Security Analyst Prompt (`analystInstruction`)
Responds to Negotiator SOS calls by evaluating current exfiltration, patient safety, and fund levels, returning concise (under 4 sentences) tactical advice guiding the team on which physical button or countermeasure to trigger.

---

## 🔗 Related Documentation

- 🏠 [Root README](file:///home/chelo/antigravity/PortalHack/hackathon-portal/README.md)
- 💻 [Frontend Documentation](file:///home/chelo/antigravity/PortalHack/hackathon-portal/frontend/README.md)
- 📐 [Architecture & Event Schemas](file:///home/chelo/antigravity/PortalHack/hackathon-portal/docs/ARCHITECTURE.md)
