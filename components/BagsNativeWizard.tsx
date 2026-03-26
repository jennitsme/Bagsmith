'use client';

import { useCallback, useEffect, useState } from 'react';

export function BagsNativeWizard({ appId }: { appId: string }) {
  const [verification, setVerification] = useState<any>(null);

  const [baseMint, setBaseMint] = useState('');
  const [claimers, setClaimers] = useState('');
  const [bps, setBps] = useState('');
  const [feeMsg, setFeeMsg] = useState<string | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);

  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerMsg, setPartnerMsg] = useState<string | null>(null);

  const [tokenMint, setTokenMint] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  const [launchIpfs, setLaunchIpfs] = useState('');
  const [launchTokenMint, setLaunchTokenMint] = useState('');
  const [launchConfigKey, setLaunchConfigKey] = useState('');
  const [launchInitialBuyLamports, setLaunchInitialBuyLamports] = useState('1000000');
  const [launchLoading, setLaunchLoading] = useState(false);
  const [launchMsg, setLaunchMsg] = useState<string | null>(null);

  const refreshVerification = useCallback(async () => {
    const res = await fetch(`/api/apps/${appId}/verify-status`, { cache: 'no-store' });
    const data = await res.json();
    if (res.ok && data?.ok) setVerification(data.verification);
  }, [appId]);

  useEffect(() => {
    refreshVerification();
  }, [refreshVerification]);

  const setupFeeShare = async () => {
    setFeeLoading(true);
    setFeeMsg(null);
    try {
      const claimersArray = claimers.split(',').map((s) => s.trim()).filter(Boolean);
      const basisPointsArray = bps.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));

      if (!baseMint.trim()) throw new Error('baseMint is required.');
      if (claimersArray.length === 0) throw new Error('At least one claimer is required.');
      if (claimersArray.length !== basisPointsArray.length) throw new Error('Claimers count must match BPS count.');
      const total = basisPointsArray.reduce((a, b) => a + b, 0);
      if (total !== 10000) throw new Error(`BPS total must be 10000 (current: ${total}).`);

      const res = await fetch(`/api/apps/${appId}/fee-sharing/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseMint, claimersArray, basisPointsArray }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const detail = data?.error || data?.message || JSON.stringify(data);
        throw new Error(`Fee-share setup failed: ${detail}`);
      }
      setFeeMsg('Fee-share setup created successfully.');
      await refreshVerification();
    } catch (e) {
      setFeeMsg(e instanceof Error ? e.message : 'Fee-share setup failed');
    } finally {
      setFeeLoading(false);
    }
  };

  const createPartner = async () => {
    setPartnerLoading(true);
    setPartnerMsg(null);
    try {
      const res = await fetch(`/api/apps/${appId}/partner-config/create`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Partner config creation failed');
      setPartnerMsg('Partner config transaction generated.');
      await refreshVerification();
    } catch (e) {
      setPartnerMsg(e instanceof Error ? e.message : 'Partner config creation failed');
    } finally {
      setPartnerLoading(false);
    }
  };

  const initClaimFlow = async () => {
    setClaimLoading(true);
    setClaimMsg(null);
    try {
      const body: any = {};
      if (tokenMint.trim()) body.tokenMint = tokenMint.trim();

      const res = await fetch(`/api/apps/${appId}/fees/claim-tx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const detail = data?.error || data?.message || JSON.stringify(data);
        throw new Error(`Claim flow init failed: ${detail}`);
      }
      setClaimMsg('Claim transaction(s) generated.');
      await refreshVerification();
    } catch (e) {
      setClaimMsg(e instanceof Error ? e.message : 'Claim flow init failed');
    } finally {
      setClaimLoading(false);
    }
  };

  const createTestLaunchTx = async () => {
    setLaunchLoading(true);
    setLaunchMsg(null);
    try {
      if (!launchIpfs.trim() || !launchTokenMint.trim() || !launchConfigKey.trim()) {
        throw new Error('ipfs, tokenMint, and configKey are required for test launch tx.');
      }
      const initialBuyLamports = Number(launchInitialBuyLamports);
      if (!Number.isFinite(initialBuyLamports) || initialBuyLamports <= 0) {
        throw new Error('initialBuyLamports must be a positive number.');
      }

      const res = await fetch(`/api/apps/${appId}/launch-test-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipfs: launchIpfs.trim(),
          tokenMint: launchTokenMint.trim(),
          configKey: launchConfigKey.trim(),
          initialBuyLamports,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const detail = data?.error || data?.message || JSON.stringify(data);
        throw new Error(`Create test launch tx failed: ${detail}`);
      }
      setLaunchMsg('Test token launch transaction generated.');
    } catch (e) {
      setLaunchMsg(e instanceof Error ? e.message : 'Create test launch tx failed');
    } finally {
      setLaunchLoading(false);
    }
  };

  const badge = (ok: boolean) => (
    <span className={`px-2 py-0.5 brutal-border text-[10px] ${ok ? 'text-green-400 border-green-500/40' : 'text-red-400 border-red-500/40'}`}>
      {ok ? 'done' : 'pending'}
    </span>
  );

  return (
    <div className="brutal-border bg-[var(--surface)] p-4 space-y-4">
      <h3 className="font-bold uppercase">Bags Native Wizard</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-xs">
        <div className="p-2 brutal-border bg-[var(--bg)] flex items-center justify-between">
          <span>1) Fee Share Config</span>
          {badge(Boolean(verification?.feeShareConfigured))}
        </div>
        <div className="p-2 brutal-border bg-[var(--bg)] flex items-center justify-between">
          <span>2) Partner Config</span>
          {badge(Boolean(verification?.partnerConfigCreated))}
        </div>
        <div className="p-2 brutal-border bg-[var(--bg)] flex items-center justify-between">
          <span>3) Claim Fee Flow</span>
          {badge(Boolean(verification?.claimFlowInitialized))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-mono text-xs text-[var(--text-muted)]">Optional Prep: Create Test Token Launch Tx (for obtaining valid baseMint context)</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input value={launchIpfs} onChange={(e) => setLaunchIpfs(e.target.value)} placeholder="ipfs metadata URL" className="bg-[var(--bg)] brutal-border px-3 py-2 font-mono text-xs" />
          <input value={launchTokenMint} onChange={(e) => setLaunchTokenMint(e.target.value)} placeholder="token mint" className="bg-[var(--bg)] brutal-border px-3 py-2 font-mono text-xs" />
          <input value={launchConfigKey} onChange={(e) => setLaunchConfigKey(e.target.value)} placeholder="config key" className="bg-[var(--bg)] brutal-border px-3 py-2 font-mono text-xs" />
          <input value={launchInitialBuyLamports} onChange={(e) => setLaunchInitialBuyLamports(e.target.value)} placeholder="initial buy lamports" className="bg-[var(--bg)] brutal-border px-3 py-2 font-mono text-xs" />
        </div>
        <button onClick={createTestLaunchTx} disabled={launchLoading} className="px-3 py-2 brutal-border bg-white text-black font-bold text-xs disabled:opacity-50">
          {launchLoading ? 'Generating...' : 'Create Test Launch Tx'}
        </button>
        {launchMsg && <div className="font-mono text-xs text-[var(--text-muted)] break-all">{launchMsg}</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input value={baseMint} onChange={(e) => setBaseMint(e.target.value)} placeholder="Base mint" className="bg-[var(--bg)] brutal-border px-3 py-2 font-mono text-xs" />
        <input value={claimers} onChange={(e) => setClaimers(e.target.value)} placeholder="Claimers CSV" className="bg-[var(--bg)] brutal-border px-3 py-2 font-mono text-xs" />
        <input value={bps} onChange={(e) => setBps(e.target.value)} placeholder="BPS CSV (sum 10000)" className="bg-[var(--bg)] brutal-border px-3 py-2 font-mono text-xs" />
      </div>
      <button onClick={setupFeeShare} disabled={feeLoading} className="px-3 py-2 brutal-border bg-white text-black font-bold text-xs disabled:opacity-50">
        {feeLoading ? 'Setting up...' : 'Run Step 1: Setup Fee Share'}
      </button>
      {feeMsg && <div className="font-mono text-xs text-[var(--text-muted)]">{feeMsg}</div>}

      <button onClick={createPartner} disabled={partnerLoading} className="px-3 py-2 brutal-border bg-white text-black font-bold text-xs disabled:opacity-50">
        {partnerLoading ? 'Generating...' : 'Run Step 2: Create Partner Config'}
      </button>
      {partnerMsg && <div className="font-mono text-xs text-[var(--text-muted)]">{partnerMsg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input value={tokenMint} onChange={(e) => setTokenMint(e.target.value)} placeholder="Optional token mint" className="bg-[var(--bg)] brutal-border px-3 py-2 font-mono text-xs" />
        <button onClick={initClaimFlow} disabled={claimLoading} className="px-3 py-2 brutal-border bg-white text-black font-bold text-xs disabled:opacity-50">
          {claimLoading ? 'Generating...' : 'Run Step 3: Init Claim Flow'}
        </button>
      </div>
      {claimMsg && <div className="font-mono text-xs text-[var(--text-muted)]">{claimMsg}</div>}

      {verification?.txProof && (
        <a href={`https://solscan.io/tx/${verification.txProof}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-green-400 underline break-all">
          Deployment Proof: {verification.txProof}
        </a>
      )}
    </div>
  );
}
