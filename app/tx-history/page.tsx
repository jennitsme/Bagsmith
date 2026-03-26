'use client';

import { useEffect, useState } from 'react';

function timeAgo(dateStr: string) {
  const t = new Date(dateStr).getTime();
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function TxHistoryPage() {
  const [scope, setScope] = useState<'self' | 'global'>('self');
  const [runs, setRuns] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  const load = async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    const res = await fetch(`/api/integrations/bags/tx-history?scope=${scope}&q=${encodeURIComponent(q)}&offset=${currentOffset}&limit=${limit}`, { cache: 'no-store' });
    const data = await res.json();
    const list = data?.runs || [];

    if (reset) {
      setRuns(list);
      setOffset(list.length);
    } else {
      setRuns((prev) => [...prev, ...list]);
      setOffset((prev) => prev + list.length);
    }
    setHasMore(Boolean(data?.hasMore));
  };

  useEffect(() => {
    setOffset(0);
    load(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, q]);

  return (
    <div className="min-h-screen p-6 md:p-10 bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">Bags Transaction History</h1>
            <div className="flex gap-2">
              {(['self', 'global'] as const).map((s) => (
                <button key={s} onClick={() => setScope(s)} className={`px-3 py-2 brutal-border font-mono text-xs ${scope === s ? 'bg-[var(--neon)] text-black font-bold' : 'bg-[var(--surface)]'}`}>
                  {s}
                </button>
              ))}
              <a href={`/api/integrations/bags/tx-history/export?scope=${scope}&q=${encodeURIComponent(q)}`} className="px-3 py-2 brutal-border font-mono text-xs bg-white text-black font-bold">
                Export CSV
              </a>
            </div>
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by signature, wallet/user, mint, mode..."
            className="bg-[var(--surface)] brutal-border px-3 py-2 font-mono text-xs md:text-sm"
          />
        </div>

        <div className="space-y-2">
          {runs.map((tx) => (
            <div key={tx.id} className="p-3 brutal-border bg-[var(--surface)] font-mono text-xs md:text-sm">
              <div className="flex flex-wrap gap-3 items-center">
                <span>{tx.mode}</span>
                <span className={`px-2 py-0.5 brutal-border text-[10px] ${tx.success ? 'text-green-400 border-green-500/40' : 'text-red-400 border-red-500/40'}`}>
                  {tx.success ? 'success' : 'failed'}
                </span>
                <span>amount: {tx.amount}</span>
                <span className="text-[var(--text-muted)]">{timeAgo(tx.createdAt)}</span>
              </div>
              <div className="text-[var(--text-muted)] break-all">{tx.inputMint} → {tx.outputMint}</div>
              <a href={`https://solscan.io/tx/${tx.signature}`} target="_blank" rel="noreferrer" className="text-green-400 underline break-all">{tx.signature}</a>
            </div>
          ))}
          {runs.length === 0 && <div className="font-mono text-sm text-[var(--text-muted)]">No transactions.</div>}
        </div>

        {hasMore && (
          <button onClick={() => load(false)} className="mt-4 px-4 py-2 brutal-border font-mono text-sm hover:bg-[var(--surface-hover)]">
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
