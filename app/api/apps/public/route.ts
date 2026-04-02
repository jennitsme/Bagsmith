import { NextResponse } from 'next/server';
import { listPublicMiniApps } from '@/lib/mini-apps';

export async function GET() {
  const apps = await listPublicMiniApps();
  const safeApps = apps.map((a) => ({
    id: a.id,
    title: a.title,
    type: a.type,
    description: a.description,
    txProof: a.txProof,
    feeShareBps: a.feeShareBps,
    status: a.status,
    usageCount: a.usageCount,
    ownerWallet: a.ownerWallet,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));

  return NextResponse.json({ ok: true, apps: safeApps });
}
