'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PublicAppsPage() {
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/apps/public', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setApps(d?.apps || []));
  }, []);

  return (
    <div className="min-h-screen p-6 md:p-10 bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold uppercase tracking-tight mb-2">Published Mini-Apps</h1>
        <p className="font-mono text-sm text-[var(--text-muted)] mb-6">Real app manifests generated from successful pipeline runs.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((a) => (
            <div key={a.id} className="brutal-border bg-[var(--surface)] p-4">
              <div className="text-xs font-mono text-[var(--neon)] uppercase">{a.type}</div>
              <div className="font-bold text-lg mt-1">{a.title}</div>
              <div className="text-sm text-[var(--text-muted)] mt-2 line-clamp-3">{a.description}</div>
              <div className="font-mono text-xs mt-3">Bags Fee Share: {a.feeShareBps} bps</div>
              <div className="font-mono text-xs">Bags Deployment Status: {a.status}</div>
              {a.txProof && <div className="font-mono text-xs text-green-400 break-all mt-2">tx: {a.txProof}</div>}
              <Link href={`/apps/${a.id}`} className="inline-block mt-3 px-3 py-2 brutal-border font-mono text-xs hover:bg-[var(--surface-hover)]">Open App</Link>
            </div>
          ))}
        </div>

        {apps.length === 0 && <div className="text-[var(--text-muted)] font-mono mt-8">No public apps yet.</div>}
      </div>
    </div>
  );
}
