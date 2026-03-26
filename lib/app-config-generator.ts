import type { AppType } from '@/lib/mini-apps';

function extractNumber(prompt: string, fallback: number) {
  const m = prompt.match(/(\d{1,4})/);
  return m ? Number(m[1]) : fallback;
}

export function generateStructuredConfig(type: AppType, prompt: string) {
  const p = prompt.toLowerCase();

  if (type === 'referral') {
    const rewardBps = p.includes('%') ? extractNumber(p, 5) * 100 : 500;
    const campaignDays = p.includes('day') ? extractNumber(p, 30) : 30;
    return {
      rewardBps: Math.min(2000, Math.max(50, rewardBps)),
      campaignDays: Math.min(365, Math.max(1, campaignDays)),
      antiAbuse: true,
      leaderboard: true,
      inviteThreshold: p.includes('invite') ? extractNumber(p, 3) : 3,
      notes: prompt.slice(0, 220),
    };
  }

  if (type === 'gated-access') {
    return {
      nftCollection: 'REQUIRED_BY_OWNER',
      accessRule: p.includes('allowlist') ? 'allowlist-or-holder' : 'holder-only',
      allowlistFallback: true,
      premiumAction: 'view-alpha-content',
      notes: prompt.slice(0, 220),
    };
  }

  if (type === 'tipping') {
    const fee = p.includes('%') ? extractNumber(p, 1) * 100 : 100;
    return {
      protocolFeeBps: Math.min(1000, Math.max(0, fee)),
      minimumTip: String(p.includes('min') ? extractNumber(p, 1000) : 1000),
      distribution: 'creator-primary',
      notes: prompt.slice(0, 220),
    };
  }

  if (type === 'launch-campaign') {
    return {
      airdropPool: '1000000',
      questCountRequired: p.includes('quest') ? extractNumber(p, 3) : 3,
      campaignDays: p.includes('day') ? extractNumber(p, 14) : 14,
      verificationMode: 'onchain-action-based',
      notes: prompt.slice(0, 220),
    };
  }

  return {
    tierThresholds: [1000, 5000, 20000],
    tierRewardsBps: [50, 100, 200],
    scoreMode: 'volume-weighted',
    notes: prompt.slice(0, 220),
  };
}

function num(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function enforceConfigPolicy(type: AppType, candidate: Record<string, unknown>, prompt: string) {
  const fallback = generateStructuredConfig(type, prompt);

  if (type === 'referral') {
    return {
      rewardBps: Math.min(2000, Math.max(50, Math.floor(num(candidate.rewardBps, (fallback as any).rewardBps)))),
      campaignDays: Math.min(365, Math.max(1, Math.floor(num(candidate.campaignDays, (fallback as any).campaignDays)))),
      antiAbuse: Boolean(candidate.antiAbuse ?? true),
      leaderboard: Boolean(candidate.leaderboard ?? true),
      inviteThreshold: Math.min(100, Math.max(1, Math.floor(num(candidate.inviteThreshold, (fallback as any).inviteThreshold)))),
      notes: String(candidate.notes ?? (fallback as any).notes).slice(0, 220),
    };
  }

  if (type === 'gated-access') {
    const accessRule = String(candidate.accessRule || (fallback as any).accessRule);
    return {
      nftCollection: String(candidate.nftCollection || (fallback as any).nftCollection).slice(0, 120),
      accessRule: ['holder-only', 'allowlist-or-holder'].includes(accessRule) ? accessRule : 'holder-only',
      allowlistFallback: Boolean(candidate.allowlistFallback ?? true),
      premiumAction: String(candidate.premiumAction || (fallback as any).premiumAction).slice(0, 80),
      notes: String(candidate.notes ?? (fallback as any).notes).slice(0, 220),
    };
  }

  if (type === 'tipping') {
    return {
      protocolFeeBps: Math.min(1000, Math.max(0, Math.floor(num(candidate.protocolFeeBps, (fallback as any).protocolFeeBps)))),
      minimumTip: String(candidate.minimumTip ?? (fallback as any).minimumTip).replace(/[^0-9]/g, '').slice(0, 16) || '1000',
      distribution: String(candidate.distribution ?? (fallback as any).distribution).slice(0, 80),
      notes: String(candidate.notes ?? (fallback as any).notes).slice(0, 220),
    };
  }

  if (type === 'launch-campaign') {
    return {
      airdropPool: String(candidate.airdropPool ?? (fallback as any).airdropPool).replace(/[^0-9]/g, '').slice(0, 20) || '1000000',
      questCountRequired: Math.min(20, Math.max(1, Math.floor(num(candidate.questCountRequired, (fallback as any).questCountRequired)))),
      campaignDays: Math.min(120, Math.max(1, Math.floor(num(candidate.campaignDays, (fallback as any).campaignDays)))),
      verificationMode: String(candidate.verificationMode ?? (fallback as any).verificationMode).slice(0, 60),
      notes: String(candidate.notes ?? (fallback as any).notes).slice(0, 220),
    };
  }

  const tiers = Array.isArray(candidate.tierThresholds) ? candidate.tierThresholds : (fallback as any).tierThresholds;
  const rewards = Array.isArray(candidate.tierRewardsBps) ? candidate.tierRewardsBps : (fallback as any).tierRewardsBps;

  return {
    tierThresholds: tiers.map((x: unknown) => Math.max(1, Math.floor(num(x, 1000)))).slice(0, 10),
    tierRewardsBps: rewards.map((x: unknown) => Math.max(0, Math.min(2000, Math.floor(num(x, 100))))).slice(0, 10),
    scoreMode: String(candidate.scoreMode ?? (fallback as any).scoreMode).slice(0, 40),
    notes: String(candidate.notes ?? (fallback as any).notes).slice(0, 220),
  };
}
