'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, CheckCircle2, RefreshCw, XCircle, Wallet, Download } from 'lucide-react';

type RecentLog = {
  id: string;
  createdAt: string;
  prompt: string;
  inputMint: string;
  outputMint: string;
  amount: string;
  mode: 'quote-only' | 'execute';
  success: boolean;
  signature?: string | null;
  wallet?: string | null;
  error?: string | null;
};

type Summary = {
  scope?: 'self' | 'global';
  totalRuns: number;
  successfulRuns: number;
  executeRuns: number;
  successfulExecutes: number;
  successRate: number;
  totalInputAmount: number;
  recent: RecentLog[];
};

export function AnalyticsOverview() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [scope, setScope] = useState<'self' | 'global'>('self');
  const [userId, setUserId] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/analytics/summary?range=${range}&scope=${scope}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to load analytics');
      setSummary(data.summary);
      setUserId(data.userId || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }, [range, scope]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const stats = useMemo(
    () => [
      { label: 'Total Runs', value: String(summary?.totalRuns ?? 0), icon: Activity },
      { label: 'Successful Runs', value: String(summary?.successfulRuns ?? 0), icon: CheckCircle2 },
      { label: 'Execute Runs', value: String(summary?.executeRuns ?? 0), icon: Wallet },
      { label: 'Success Rate', value: `${(summary?.successRate ?? 0).toFixed(1)}%`, icon: XCircle },
    ],
    [summary]
  );

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter">Real Analytics</h2>
          <div className="flex flex-wrap items-center gap-2">
            {(['24h', '7d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-2 text-xs md:text-sm font-mono brutal-border transition-colors ${range === r ? 'bg-[var(--neon)] text-black font-bold' : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)]'}`}
              >
                {r}
              </button>
            ))}
            {(['self', 'global'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`px-3 py-2 text-xs md:text-sm font-mono brutal-border transition-colors ${scope === s ? 'bg-white text-black font-bold' : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)]'}`}
              >
                {s}
              </button>
            ))}
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="px-4 py-2 text-xs md:text-sm font-mono brutal-border bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <a
              href={`/api/analytics/export?range=${range}&scope=${scope}`}
              className="px-4 py-2 text-xs md:text-sm font-mono brutal-border bg-white text-black font-bold hover:bg-[var(--neon)] transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export CSV
            </a>
          </div>
        </div>

        {error && <div className="mb-6 brutal-border border-red-500 text-red-400 bg-red-950/20 p-3 font-mono text-sm">{error}</div>}
        {!error && (
          <div className="mb-4 font-mono text-xs text-[var(--text-muted)]">
            scope: {scope} {userId ? `• session user: ${userId}` : ''}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="brutal-border bg-[var(--surface)] p-4 md:p-6"
            >
              <div className="flex justify-between items-start mb-3">
                <stat.icon className="w-5 h-5 text-[var(--neon)]" />
              </div>
              <h3 className="text-[var(--text-muted)] font-mono text-xs uppercase tracking-wider mb-2">{stat.label}</h3>
              <p className="text-3xl font-bold tracking-tighter">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="brutal-border bg-[var(--surface)] p-4 md:p-6 mb-6">
          <h3 className="text-lg md:text-xl font-bold uppercase mb-2">Volume Proxy (Input Amount Sum)</h3>
          <p className="font-mono text-2xl text-[var(--neon)]">{(summary?.totalInputAmount ?? 0).toLocaleString()}</p>
          <p className="font-mono text-xs text-[var(--text-muted)] mt-1">Based on successful runs only.</p>
        </div>

        <div className="brutal-border bg-[var(--surface)] p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold uppercase mb-4">Recent Runs</h3>
          <div className="space-y-3">
            {(summary?.recent ?? []).map((r) => (
              <div key={r.id} className="p-3 brutal-border bg-[var(--bg)] font-mono text-xs md:text-sm">
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                  <span>{new Date(r.createdAt).toLocaleString()}</span>
                  <span>mode: {r.mode}</span>
                  <span className={r.success ? 'text-green-400' : 'text-red-400'}>{r.success ? 'success' : 'failed'}</span>
                </div>
                <div className="break-all text-[var(--text-muted)]">prompt: {r.prompt}</div>
                <div className="break-all">pair: {r.inputMint} → {r.outputMint}</div>
                <div>amount: {r.amount}</div>
                {r.signature && (
                  <div className="break-all text-green-400">
                    signature:{' '}
                    <a href={`https://solscan.io/tx/${r.signature}`} target="_blank" rel="noreferrer" className="underline">
                      {r.signature}
                    </a>
                  </div>
                )}
                {r.error && <div className="break-all text-red-400">error: {r.error}</div>}
              </div>
            ))}
            {(summary?.recent ?? []).length === 0 && (
              <div className="p-4 brutal-border bg-[var(--bg)] text-[var(--text-muted)] font-mono text-sm">No runs yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
