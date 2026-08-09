# 💻 Hackathon Portal - Frontend

The frontend user interface for **Nocturnal StrixX - Crisis Room Simulator**. Built with **React 18**, **Vite**, **TailwindCSS 4**, **Lucide Icons**, and the **Portal SDK React Hooks (`@portalsdk/react`)**.

---

## 📌 Overview

The frontend renders a high-tech, real-time command dashboard mimicking a hospital cybersecurity crisis center. It communicates with the backend engine using dedicated Portal SDK pub/sub channels for game state telemetry, player position cursors, consensus voting modals, and AI crisis advisories.

---

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript (`tsx`)
- **Build Tool**: Vite 5
- **Styling**: TailwindCSS 4 + `@tailwindcss/vite`
- **Real-Time SDK**: `@portalsdk/react` & `@portalsdk/core`
- **Icons**: Lucide React (`lucide-react`)
- **Linting & Code Quality**: ESLint 9

---

## 📁 Directory Structure

```
frontend/
├── Dockerfile              # Multi-stage Nginx container configuration
├── eslint.config.js        # ESLint flat config
├── index.html              # HTML entry point with Orbitron & Inter fonts
├── package.json            # Dependencies & scripts
├── public/                 # Static assets
├── src/
│   ├── App.css             # Tailwind & custom scrollbar styles
│   ├── App.tsx             # Main dashboard, state machine & real-time hooks
│   ├── index.css           # Global stylesheet
│   ├── main.tsx            # React root renderer wrapped in PortalProvider
│   └── vite-env.d.ts       # Vite environment types
├── tailwind.config.js      # Tailwind configuration
└── vite.config.ts          # Vite plugin configuration
```

---

## 🔑 Environment Variables

The frontend requires `VITE_PORTAL_API_KEY` to connect to the Portal pub/sub network.

Create or update `.env` in `frontend/` or root:

```env
VITE_PORTAL_API_KEY=pk_your_portal_api_key_here
```

---

## 🚀 Running the Frontend

### Development Mode
```bash
# Install dependencies
pnpm install

# Start Vite dev server
pnpm dev
```
Access the application at `http://localhost:5173`.

### Production Build & Preview
```bash
# Build TypeScript and bundle static assets
pnpm build

# Preview production build locally
pnpm preview
```

### Docker Deployment
```bash
docker build -t hackathon-portal-frontend --build-arg VITE_PORTAL_API_KEY=your_key .
docker run -p 8081:80 hackathon-portal-frontend
```

---

## 🧩 Components & Features

### 1. `LoginLobby`
- Allows players to enter a **Room Code** (e.g., `SALA1`), **Agent Name**, and select a **Role**:
  - `Negotiator`
  - `IT Architect`
  - `CFO`
  - `God Mode (Solo Player)`
- Connects to the backend via `lobby-system` channel for player slot validation (max 3 players per room, except God Mode).

### 2. `Dashboard`
- **Header**: Displays current Room Code, connected Agent Name, assigned Role, and active alert banners.
- **Left Column**:
  - **Critical Damages Metrics**: Animated progress bars for Data Exfiltration (%), Patient Safety (%), Stolen Records count, Compromised Systems count, and Emergency Funds.
  - **Infrastructure Panel** *(IT Architect)*: Buttons to Deploy AI Counter-Virus, Disconnect/Reconnect Database, and Shutdown/Reconnect ICU Network.
  - **Financial Management Panel** *(CFO)*: Button to Pay Partial Ransom (-$50,000 emergency funds, -10% exfiltration).
  - **Hostile Negotiations Panel** *(Negotiator)*: Button to Stall Attackers (-5% exfiltration).
- **Right Column**:
  - **AI Crisis Advisor**: Log stream displaying AI analyst tactical advice and the **SOS Emergency Request** button.
  - **Attacker C2 Interception**: Terminal simulator showing real-time hacker shell commands and output animated via typewriter effect (`Typewriter`).
- **Real-Time Cursor Overlay**: Tracks mouse position and broadcasts coordinates across `crisis-room-cursors-{roomId}` so players can see each other's live pointers.
- **Consensus Vote Modal**: Pops up when any player starts a critical action, displaying a 10-second countdown timer and Approve/Reject buttons.
- **Game Over / Victory Overlay**: Displays final outcome (System Breached vs Threat Neutralized) with options to acknowledge and restart the room simulation.

---

## 📡 Portal SDK Integration

The frontend utilizes `@portalsdk/react` hooks to subscribe and publish to real-time channels:

```tsx
// Example: Subscribing to telemetry updates
const { messages: telemetryMessages } = useChannel<{ content: StrixxEvent }>({ 
  channelId: `hospital-telemetry-${roomId}` 
});

// Example: Broadcasting live cursor movement
sendCursor({
  content: { id: userName, name: userName, role: userRole, x: e.clientX, y: e.clientY }
});
```

---

## 🔗 Related Documentation

- 🏠 [Root README](file:///home/chelo/antigravity/PortalHack/hackathon-portal/README.md)
- ⚙️ [Backend Documentation](file:///home/chelo/antigravity/PortalHack/hackathon-portal/backend/README.md)
- 📐 [Architecture & Event Schemas](file:///home/chelo/antigravity/PortalHack/hackathon-portal/docs/ARCHITECTURE.md)
