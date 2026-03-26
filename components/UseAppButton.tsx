'use client';

import { useState } from 'react';

export function UseAppButton({ appId }: { appId: string }) {
  const [loading, setLoading] = useState(false);
  const [executeOnchain, setExecuteOnchain] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onUse = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/apps/${appId}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executeOnchain }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to use app');

      const actionMsg = data?.action?.message ? ` · ${data.action.message}` : '';
      const onchainSig = data?.action?.onchain?.signature ? ` · tx: ${data.action.onchain.signature}` : '';
      setMsg(`Success. Usage count: ${data.usageCount}${actionMsg}${onchainSig}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed to use app');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 font-mono text-xs text-[var(--text-muted)]">
        <input type="checkbox" checked={executeOnchain} onChange={(e) => setExecuteOnchain(e.target.checked)} />
        Execute on-chain action (for tipping apps)
      </label>
      <button onClick={onUse} disabled={loading} className="px-4 py-2 brutal-border bg-[var(--neon)] text-black font-bold uppercase text-sm disabled:opacity-50">
        {loading ? 'Processing...' : 'Use App'}
      </button>
      {msg && <div className="font-mono text-xs text-[var(--text-muted)] break-all">{msg}</div>}
    </div>
  );
}
