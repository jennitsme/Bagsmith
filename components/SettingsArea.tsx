'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Settings } from 'lucide-react';

export function SettingsArea({ wallet }: { wallet: string | null }) {
  const [deploymentAlerts, setDeploymentAlerts] = useState(true);
  const [weeklyAnalytics, setWeeklyAnalytics] = useState(false);
  const [securityWarnings, setSecurityWarnings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet) return;
    fetch('/api/settings/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && d.settings) {
          setDeploymentAlerts(Boolean(d.settings.deploymentAlerts));
          setWeeklyAnalytics(Boolean(d.settings.weeklyAnalytics));
          setSecurityWarnings(Boolean(d.settings.securityWarnings));
        }
      });
  }, [wallet]);

  const save = async () => {
    if (!wallet) return;
    setSaving(true);
    setMsg(null);
    const res = await fetch('/api/settings/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deploymentAlerts, weeklyAnalytics, securityWarnings }),
    });
    const data = await res.json();
    setSaving(false);
    setMsg(res.ok && data?.ok ? 'Settings saved.' : data?.error || 'Failed to save settings');
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[var(--accent)] rounded-sm flex items-center justify-center brutal-shadow flex-shrink-0">
            <Settings className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter">Settings</h2>
        </div>

        <motion.div className="brutal-border bg-[var(--surface)] p-4 md:p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-lg md:text-xl font-bold uppercase mb-4">App Preferences</h3>

          <div className="space-y-3 font-mono text-sm">
            <ToggleRow label="Deployment Alerts" value={deploymentAlerts} onChange={setDeploymentAlerts} disabled={!wallet} />
            <ToggleRow label="Weekly Analytics Email" value={weeklyAnalytics} onChange={setWeeklyAnalytics} disabled={!wallet} />
            <ToggleRow label="Security Warnings" value={securityWarnings} onChange={setSecurityWarnings} disabled={!wallet} />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={save}
              disabled={!wallet || saving}
              className="px-4 py-2 font-bold uppercase tracking-wider text-xs md:text-sm brutal-border bg-[var(--neon)] text-black hover:bg-white transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            {!wallet && <span className="font-mono text-xs text-[var(--text-muted)]">Connect wallet to manage settings.</span>}
            {msg && <span className="font-mono text-xs text-[var(--text-muted)]">{msg}</span>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 brutal-border bg-[var(--bg)]">
      <span>{label}</span>
      <button
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-colors relative brutal-border ${value ? 'bg-[var(--neon)]' : 'bg-[var(--surface-hover)]'} disabled:opacity-50`}
      >
        <div className={`absolute top-0.5 bottom-0.5 w-5 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
