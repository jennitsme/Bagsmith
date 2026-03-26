import { NextRequest, NextResponse } from 'next/server';
import { enforceConfigPolicy, generateStructuredConfig } from '@/lib/app-config-generator';
import { generateConfigWithAI } from '@/lib/ai-config';
import type { AppType } from '@/lib/mini-apps';

function isAppType(v: string): v is AppType {
  return ['referral', 'gated-access', 'tipping', 'launch-campaign', 'loyalty'].includes(v);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const type = String(body?.type || '');
  const prompt = String(body?.prompt || '');

  if (!isAppType(type)) return NextResponse.json({ ok: false, error: 'Invalid app type.' }, { status: 400 });
  if (!prompt.trim()) return NextResponse.json({ ok: false, error: 'Prompt is required.' }, { status: 400 });

  const cleanPrompt = prompt.trim();

  const deterministic = generateStructuredConfig(type, cleanPrompt);
  const aiConfig = await generateConfigWithAI(type, cleanPrompt).catch(() => null);
  const config = enforceConfigPolicy(type, (aiConfig || deterministic) as Record<string, unknown>, cleanPrompt);

  return NextResponse.json({
    ok: true,
    type,
    config,
    source: aiConfig ? 'ai+policy' : 'deterministic+policy',
  });
}
