import { prisma } from '@/lib/prisma';

export type UserProfile = {
  wallet: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  updatedAt: string;
};

function shortWallet(wallet: string) {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export async function getOrCreateProfile(wallet: string): Promise<UserProfile> {
  let profile = await prisma.userProfile.findUnique({ where: { wallet } });
  if (!profile) {
    profile = await prisma.userProfile.create({
      data: { wallet, displayName: shortWallet(wallet), bio: '', avatarUrl: '' },
    });
  }
  return { ...profile, updatedAt: profile.updatedAt.toISOString() };
}

export async function updateProfile(wallet: string, patch: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'avatarUrl'>>) {
  await getOrCreateProfile(wallet);
  const next = await prisma.userProfile.update({
    where: { wallet },
    data: {
      displayName: (patch.displayName ?? undefined)?.slice(0, 60),
      bio: (patch.bio ?? undefined)?.slice(0, 240),
      avatarUrl: (patch.avatarUrl ?? undefined)?.slice(0, 500),
    },
  });
  return { ...next, updatedAt: next.updatedAt.toISOString() };
}

export async function getOrCreateSettings(wallet: string) {
  let s = await prisma.userSetting.findUnique({ where: { wallet } });
  if (!s) {
    s = await prisma.userSetting.create({ data: { wallet } });
  }
  return s;
}

export async function updateSettings(
  wallet: string,
  patch: Partial<{ deploymentAlerts: boolean; weeklyAnalytics: boolean; securityWarnings: boolean }>
) {
  await getOrCreateSettings(wallet);
  return prisma.userSetting.update({
    where: { wallet },
    data: {
      deploymentAlerts: typeof patch.deploymentAlerts === 'boolean' ? patch.deploymentAlerts : undefined,
      weeklyAnalytics: typeof patch.weeklyAnalytics === 'boolean' ? patch.weeklyAnalytics : undefined,
      securityWarnings: typeof patch.securityWarnings === 'boolean' ? patch.securityWarnings : undefined,
    },
  });
}
