# Hackathon Portal - Crisis Room Simulator (Nocturnal StrixX)

A multiplayer, asymmetric cooperative web application built for the **Portal Hackathon**. This project simulates a live ransomware attack ("Nocturnal StrixX") on a Central Hospital's infrastructure, challenging players to coordinate as a Blue Team and manage the crisis in real-time.

## Features

*   **Multiplayer Asymmetric Roles:**
    *   **Negotiator**: Interacts with the AI Security Advisor via the SOS emergency button, and can also use the **Stall Attackers** action to delay the ransomware exfiltration.
    *   **IT Architect**: The only role with access to critical infrastructure countermeasures (e.g., disconnecting the database, shutting down the ICU network, and deploying the AI Counter-Virus).
    *   **CFO (Finance)**: The only role that can authorize partial ransom payments from the emergency funds to buy time.
*   **"Double Key" Voting System:** When a critical action is triggered by any role in a multiplayer session, a 10-second consensus vote starts. It requires at least 2 approvals from the connected players to execute.
*   **Real-time Collaborative Cursors:** Built using the **Portal SDK** presence API. See other players' cursors and roles in real-time.
*   **AI-Driven Telemetry & Advisory:** Powered by OpenAI GPT-4o-mini. The backend continuously streams realistic attacker console logs and dynamically generates internal security advice based on the game's exact current context (e.g. database status, patient safety).
*   **Survival Game Loop**: The game features a real-time Win/Loss engine. Players must balance stopping data exfiltration with keeping patient safety above 0%, buying enough time (~260 seconds) for the AI Counter-Virus to compile.
*   **God Mode (Solo Player)**: A fallback mode that grants all permissions to a single user and auto-passes all votes for easy testing and demonstrations.

## Tech Stack

*   **Frontend**: React, TypeScript, Vite, TailwindCSS, Lucide Icons.
*   **Backend**: Node.js, TypeScript, OpenAI Node SDK.
*   **Real-time Infrastructure**: Portal SDK (`@portalsdk/core`, `@portalsdk/react`).

## Prerequisites

*   Node.js & `pnpm`
*   Docker & Docker Compose (optional but recommended for full stack deployment)
*   A **Portal API Key** (`PORTAL_API_KEY`)
*   An **OpenAI API Key** (`OPENAI_API_KEY`)

## Getting Started

1.  **Environment Variables**: Create a `.env` file in the root directory:
    ```env
    PORTAL_API_KEY=pk_your_portal_key
    OPENAI_API_KEY=your_openai_key
    ```

2.  **Run with Docker**:
    ```bash
    # If using sudo, ensure you pass -E to preserve environment variables
    sudo -E docker-compose up --build -d
    ```

3.  **Run Locally (Without Docker)**:
    ```bash
    # Terminal 1 - Backend
    cd backend
    pnpm install
    pnpm dev
    
    # Terminal 2 - Frontend
    cd frontend
    pnpm install
    pnpm dev
    ```

## How to Play (Cloud Ready)

Because this project uses the **Portal SDK** for its events, the multiplayer works globally right out of the box! You do not need to code 'rooms'.
1. Deploy the Frontend (Vercel/Netlify) and Backend (Railway/Render).
2. Open the application in your browser and share the URL with your team.
3. Enter an Agent Name and select your Role in the Lobby. You will be instantly synchronized with the live game session.
4. Coordinate with your team using the Real-time Cursors.
5. Monitor the data exfiltration and patient safety. Do not let patient safety hit 0%.
6. If you are the Negotiator, request SOS advice or Stall the Attackers.
7. If you are the IT Architect or CFO, initiate critical countermeasures and vote to approve them before it's too late! Your goal is to survive until the AI Counter-Virus hits 100%.

## Hackathon Submission

This project was built to demonstrate the capabilities of the **Portal SDK** for real-time multiplayer state management, pub/sub channels, and presence features in a gamified environment.
