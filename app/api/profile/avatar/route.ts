import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

import { getAuthWallet } from '@/lib/auth-wallet';
import { updateProfile } from '@/lib/user-profiles';

export async function POST(req: NextRequest) {
  try {
    const wallet = getAuthWallet(req);
    if (!wallet) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'No file uploaded.' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ ok: false, error: 'Only image files are allowed.' }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: 'Max file size is 2MB.' }, { status: 400 });
    }

    const ext = file.type.split('/')[1] || 'png';
    const safeWallet = wallet.replace(/[^a-zA-Z0-9]/g, '');
    const fileName = `${safeWallet}-${Date.now()}.${ext}`;

    const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await fs.mkdir(dir, { recursive: true });

    const bytes = await file.arrayBuffer();
    await fs.writeFile(path.join(dir, fileName), Buffer.from(bytes));

    const avatarUrl = `/uploads/avatars/${fileName}`;
    const profile = await updateProfile(wallet, { avatarUrl });

    return NextResponse.json({ ok: true, avatarUrl, profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
