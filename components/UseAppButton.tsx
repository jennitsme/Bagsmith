'use client';

import { useState } from 'react';

export function UseAppButton({ appId }: { appId: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onUse = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/apps/${appId}/use`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to use app');

      const actionMsg = data?.action?.message ? ` · ${data.action.message}` : '';
      setMsg(`Success. Usage count: ${data.usageCount}${actionMsg}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed to use app');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button onClick={onUse} disabled={loading} className="px-4 py-2 brutal-border bg-[var(--neon)] text-black font-bold uppercase text-sm disabled:opacity-50">
        {loading ? 'Processing...' : 'Use App'}
      </button>
      {msg && <div className="font-mono text-xs text-[var(--text-muted)]">{msg}</div>}
    </div>
  );
}
