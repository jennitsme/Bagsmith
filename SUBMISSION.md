# Bagsmith — Bags Hackathon Submission Pack

## 1) Project Name
**Bagsmith**

## 2) One-liner
Bagsmith is an AI-powered builder pipeline on Bags that turns prompts into real, executable on-chain workflows with measurable traction logs and analytics.

## 3) Problem
Launching and validating crypto mini-app ideas is still slow and fragmented:
- Builders jump across tooling for ideation, quoting, execution, and tracking
- Most demos stop at mock UI with no verifiable on-chain proof
- Hackathon teams struggle to show real traction evidence quickly

## 4) Solution
Bagsmith provides one integrated flow:
1. Prompt intake for mini-app intent
2. Real quote retrieval via Bags API
3. Optional swap execution (create tx -> sign -> send)
4. Persistent run logging
5. Real analytics dashboard + CSV export for proof

This converts idea-to-execution into a single, auditable pipeline.

## 5) What is live and real (not mock)
- Real Bags API integration for trade quotes
- Real swap transaction creation
- Real signing flow (server-side dev wallet for prototype)
- Real transaction submission with signature output
- Persistent logs of successful and failed runs
- Real analytics from stored logs (24h/7d/30d/all)
- CSV export endpoint for submission evidence

## 6) Architecture (High-level)
- **Frontend:** Next.js + React + TypeScript
- **Backend API routes:**
  - `POST /api/bags/forge`
  - `POST /api/bags/quote`
  - `POST /api/bags/swap/execute`
  - `GET /api/analytics/summary?range=...`
  - `GET /api/analytics/export?range=...`
- **Integration layer:** `lib/bags-client.ts`
- **Signing layer:** `lib/dev-wallet.ts`
- **Persistence layer:** `lib/forge-logs.ts` -> `data/forge-logs.json`

## 7) Key features delivered
- End-to-end execution mode (`quote-only` and `execute`)
- Live pipeline statuses and transaction signatures
- Failure capture for reliability debugging
- Real metrics surfaced to Analytics tab

## 8) Traction proof checklist
- [ ] At least N successful execute runs in last 7d
- [ ] CSV export attached (`/api/analytics/export?range=7d`)
- [ ] Screenshots: Forge success states + Analytics stats
- [ ] At least 3 valid transaction signatures documented
- [ ] Demo video (60–90s) showing end-to-end real flow

## 9) Security and risk notes
Current prototype uses server-side signing with a dev wallet for speed.
Before production:
- Move to non-custodial or delegated signing flow
- Use a dedicated project wallet with strict limits
- Rotate leaked/shared keys immediately
- Add request auth/rate limits + stronger validation
- Add encrypted secret management in deployment

## 10) How to run locally
```bash
cd /Users/possboy22/.openclaw/workspace/Bagsmith
npm install
npm run dev
```
Open: `http://localhost:3000`

Required local env (`.env.local`):
```env
BAGS_API_KEY=...
BAGS_API_BASE_URL=https://public-api-v2.bags.fm/api/v1
BAGS_DEV_WALLET_SECRET=... # base58 64-byte secret key
```

## 11) Suggested demo script (60–90s)
1. Open Forge tab and enter prompt + token pair + amount
2. Run in quote-only mode (show real quote response)
3. Enable execute mode and run again
4. Show returned transaction signature
5. Open Analytics tab, refresh, show updated metrics
6. Click Export CSV and show proof artifact

## 12) Why this should rank
- Ships beyond mock UI into real on-chain execution
- Provides verifiable evidence (signatures + analytics + CSV)
- Aligned with hackathon evaluation around traction and real usage

---
Prepared by: Bagsmith Team
Date: 2026-03-26
