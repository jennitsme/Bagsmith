'use client';

import { useEffect, useState } from 'react';

export default function TxHistoryPage() {
  const [scope, setScope] = useState<'self' | 'global'>('self');
  const [runs, setRuns] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/integrations/bags/tx-history?scope=${scope}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setRuns(d?.runs || []));
  }, [scope]);

  return (
    <div className="min-h-screen p-6 md:p-10 bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">Bags Transaction History</h1>
          <div className="flex gap-2">
            {(['self', 'global'] as const).map((s) => (
              <button key={s} onClick={() => setScope(s)} className={`px-3 py-2 brutal-border font-mono text-xs ${scope === s ? 'bg-[var(--neon)] text-black font-bold' : 'bg-[var(--surface)]'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {runs.map((tx) => (
            <div key={tx.id} className="p-3 brutal-border bg-[var(--surface)] font-mono text-xs md:text-sm">
              <div className="flex flex-wrap gap-3">
                <span>{tx.mode}</span>
                <span className={tx.success ? 'text-green-400' : 'text-red-400'}>{tx.success ? 'success' : 'failed'}</span>
                <span>amount: {tx.amount}</span>
              </div>
              <div className="text-[var(--text-muted)] break-all">{tx.inputMint} → {tx.outputMint}</div>
              <a href={`https://solscan.io/tx/${tx.signature}`} target="_blank" rel="noreferrer" className="text-green-400 underline break-all">{tx.signature}</a>
            </div>
          ))}
          {runs.length === 0 && <div className="font-mono text-sm text-[var(--text-muted)]">No transactions.</div>}
        </div>
      </div>
    </div>
  );
}
