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
