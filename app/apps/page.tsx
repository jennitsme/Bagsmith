'use client';

import { useEffect, useState } from 'react';

export default function PublicAppsPage() {
  const [runs, setRuns] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/apps/public', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setRuns(d?.runs || []));
  }, []);

  return (
    <div className="min-h-screen p-6 md:p-10 bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold uppercase tracking-tight mb-6">Published Mini-Apps</h1>
        <div className="space-y-3">
          {runs.map((r) => (
            <div key={r.id} className="brutal-border bg-[var(--surface)] p-4 font-mono text-sm">
              <div className="font-bold text-[var(--neon)]">{r.publicTitle || 'Untitled App'}</div>
              <div className="text-[var(--text-muted)] break-all">{r.prompt}</div>
              <div>mode: {r.mode} · amount: {r.amount}</div>
              {r.signature && <div className="text-green-400 break-all">tx: {r.signature}</div>}
            </div>
          ))}
          {runs.length === 0 && <div className="text-[var(--text-muted)] font-mono">No public apps yet.</div>}
        </div>
      </div>
    </div>
  );
}
