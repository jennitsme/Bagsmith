# Bagsmith

Bagsmith is a Bags-native mini-app builder prototype: **prompt → config → quote/swap execution → publish app → analytics proof**.

## Current MVP Scope (Frozen)
The MVP is intentionally focused on 3 high-conversion templates:
- Referral
- Tipping
- Launch Campaign

## What is implemented (real)
- Next.js App Router dashboard (Forge, Templates, Apps, Analytics, Profile/Settings)
- Wallet-based auth session (Phantom sign message + nonce verification)
- Real Bags API integration:
  - `GET /trade/quote`
  - `POST /trade/swap`
  - `POST /solana/send-transaction`
  - fee-share / claim / partner-config / token-launch helper endpoints
- Server-side signing prototype flow (dev wallet) with signer policy guardrails
- Postgres persistence (Prisma models for forge runs, apps, app events, profile/settings)
- Redis-backed rate limiting + idempotency (in-memory fallback)
- BullMQ worker for async verification refresh jobs
- Analytics summary + tx history + CSV exports

## What is NOT implemented yet
- Smart-contract factory/module deployment pipeline on-chain
- Contract verification + ownership proof system
- Full production custody model (current is prototype dev-wallet signing)
- Production-grade ranking/compliance engine

## Getting Started

### 1) Install dependencies
```bash
npm install
```

### 2) Start Postgres + Redis
```bash
docker compose up -d
```

### 3) Configure env
Copy `.env.example` and set values in `.env.local`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/bagsmith?schema=public"
REDIS_URL="redis://localhost:6379"
BAGS_API_KEY="..."
BAGS_API_BASE_URL="https://public-api-v2.bags.fm/api/v1"
BAGS_DEV_WALLET_SECRET="..." # base58-encoded 64-byte secret key
BAGSMITH_ENABLE_GLOBAL_ANALYTICS="false" # keep false for production by default
```

### 4) Run worker (separate terminal)
```bash
npm run worker
```

### 5) Run app
```bash
npm run dev
```
Open `http://localhost:3000`

### 6) Build production bundle
```bash
npm run build
npm run start
```

## Scripts
- `npm run dev` — start dev server (includes `prisma generate` + `prisma db push`)
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — ESLint
- `npm run worker` — BullMQ worker

## Submission Assets
- `SUBMISSION.md` — hackathon submission pack aligned with current implementation
- `about.md` — short project overview
