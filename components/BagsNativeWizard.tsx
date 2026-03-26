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

      const res = await fetch(`/api/apps/${appId}/fee-sharing/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseMint, claimersArray, basisPointsArray }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Fee-share setup failed');
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
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Claim flow init failed');
      setClaimMsg('Claim transaction(s) generated.');
      await refreshVerification();
    } catch (e) {
      setClaimMsg(e instanceof Error ? e.message : 'Claim flow init failed');
    } finally {
      setClaimLoading(false);
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
