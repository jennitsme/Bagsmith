import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthWallet } from '@/lib/auth-wallet';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const app = await prisma.miniApp.update({
      where: { id: params.id },
      data: { usageCount: { increment: 1 } },
    });

    const wallet = getAuthWallet(req);

    let config: any = {};
    try {
      config = JSON.parse(app.configJson || '{}');
    } catch {
      config = {};
    }

    let action: any = { type: 'generic', message: 'App usage recorded.' };

    if (app.type === 'referral') {
      action = {
        type: 'referral',
        message: 'Referral app joined successfully.',
        rewardBps: config.rewardBps ?? 0,
        campaignDays: config.campaignDays ?? 0,
      };
    }

    if (app.type === 'gated-access') {
      const allowed = Boolean(wallet);
      action = {
        type: 'gated-access',
        allowed,
        message: allowed
          ? 'Access granted. Wallet verified for gated app.'
          : 'Access denied. Connect and verify wallet session first.',
      };
    }

    if (app.type === 'tipping') {
      action = {
        type: 'tipping',
        message: 'Tip action initialized.',
        protocolFeeBps: config.protocolFeeBps ?? 0,
        minimumTip: config.minimumTip ?? '0',
      };
    }

    return NextResponse.json({ ok: true, appId: app.id, usageCount: app.usageCount, action });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed to use app' }, { status: 500 });
  }
}
