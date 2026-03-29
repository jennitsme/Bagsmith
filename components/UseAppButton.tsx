'use client';

import { useState } from 'react';
import bs58 from 'bs58';
import { VersionedTransaction } from '@solana/web3.js';

type PhantomProvider = {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toBase58: () => string } }>;
  signAndSendTransaction: (tx: VersionedTransaction) => Promise<{ signature: Uint8Array | string }>;
};

export function UseAppButton({ appId }: { appId: string }) {
  const [loading, setLoading] = useState(false);
  const [executeOnchain, setExecuteOnchain] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);

  const onUse = async () => {
    setLoading(true);
    setMsg(null);
    setTxSig(null);
    try {
      const res = await fetch(`/api/apps/${appId}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executeOnchain }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to use app');

      const actionMsg = data?.action?.message ? ` · ${data.action.message}` : '';

      if (data?.action?.onchain?.requiresUserSignature && data?.action?.onchain?.unsignedTransaction) {
        const provider = (window as any)?.solana as PhantomProvider | undefined;
        if (!provider?.isPhantom) throw new Error('Phantom wallet not detected. Install Phantom first.');

        await provider.connect();
        const tx = VersionedTransaction.deserialize(bs58.decode(String(data.action.onchain.unsignedTransaction)));
        const sent = await provider.signAndSendTransaction(tx);
        const signature = typeof sent?.signature === 'string' ? sent.signature : bs58.encode(sent.signature);
        setTxSig(signature);
        setMsg(`Success. Usage count: ${data.usageCount}${actionMsg} · Signed with Phantom.`);
      } else {
        if (data?.action?.onchain?.signature) setTxSig(String(data.action.onchain.signature));
        setMsg(`Success. Usage count: ${data.usageCount}${actionMsg}`);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed to use app');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 font-mono text-xs text-[var(--text-muted)]">
        <input type="checkbox" checked={executeOnchain} onChange={(e) => setExecuteOnchain(e.target.checked)} />
        Execute on-chain action (for tipping apps)
      </label>
      <button onClick={onUse} disabled={loading} className="px-4 py-2 brutal-border bg-[var(--neon)] text-black font-bold uppercase text-sm disabled:opacity-50">
        {loading ? 'Processing...' : 'Use App'}
      </button>
      {msg && <div className="font-mono text-xs text-[var(--text-muted)] break-all">{msg}</div>}
      {txSig && (
        <a
          href={`https://solscan.io/tx/${txSig}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-green-400 underline break-all"
        >
          View transaction: {txSig}
        </a>
      )}
    </div>
  );
}
