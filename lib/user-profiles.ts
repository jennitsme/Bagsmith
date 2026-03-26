import { promises as fs } from 'fs';
import path from 'path';

export type UserProfile = {
  wallet: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'user-profiles.json');

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, '{}', 'utf8');
  }
}

async function readAll(): Promise<Record<string, UserProfile>> {
  await ensureStore();
  const raw = await fs.readFile(FILE, 'utf8');
  const parsed = JSON.parse(raw);
  return parsed && typeof parsed === 'object' ? parsed : {};
}

async function writeAll(data: Record<string, UserProfile>) {
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), 'utf8');
}

function shortWallet(wallet: string) {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export async function getOrCreateProfile(wallet: string): Promise<UserProfile> {
  const all = await readAll();
  if (all[wallet]) return all[wallet];

  const profile: UserProfile = {
    wallet,
    displayName: shortWallet(wallet),
    bio: '',
    avatarUrl: '',
    updatedAt: new Date().toISOString(),
  };

  all[wallet] = profile;
  await writeAll(all);
  return profile;
}

export async function updateProfile(wallet: string, patch: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'avatarUrl'>>) {
  const all = await readAll();
  const current = all[wallet] || (await getOrCreateProfile(wallet));
  const next: UserProfile = {
    ...current,
    displayName: (patch.displayName ?? current.displayName).slice(0, 60),
    bio: (patch.bio ?? current.bio).slice(0, 240),
    avatarUrl: (patch.avatarUrl ?? current.avatarUrl).slice(0, 500),
    updatedAt: new Date().toISOString(),
  };
  all[wallet] = next;
  await writeAll(all);
  return next;
}
