import { notFound } from 'next/navigation';
import { UseAppButton } from '@/components/UseAppButton';
import { BagsNativeWizard } from '@/components/BagsNativeWizard';

async function getApp(id: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/apps/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.app || null;
}

export default async function AppDetailPage({ params }: { params: { id: string } }) {
  const app = await getApp(params.id);
  if (!app) return notFound();

  const config = (() => {
    try {
      return JSON.parse(app.configJson || '{}');
    } catch {
      return {};
    }
  })();

  return (
    <div className="min-h-screen p-6 md:p-10 bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="text-xs font-mono text-[var(--neon)] uppercase">{app.type}</div>
        <h1 className="text-3xl font-bold uppercase tracking-tight">{app.title}</h1>
        <p className="text-[var(--text-muted)] font-mono">{app.description}</p>

        <div className="brutal-border bg-[var(--surface)] p-4 font-mono text-sm space-y-2">
          <div>Owner Wallet: <span className="break-all">{app.ownerWallet}</span></div>
          <div>Bags Fee Share: {app.feeShareBps} bps</div>
          <div>Bags Deployment Status: {app.status}</div>
          {app.txProof && (
            <div className="break-all text-green-400">
              Bags Tx Proof:{' '}
              <a href={`https://solscan.io/tx/${app.txProof}`} target="_blank" rel="noreferrer" className="underline">
                {app.txProof}
              </a>
            </div>
          )}
        </div>

        <div className="brutal-border bg-[var(--surface)] p-4">
          <h2 className="font-bold uppercase mb-2">App Config</h2>
          <pre className="font-mono text-xs overflow-auto">{JSON.stringify(config, null, 2)}</pre>
        </div>

        <UseAppButton appId={app.id} />
        <BagsNativeWizard appId={app.id} />
      </div>
    </div>
  );
}
