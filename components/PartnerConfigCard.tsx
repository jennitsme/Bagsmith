'use client';

import { useState } from 'react';

export function PartnerConfigCard({ appId }: { appId: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tx, setTx] = useState<string | null>(null);

  const create = async () => {
    setLoading(true);
    setMsg(null);
    setTx(null);
    try {
      const res = await fetch(`/api/apps/${appId}/partner-config/create`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to create partner config tx');
      const rawTx = data?.tx?.response?.transaction || null;
      setTx(rawTx);
      setMsg('Partner config creation transaction generated.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed to create partner config tx');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brutal-border bg-[var(--surface)] p-4 space-y-3">
      <h3 className="font-bold uppercase">Partner / Creator Config</h3>
      <button onClick={create} disabled={loading} className="px-3 py-2 brutal-border bg-white text-black font-bold text-xs disabled:opacity-50">
        {loading ? 'Generating...' : 'Create Partner Config Tx'}
      </button>
      {msg && <div className="font-mono text-xs text-[var(--text-muted)]">{msg}</div>}
      {tx && <div className="font-mono text-xs break-all text-[var(--text-muted)]">tx(base58): {tx}</div>}
    </div>
  );
}
