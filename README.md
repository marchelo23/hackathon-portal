# Hackathon Portal - Crisis Room Simulator (Nocturnal StrixX)

A multiplayer, asymmetric cooperative web application built for the **Portal Hackathon**. This project simulates a live ransomware attack ("Nocturnal StrixX") on a Central Hospital's infrastructure, challenging players to coordinate as a Blue Team and manage the crisis in real-time.

## Features

*   **Multiplayer Asymmetric Roles:**
    *   **Negotiator**: The only role capable of interacting with the AI Security Advisor via the SOS emergency button.
    *   **IT Architect**: The only role with access to critical infrastructure countermeasures (e.g., disconnecting the database, shutting down the ICU network).
    *   **CFO (Finance)**: The only role that can authorize partial ransom payments from the emergency funds.
*   **"Double Key" Voting System:** When a critical action is triggered by the IT Architect or CFO, a 10-second consensus vote starts. It requires at least 2 approvals from the connected players to execute.
*   **Real-time Collaborative Cursors:** Built using the **Portal SDK** presence API. See other players' cursors and roles in real-time.
*   **AI-Driven Telemetry & Advisory:** Powered by Gemini. The backend continuously streams realistic attacker console logs and dynamically generates internal security advice based on the game's current context.
*   **God Mode (Solo Player)**: A fallback mode that grants all permissions to a single user for easy testing and demonstrations.

## Tech Stack

*   **Frontend**: React, TypeScript, Vite, TailwindCSS, Lucide Icons.
*   **Backend**: Node.js, TypeScript, Google Gen AI SDK.
*   **Real-time Infrastructure**: Portal SDK (`@portalsdk/core`, `@portalsdk/react`).

## Prerequisites

*   Node.js & `pnpm`
*   Docker & Docker Compose (optional but recommended for full stack deployment)
*   A **Portal API Key** (`PORTAL_API_KEY`)
*   A **Gemini API Key** (`GEMINI_API_KEY`)

## Getting Started

1.  **Environment Variables**: Create a `.env` file in the root directory:
    ```env
    PORTAL_API_KEY=pk_your_portal_key
    GEMINI_API_KEY=your_gemini_key
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

## How to Play

1.  Open the application in your browser (usually `http://localhost:5173`).
2.  Enter an Agent Name and select your Role in the Lobby.
3.  Coordinate with your team using the Real-time Cursors.
4.  Monitor the data exfiltration and compromised systems.
5.  If you are the Negotiator, request SOS advice.
6.  If you are the IT Architect or CFO, initiate critical countermeasures and vote to approve them before it's too late!

## Hackathon Submission

This project was built to demonstrate the capabilities of the **Portal SDK** for real-time multiplayer state management, pub/sub channels, and presence features in a gamified environment.
