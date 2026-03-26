'use client';

import { useState } from 'react';

export function ClaimFeesCard({ appId }: { appId: string }) {
  const [tokenMint, setTokenMint] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const getClaimTx = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const body: any = {};
      if (tokenMint.trim()) body.tokenMint = tokenMint.trim();

      const res = await fetch(`/api/apps/${appId}/fees/claim-tx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to get claim tx');

      setMsg('Claim transaction(s) generated. Check payload response in API/network logs as needed.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed to get claim tx');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brutal-border bg-[var(--surface)] p-4 space-y-3">
      <h3 className="font-bold uppercase">Claim Fee Flow</h3>
      <input value={tokenMint} onChange={(e) => setTokenMint(e.target.value)} placeholder="Optional token mint" className="w-full bg-[var(--bg)] brutal-border px-3 py-2 font-mono text-xs" />
      <button onClick={getClaimTx} disabled={loading} className="px-3 py-2 brutal-border bg-white text-black font-bold text-xs disabled:opacity-50">
        {loading ? 'Generating...' : 'Get Claim Transactions (v3)'}
      </button>
      {msg && <div className="font-mono text-xs text-[var(--text-muted)]">{msg}</div>}
    </div>
  );
}
