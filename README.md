# Bagsmith

Bagsmith is an AI-powered app factory for Bags that helps users turn prompts into crypto mini-apps.

## What it does

- Generate mini-app logic from a plain-language prompt
- Simulate deployment flow for smart contracts and fee-sharing setup
- Provide a clean dashboard-style UI for forging app ideas quickly

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Motion + Lucide icons

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Start Postgres + Redis (Docker)

```bash
docker compose up -d
```

### 3) Run worker (separate terminal)

```bash
npm run worker
```

### 4) Run in development

```bash
npm run dev
```

Open: `http://localhost:3000`

### 5) Build for production

```bash
npm run build
npm run start
```

## Scripts

- `npm run dev` — start dev server
- `npm run build` — build production bundle
- `npm run start` — run production server
- `npm run lint` — run ESLint

## Project Goal

Bagsmith is designed to make Web3 product creation faster by combining AI-assisted generation, deployment workflows, and monetization primitives around the Bags ecosystem.

## Hackathon Submission Assets

- `SUBMISSION.md` — complete submission pack (architecture, proof checklist, demo script)
- `HACKATHON_FORM_ANSWERS.md` — draft copy-paste answers for application form
