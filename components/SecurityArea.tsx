'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

type Check = {
  name: string;
  status: 'passed' | 'active' | 'warning';
  desc: string;
};

export function SecurityArea() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [summary, setSummary] = useState<{ passed: number; active: number; warning: number } | null>(null);
  const [scope, setScope] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/security/overview', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to load security overview');
      setChecks(data.checks || []);
      setSummary(data.summary || null);
      setScope(data.mvpScope || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[var(--accent)] rounded-sm flex items-center justify-center brutal-shadow flex-shrink-0">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter">Security & Runtime Health</h2>
          </div>
          <button onClick={load} disabled={loading} className="px-3 py-2 brutal-border font-mono text-xs md:text-sm bg-[var(--surface)] hover:bg-[var(--surface-hover)] disabled:opacity-50 flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {error && <div className="mb-4 brutal-border border-red-500 text-red-400 bg-red-950/20 p-3 font-mono text-sm">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="lg:col-span-2 brutal-border bg-[var(--surface)] p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold uppercase mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
              <Lock className="w-4 h-4 md:w-5 md:h-5 text-[var(--neon)]" />
              Real Checks
            </h3>
            <div className="space-y-3 md:space-y-4">
              {checks.map((check, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 brutal-border bg-[var(--bg)] gap-3 sm:gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-sm md:text-base mb-1">{check.name}</p>
                    <p className="text-xs md:text-sm font-mono text-[var(--text-muted)] break-words">{check.desc}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 rounded-sm text-[10px] md:text-xs font-mono uppercase tracking-wider brutal-border whitespace-nowrap ${
                    check.status === 'warning'
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30'
                      : 'bg-[var(--neon)]/10 text-[var(--neon)] border-[var(--neon)]/30'
                  }`}>
                    {check.status === 'warning' ? <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" /> : <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />}
                    {check.status}
                  </div>
                </motion.div>
              ))}
              {checks.length === 0 && !loading && <div className="p-4 brutal-border bg-[var(--bg)] font-mono text-sm text-[var(--text-muted)]">No checks loaded.</div>}
            </div>
          </div>

          <div className="brutal-border bg-[var(--surface)] p-4 md:p-6 flex flex-col gap-4">
            <h3 className="text-lg md:text-xl font-bold uppercase">Summary</h3>
            <div className="space-y-2 font-mono text-xs md:text-sm">
              <div className="p-3 brutal-border bg-[var(--bg)]">passed: <span className="text-[var(--neon)]">{summary?.passed ?? 0}</span></div>
              <div className="p-3 brutal-border bg-[var(--bg)]">active: <span className="text-[var(--neon)]">{summary?.active ?? 0}</span></div>
              <div className="p-3 brutal-border bg-[var(--bg)]">warning: <span className="text-[var(--accent)]">{summary?.warning ?? 0}</span></div>
            </div>

            <div className="p-3 brutal-border bg-[var(--bg)] font-mono text-xs">
              <div className="font-bold mb-1 uppercase">MVP Scope</div>
              <div className="text-[var(--text-muted)]">{scope.length ? scope.join(', ') : '-'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
