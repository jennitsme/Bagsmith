'use client';

import { useEffect, useState } from 'react';

function VerifyRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 brutal-border bg-[var(--bg)] font-mono text-xs">
      <span>{label}</span>
      <span className={ok ? 'text-green-400' : 'text-red-400'}>{ok ? 'verified' : 'missing'}</span>
    </div>
  );
}

export function VerificationStatusCard({ appId }: { appId: string }) {
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      const res = await fetch(`/api/apps/${appId}/verify-status`, { cache: 'no-store' });
      const data = await res.json();
      if (active && res.ok && data?.ok) setState(data.verification);
    };

    run();
    return () => {
      active = false;
    };
  }, [appId]);

  const refresh = async () => {
    const res = await fetch(`/api/apps/${appId}/verify-status`, { cache: 'no-store' });
    const data = await res.json();
    if (res.ok && data?.ok) setState(data.verification);
  };

  return (
    <div className="brutal-border bg-[var(--surface)] p-4 space-y-2">
      <h3 className="font-bold uppercase">Ownership / Deployment Verification</h3>
      {state ? (
        <>
          <VerifyRow label="Ownership" ok={Boolean(state.ownershipVerified)} />
          <VerifyRow label="Deployment Proof" ok={Boolean(state.deploymentProofAvailable)} />
          <VerifyRow label="Fee Share Config" ok={Boolean(state.feeShareConfigured)} />
          <VerifyRow label="Partner Config" ok={Boolean(state.partnerConfigCreated)} />
          <VerifyRow label="Claim Flow" ok={Boolean(state.claimFlowInitialized)} />
          {state.txProof && (
            <a href={`https://solscan.io/tx/${state.txProof}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-green-400 underline break-all">
              {state.txProof}
            </a>
          )}
        </>
      ) : (
        <div className="font-mono text-xs text-[var(--text-muted)]">Loading verification status...</div>
      )}
      <button onClick={refresh} className="px-3 py-2 brutal-border font-mono text-xs hover:bg-[var(--surface-hover)]">Refresh Verification</button>
    </div>
  );
}
