# 🚨 Nocturnal StrixX - Crisis Room Simulator

[![Portal SDK](https://img.shields.io/badge/Portal_SDK-v0.1.5-blue.svg)](https://portal.dev)
[![React](https://img.shields.io/badge/React-v18.3-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.6-3178c6.svg)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933.svg)](https://nodejs.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.3-38bdf8.svg)](https://tailwindcss.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991.svg)](https://openai.com)

A multiplayer, asymmetric cooperative real-time web application built for the **Portal Hackathon**. 

**Nocturnal StrixX** simulates a live, high-stakes ransomware attack on Central Hospital's IT infrastructure. Players must join a crisis room, pick specialized blue-team roles, coordinate in real time using live cursor tracking, manage emergency finances, and execute critical countermeasures via a consensus-based voting engine before data exfiltration reaches 100% or patient safety drops to 0%.

---

## 📌 Table of Contents

- [Overview & Gameplay](#-overview--gameplay)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Repository Structure](#-repository-structure)
- [Environment Configuration](#-environment-configuration)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Method 1: Docker Compose (Recommended)](#method-1-docker-compose-recommended)
  - [Method 2: Local Development (pnpm)](#method-2-local-development-pnpm)
- [Asymmetric Team Roles](#-asymmetric-team-roles)
- [Consensus Voting Engine](#-consensus-voting-engine)
- [Cloud & AWS Deployment](#-cloud--aws-deployment)
- [Documentation Index](#-documentation-index)

---

## 🎮 Overview & Gameplay

When the Nocturnal StrixX ransomware breaches Central Hospital:
1. **Lobby & Room Code**: Players enter a Room Code (e.g., `SALA1`) and select an Agent Name along with their assigned Role.
2. **Real-time Telemetry**: The backend broadcasts live telemetry every 20 seconds, updating stolen record counts, compromised systems, exfiltration percentage, patient safety, and simulated attacker C2 terminal commands generated dynamically by **OpenAI GPT-4o-mini**.
3. **Countermeasure & Survival Loop**: The IT Architect initiates the **AI Counter-Virus**, which takes ~260 seconds to compile. The team must survive until compilation reaches 100%.
4. **Win/Loss Engine**:
   - 🏆 **WIN**: AI Counter-Virus reaches 100%.
   - 💀 **LOSS**: Data Exfiltration reaches 100% OR Patient Safety hits 0%.

---

## 🔥 Key Features

- 👥 **Multiplayer Multi-Room Lobby**: Infinite isolated game sessions synced over the **Portal SDK** pub/sub network.
- 🖱️ **Live Collaborative Cursors**: Track teammates' cursor movements and roles in real time (`crisis-room-cursors-{roomId}`).
- 🤝 **"Double Key" Consensus Voting**: Major infrastructure actions require 2 approvals within a 10-second window.
- 🧠 **AI Attacker & SOS Advisory**:
  - Attacker console logs are generated dynamically based on system context (e.g., database status, ICU status).
  - Negotiators can trigger up to 3 **SOS Emergency Requests** per session to receive contextual tactical advice from an AI Security Analyst.
- ⚡ **God Mode (Solo Testing)**: Instant single-player fallback mode that auto-approves all votes for rapid testing and demonstrations.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client ["Frontend (React + Vite + TailwindCSS)"]
        UI[Dashboard & Lobby]
        Cursor[Portal SDK Presence / Cursors]
        VoteUI[Consensus Vote Modal]
    end

    subgraph PortalSDK ["Portal SDK Pub/Sub Network"]
        LobbyCh["lobby-system / lobby-events-*"]
        TelemCh["hospital-telemetry-{roomId}"]
        ActionsCh["crisis-room-actions-{roomId}"]
        CursorCh["crisis-room-cursors-{roomId}"]
        AdvisoryCh["internal-advisory-{roomId}"]
        SosCh["sos-requests"]
    end

    subgraph Server ["Backend Engine (Node.js + TypeScript)"]
        GameServer[GameServer Manager]
        Room[Room Instance Engine]
        AI[OpenAI GPT-4o-mini Integration]
    end

    UI <--> LobbyCh
    UI <--> ActionsCh
    UI <--> CursorCh
    UI <-- TelemCh
    UI <-- AdvisoryCh
    UI --> SosCh

    Room <--> ActionsCh
    Room --> TelemCh
    Room --> AdvisoryCh
    GameServer <--> LobbyCh
    GameServer <--> SosCh
    Room <--> AI
```

---

## 📁 Repository Structure

```
hackathon-portal/
├── backend/                  # Node.js + TypeScript backend engine
│   ├── Dockerfile            # Container definition for backend
│   ├── package.json          # Dependencies (@portalsdk/core, openai, ws)
│   └── src/
│       └── index.ts          # Main game engine, room manager & SDK channels
├── frontend/                 # React + Vite + TailwindCSS frontend
│   ├── Dockerfile            # Multi-stage Nginx container definition
│   ├── package.json          # Dependencies (@portalsdk/react, lucide-react)
│   └── src/
│       ├── App.tsx           # React UI, hooks, voting & cursor overlay
│       ├── main.tsx          # Application entry point
│       └── index.css         # Global TailwindCSS styles
├── terraform/                # Infrastructure as Code (AWS ECS + CloudFront)
│   ├── main.tf               # VPC & Subnet configuration
│   ├── ecs.tf                # ECS Fargate Service & Task Definition
│   ├── cloudfront.tf         # CloudFront CDN & S3 Frontend bucket
│   └── security.tf           # Security groups & IAM roles
├── docker-compose.yml        # Orchestration for local development
├── .env.example              # Template for required environment variables
└── docs/
    └── ARCHITECTURE.md       # Technical event schemas & sequence diagrams
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
# Portal SDK API Key (Required for backend & frontend)
PORTAL_API_KEY=pk_your_portal_api_key_here

# OpenAI API Key (Required for dynamic attacker logs & SOS advisor)
OPENAI_API_KEY=sk-your_openai_api_key_here

# Frontend Portal API Key (Required when running frontend directly)
VITE_PORTAL_API_KEY=pk_your_portal_api_key_here
```

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `PORTAL_API_KEY` | Backend / Root | Portal SDK authentication key for server channels |
| `OPENAI_API_KEY` | Backend | Key used for GPT-4o-mini telemetry & advisor prompts |
| `VITE_PORTAL_API_KEY` | Frontend | Portal SDK client key for Vite frontend build |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+ and **pnpm** v10+
- **Docker** & **Docker Compose** (for containerized deployment)
- **Terraform** v1.5+ & **AWS CLI** (for AWS cloud deployment)

### Method 1: Docker Compose (Recommended)

1. Clone the repository and navigate to `hackathon-portal`:
   ```bash
   cd hackathon-portal
   ```
2. Copy the environment template and fill in your keys:
   ```bash
   cp .env.example .env
   # Edit .env with your PORTAL_API_KEY and OPENAI_API_KEY
   ```
3. Launch services:
   ```bash
   docker-compose up --build -d
   ```
4. Access the portal at [http://localhost:8081](http://localhost:8081).

### Method 2: Local Development (pnpm)

1. **Start the Backend**:
   ```bash
   cd backend
   pnpm install
   pnpm dev
   ```
2. **Start the Frontend** (in a separate terminal):
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```
3. Open the Vite dev URL displayed in the terminal (typically `http://localhost:5173`).

---

## 🎭 Asymmetric Team Roles

| Role | Primary Responsibility | Exclusive Actions | Strategic Trade-offs |
| :--- | :--- | :--- | :--- |
| 📞 **Negotiator** | Attacker stalling & SOS AI liaison | • **Stall Attackers** (-5% exfiltration)<br>• **SOS Emergency Request** (AI Advice) | Buys precious time; maximum 3 SOS advice requests per session. |
| 🛡️ **IT Architect** | Infrastructure & Countermeasures | • **Deploy AI Counter-Virus**<br>• **Disconnect / Reconnect DB**<br>• **Shutdown / Reconnect ICU** | Disconnecting DB stops exfiltration but lowers patient safety. Shutting down ICU reduces infection speed but hurts patients. |
| 💰 **CFO (Finance)** | Emergency budget management | • **Pay Partial Ransom** (-$50k funds, -10% exfiltration) | Directly reduces exfiltration progress using limited emergency funds ($250,000 start). |
| 👑 **God Mode** | Solo testing & demo mode | • Access all actions<br>• Auto-passes consensus votes | Bypasses room size limits and voting delay. |

---

## 🗳️ Consensus Voting Engine

To execute critical actions in multiplayer mode, the team uses a **Double-Key Consensus Engine**:

1. Any player initiates a critical action (e.g., *Disconnect Database*).
2. The server broadcasts a `vote_started_sync` event and starts a **10-second timer**.
3. A modal opens on all connected players' screens.
4. Requires **2 positive votes (approvals)** to pass.
5. Upon approval, the server executes the action state change and broadcasts `vote_result`.

---

## ☁️ Cloud & AWS Deployment

The project includes complete Terraform configurations to deploy to AWS ECS Fargate and AWS S3/CloudFront.

For detailed instructions, see the [Terraform Deployment Guide](file:///home/chelo/antigravity/PortalHack/hackathon-portal/terraform/README.md).

---

## 📚 Documentation Index

- 📘 [Frontend Technical Documentation](file:///home/chelo/antigravity/PortalHack/hackathon-portal/frontend/README.md)
- 📙 [Backend Technical Documentation](file:///home/chelo/antigravity/PortalHack/hackathon-portal/backend/README.md)
- 🛠️ [Terraform AWS Infrastructure Guide](file:///home/chelo/antigravity/PortalHack/hackathon-portal/terraform/README.md)
- 📐 [Architecture Diagrams & Event Schemas](file:///home/chelo/antigravity/PortalHack/hackathon-portal/docs/ARCHITECTURE.md)

---

## 🏆 Hackathon Submission Notice

This repository was created for the **Portal Hackathon** to demonstrate real-time multiplayer application capabilities using `@portalsdk/core` and `@portalsdk/react`.
