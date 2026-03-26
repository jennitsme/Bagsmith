'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Settings, User, BadgeCheck, Upload } from 'lucide-react';

function shortWallet(wallet: string) {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

function formatExpiry(expiresAt: number | null) {
  if (!expiresAt) return '-';
  const sec = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
}

export function SettingsArea({
  wallet,
  profile,
  expiresAt,
  onProfileUpdated,
}: {
  wallet: string | null;
  profile: { displayName: string; avatarUrl: string; bio: string } | null;
  expiresAt: number | null;
  onProfileUpdated: () => Promise<void> | void;
}) {
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<{ totalRuns: number; executeRuns: number; successRate: number; successfulRuns: number } | null>(null);

  useEffect(() => {
    setDisplayName(profile?.displayName || '');
    setBio(profile?.bio || '');
  }, [profile?.displayName, profile?.bio]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/analytics/summary?scope=self&range=30d', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data?.ok) {
        setStats({
          totalRuns: data.summary.totalRuns,
          executeRuns: data.summary.executeRuns,
          successRate: data.summary.successRate,
          successfulRuns: data.summary.successfulRuns,
        });
      }
    };
    load();
  }, []);

  const canSave = useMemo(() => Boolean(wallet && displayName.trim()), [wallet, displayName]);

  const saveProfile = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim(), bio: bio.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to save profile');
      await onProfileUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Avatar upload failed');
      await onProfileUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[var(--accent)] rounded-sm flex items-center justify-center brutal-shadow flex-shrink-0">
            <Settings className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter">Profile & Session</h2>
        </div>

        {error && <div className="brutal-border border-red-500 text-red-400 bg-red-950/20 p-3 font-mono text-sm">{error}</div>}

        <motion.div className="brutal-border bg-[var(--surface)] p-4 md:p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-lg md:text-xl font-bold uppercase mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
            <User className="w-5 h-5 text-[var(--neon)]" /> Profile
          </h3>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-3">
              {profile?.avatarUrl ? (
                <Image src={profile.avatarUrl} alt="avatar" width={96} height={96} className="w-24 h-24 rounded-sm object-cover brutal-border" />
              ) : (
                <div className="w-24 h-24 rounded-sm bg-[var(--bg)] brutal-border flex items-center justify-center font-mono text-xs text-[var(--text-muted)]">No Avatar</div>
              )}
              <label className="text-xs md:text-sm font-mono brutal-border px-3 py-2 cursor-pointer hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={!wallet || uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadAvatar(file);
                  }}
                />
              </label>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="font-mono text-xs text-[var(--text-muted)]">Display Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={!wallet}
                  className="mt-1 w-full bg-[var(--bg)] brutal-border px-3 py-2 text-sm font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-xs text-[var(--text-muted)]">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={!wallet}
                  className="mt-1 w-full bg-[var(--bg)] brutal-border px-3 py-2 text-sm font-mono focus:outline-none min-h-[90px]"
                />
              </div>
              <button
                onClick={saveProfile}
                disabled={!canSave || saving}
                className="px-4 py-2 font-bold uppercase tracking-wider text-xs md:text-sm brutal-border bg-[var(--neon)] text-black hover:bg-white transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div className="brutal-border bg-[var(--surface)] p-4 md:p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-lg md:text-xl font-bold uppercase mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
            <BadgeCheck className="w-5 h-5 text-[var(--neon)]" /> Verified Wallet Session
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
            <div className="p-3 brutal-border bg-[var(--bg)]">Status: {wallet ? 'Verified' : 'Not Connected'}</div>
            <div className="p-3 brutal-border bg-[var(--bg)]">Wallet: {wallet ? shortWallet(wallet) : '-'}</div>
            <div className="p-3 brutal-border bg-[var(--bg)] md:col-span-2">Expiry in: {wallet ? formatExpiry(expiresAt) : '-'}</div>
          </div>
        </motion.div>

        <motion.div className="brutal-border bg-[var(--surface)] p-4 md:p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-lg md:text-xl font-bold uppercase mb-4 md:mb-6">Your Stats (30d)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 brutal-border bg-[var(--bg)]"><div className="font-mono text-xs text-[var(--text-muted)]">Total Runs</div><div className="text-xl font-bold">{stats?.totalRuns ?? 0}</div></div>
            <div className="p-3 brutal-border bg-[var(--bg)]"><div className="font-mono text-xs text-[var(--text-muted)]">Execute Runs</div><div className="text-xl font-bold">{stats?.executeRuns ?? 0}</div></div>
            <div className="p-3 brutal-border bg-[var(--bg)]"><div className="font-mono text-xs text-[var(--text-muted)]">Successful</div><div className="text-xl font-bold">{stats?.successfulRuns ?? 0}</div></div>
            <div className="p-3 brutal-border bg-[var(--bg)]"><div className="font-mono text-xs text-[var(--text-muted)]">Success Rate</div><div className="text-xl font-bold">{(stats?.successRate ?? 0).toFixed(1)}%</div></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
