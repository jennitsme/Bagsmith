'use client';

import { useEffect, useState } from 'react';

export function AppsArea() {
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/apps/public', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setApps(d?.apps || []));
  }, []);

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter mb-2">Bags App Directory</h2>
        <p className="font-mono text-sm text-[var(--text-muted)] mb-6">Published apps inside the dashboard.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((a) => (
            <div key={a.id} className="brutal-border bg-[var(--surface)] p-4">
              <div className="text-xs font-mono text-[var(--neon)] uppercase">{a.type}</div>
              <div className="font-bold text-lg mt-1">{a.title}</div>
              <div className="text-sm text-[var(--text-muted)] mt-2 line-clamp-3">{a.description}</div>
              <div className="font-mono text-xs mt-3">Bags Fee Share: {a.feeShareBps} bps</div>
              <a href={`/apps/${a.id}`} className="inline-block mt-3 px-3 py-2 brutal-border font-mono text-xs hover:bg-[var(--surface-hover)]">
                Open App
              </a>
            </div>
          ))}
          {apps.length === 0 && <div className="font-mono text-sm text-[var(--text-muted)]">No apps yet.</div>}
        </div>
      </div>
    </div>
  );
}
