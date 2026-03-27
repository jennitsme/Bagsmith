# Bagsmith — Bags Hackathon Submission Pack

## 1) Project Name
**Bagsmith**

## 2) One-liner
Bagsmith is a Bags-native builder prototype that turns prompts into executable mini-app flows with real transaction evidence and analytics exports.

## 3) Problem
Launching and validating crypto mini-app ideas is still fragmented:
- Builders switch between generation, execution, and tracking tools
- Many demos stop at UI mockups without auditable tx-level proof
- Teams struggle to produce traction evidence quickly

## 4) Solution
Bagsmith provides one integrated loop:
1. Prompt intake
2. Structured config generation (AI-assisted + policy guardrails)
3. Real quote retrieval via Bags API
4. Optional swap execution (create tx → sign → send)
5. Publish as mini-app artifact
6. Track usage and export analytics/tx history as evidence

## 5) MVP Scope (frozen)
Current MVP intentionally focuses on 3 templates:
- Referral
- Tipping
- Launch Campaign

## 6) What is live and real (not mock)
- Real Bags API quote integration
- Real swap transaction creation flow
- Real signing + transaction submission flow (prototype server-side signer)
- Persistent storage for forge runs, apps, and app events (Postgres + Prisma)
- Wallet-authenticated session flow (nonce + signature)
- Rate-limit + idempotency controls on execute paths
- Analytics summary + tx history + CSV export endpoints
- Async verification refresh via Redis/BullMQ worker

## 7) What is currently prototype / not implemented yet
- Smart contract factory/module deployment system
- On-chain contract verification and ownership-proof layer
- Non-custodial production signing architecture
- Full compliance/ranking engine

## 8) Architecture (current implementation)
- **Frontend:** Next.js App Router + React + TypeScript
- **Backend/API:** Next.js route handlers
- **Persistence:** Postgres + Prisma
- **Queue:** Redis + BullMQ worker
- **Integration layer:** `lib/bags-client.ts`
- **Signing layer:** `lib/dev-wallet.ts` + signer policy guardrails

Key routes:
- `POST /api/bags/forge`
- `POST /api/bags/quote`
- `POST /api/bags/swap/execute`
- `POST /api/apps/publish`
- `GET /api/analytics/summary?range=...&scope=...`
- `GET /api/integrations/bags/tx-history/export?scope=...`

## 9) Security Notes (current)
- Wallet session verification with signed nonce challenge
- Route-level owner checks for app-sensitive actions
- Rate limits + idempotency to reduce accidental replay/abuse
- Signer policy: allowed mint routes + max amount constraint

Prototype caveat:
- Current execute flow uses server-side dev wallet signing for speed.

## 10) Traction Proof Checklist
- [ ] Run at least N execute transactions
- [ ] Collect valid tx signatures from successful runs
- [ ] Export CSV evidence from analytics and tx-history endpoints
- [ ] Capture screenshots of Forge + Apps + Analytics
- [ ] Record 60–90s demo showing full loop

## 11) Local Run
```bash
cd /Users/possboy22/.openclaw/workspace/Bagsmith
npm install
docker compose up -d
npm run worker
npm run dev
```

Required env (`.env.local`):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/bagsmith?schema=public
REDIS_URL=redis://localhost:6379
BAGS_API_KEY=...
BAGS_API_BASE_URL=https://public-api-v2.bags.fm/api/v1
BAGS_DEV_WALLET_SECRET=... # base58 64-byte secret key
```

## 12) Demo Script (60–90s)
1. Load one MVP template (referral/tipping/launch-campaign)
2. Generate config from prompt
3. Run quote-only once, then execute mode once
4. Show returned transaction signature
5. Publish run into app directory
6. Show analytics update and export CSV

---
Prepared by: Bagsmith Team  
Date: 2026-03-27
