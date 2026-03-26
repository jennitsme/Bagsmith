import { prisma } from '@/lib/prisma';

export async function assertAppOwnership(appId: string, wallet: string) {
  const app = await prisma.miniApp.findUnique({ where: { id: appId } });
  if (!app) throw new Error('App not found');
  if (app.ownerWallet !== wallet) throw new Error('Forbidden: only app owner can perform this action');
  return app;
}
