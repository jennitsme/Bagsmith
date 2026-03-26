'use client';

import { useState } from 'react';

export function FeeShareSetupCard({ appId }: { appId: string }) {
  const [baseMint, setBaseMint] = useState('');
  const [claimers, setClaimers] = useState('');
  const [bps, setBps] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const setup = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const claimersArray = claimers.split(',').map((s) => s.trim()).filter(Boolean);
      const basisPointsArray = bps.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));

      const res = await fetch(`/api/apps/${appId}/fee-sharing/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseMint, claimersArray, basisPointsArray }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Fee-share setup failed');

      setMsg('Fee-share setup transaction created successfully.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Fee-share setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brutal-border bg-[var(--surface)] p-4 space-y-3">
      <h3 className="font-bold uppercase">Fee Sharing Setup (Bags)</h3>
      <input value={baseMint} onChange={(e) => setBaseMint(e.target.value)} placeholder="Base mint" className="w-full bg-[var(--bg)] brutal-border px-3 py-2 font-mono text-xs" />
      <input value={claimers} onChange={(e) => setClaimers(e.target.value)} placeholder="Claimers CSV (wallet1,wallet2)" className="w-full bg-[var(--bg)] brutal-border px-3 py-2 font-mono text-xs" />
      <input value={bps} onChange={(e) => setBps(e.target.value)} placeholder="BPS CSV (7000,3000) sum 10000" className="w-full bg-[var(--bg)] brutal-border px-3 py-2 font-mono text-xs" />
      <button onClick={setup} disabled={loading} className="px-3 py-2 brutal-border bg-[var(--neon)] text-black font-bold text-xs disabled:opacity-50">
        {loading ? 'Setting up...' : 'Setup Fee Sharing'}
      </button>
      {msg && <div className="font-mono text-xs text-[var(--text-muted)] break-all">{msg}</div>}
    </div>
  );
}
