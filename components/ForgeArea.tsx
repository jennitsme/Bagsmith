'use client';

import { useEffect, useState } from 'react';
import bs58 from 'bs58';
import { VersionedTransaction } from '@solana/web3.js';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { MiniAppTemplate } from '@/lib/templates';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

type PhantomProvider = {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toBase58: () => string } }>;
  signAndSendTransaction: (tx: VersionedTransaction) => Promise<{ signature: Uint8Array | string }>;
};

export function ForgeArea({ selectedTemplate }: { selectedTemplate?: MiniAppTemplate | null }) {
  const [prompt, setPrompt] = useState('');
  const [inputMint, setInputMint] = useState(SOL_MINT);
  const [outputMint, setOutputMint] = useState(USDC_MINT);
  const [amount, setAmount] = useState('1000000');
  const [executeSwap, setExecuteSwap] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const [appType, setAppType] = useState<'referral' | 'gated-access' | 'tipping' | 'launch-campaign' | 'loyalty'>('referral');
  const [appTitle, setAppTitle] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [generatedConfig, setGeneratedConfig] = useState<any>(null);
  const [publishedAppId, setPublishedAppId] = useState<string | null>(null);

  const [feeBaseMint, setFeeBaseMint] = useState('');
  const [feeClaimers, setFeeClaimers] = useState('');
  const [feeBps, setFeeBps] = useState('');
  const [feeSharingLoading, setFeeSharingLoading] = useState(false);
  const [feeSharingMsg, setFeeSharingMsg] = useState<string | null>(null);

  const [bagsStatus, setBagsStatus] = useState<any>(null);

  useEffect(() => {
    if (!selectedTemplate) return;
    setPrompt(selectedTemplate.prompt);
    setInputMint(selectedTemplate.defaults.inputMint);
    setOutputMint(selectedTemplate.defaults.outputMint);
    setAmount(selectedTemplate.defaults.amount);
    setExecuteSwap(selectedTemplate.defaults.executeSwap);

    if (selectedTemplate.id.includes('launch')) setAppType('launch-campaign');
    if (selectedTemplate.id.includes('referral')) setAppType('referral');
    if (selectedTemplate.id.includes('tipping')) setAppType('tipping');

    setAppTitle(selectedTemplate.name);
    setAppDescription(selectedTemplate.desc);
    setError(null);
    setResult(null);
    setGeneratedConfig(null);
    setPublishedAppId(null);
    setFeeSharingMsg(null);
  }, [selectedTemplate]);

  useEffect(() => {
    fetch('/api/integrations/bags/status', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) setBagsStatus(d.status);
      })
      .catch(() => undefined);
  }, [result?.signature]);

  const generateConfig = async () => {
    try {
      const res = await fetch('/api/apps/generate-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: appType, prompt }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Config generation failed');
      setGeneratedConfig(data.config);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Config generation failed');
    }
  };

  const publishRun = async () => {
    if (!result?.runId) return;
    setPublishing(true);
    try {
      const title = (appTitle || prompt).slice(0, 60);
      const res = await fetch('/api/apps/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: result.runId, title, type: appType, description: appDescription || prompt }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Publish failed');
      setPublishedAppId(data?.app?.id || null);
      setResult((prev: any) => ({ ...prev, published: true }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const setupFeeSharing = async () => {
    if (!publishedAppId) return;
    setFeeSharingLoading(true);
    setFeeSharingMsg(null);
    try {
      const claimersArray = feeClaimers.split(',').map((s) => s.trim()).filter(Boolean);
      const basisPointsArray = feeBps.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));

      const res = await fetch(`/api/apps/${publishedAppId}/fee-sharing/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseMint: feeBaseMint, claimersArray, basisPointsArray }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Fee-sharing setup failed');
      setFeeSharingMsg('Fee-sharing berhasil disimpan.');
    } catch (e) {
      setFeeSharingMsg(e instanceof Error ? e.message : 'Fee-sharing setup failed');
    } finally {
      setFeeSharingLoading(false);
    }
  };

  const runForge = async () => {
    setError(null);
    setResult(null);

    if (!prompt.trim()) return setError('Ide app belum diisi.');
    if (!inputMint.trim() || !outputMint.trim() || !amount.trim()) {
      return setError('Token asal, token tujuan, dan jumlah wajib diisi.');
    }

    try {
      setIsRunning(true);
      const res = await fetch('/api/bags/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          inputMint: inputMint.trim(),
          outputMint: outputMint.trim(),
          amount: amount.trim(),
          executeSwap,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Proses gagal');

      if (data?.requiresUserSignature && data?.unsignedTransaction) {
        const provider = (window as any)?.solana as PhantomProvider | undefined;
        if (!provider?.isPhantom) throw new Error('Phantom wallet not detected. Install Phantom first.');

        await provider.connect();
        const tx = VersionedTransaction.deserialize(bs58.decode(String(data.unsignedTransaction)));
        const sent = await provider.signAndSendTransaction(tx);
        const signature = typeof sent?.signature === 'string' ? sent.signature : bs58.encode(sent.signature);

        setResult({ ...data, signature, userSigned: true });
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setIsRunning(false);
    }
  };

  const hasEnvIssues = Boolean(bagsStatus?.env?.issues?.length);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full relative">
      <div className="absolute inset-0 tech-grid opacity-20 pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-2 md:mb-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-4">
            Create Your <span className="text-[var(--neon)]">Mini-App</span>
          </h2>
          <p className="text-[var(--text-muted)] font-mono text-sm md:text-base max-w-2xl mx-auto">
            Tulis ide kamu, jalankan, lalu publish app dalam beberapa klik.
          </p>
          {selectedTemplate && <p className="mt-3 font-mono text-xs text-[var(--neon)]">Template loaded: {selectedTemplate.name}</p>}
        </motion.div>

        <div className="brutal-border bg-[var(--surface)] p-3 md:p-4 rounded-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-xs">
            <div className={`p-2 brutal-border ${generatedConfig ? 'bg-[var(--neon)] text-black' : 'bg-[var(--bg)]'}`}>1) Buat Konfigurasi</div>
            <div className={`p-2 brutal-border ${publishedAppId ? 'bg-[var(--neon)] text-black' : 'bg-[var(--bg)]'}`}>2) Publish App</div>
            <div className={`p-2 brutal-border ${feeSharingMsg?.toLowerCase().includes('berhasil') ? 'bg-[var(--neon)] text-black' : 'bg-[var(--bg)]'}`}>3) Atur Fee Share</div>
          </div>
        </div>

        <div className="brutal-border bg-[var(--surface)] p-4 md:p-6 rounded-sm">
          <label className="block font-mono text-xs text-[var(--text-muted)] mb-2">Ide App</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Contoh: app referral untuk campaign 30 hari dengan reward bertingkat"
            className="w-full bg-[var(--bg)] brutal-border p-3 md:p-4 text-sm md:text-base font-mono resize-none focus:outline-none min-h-[110px]"
            disabled={isRunning}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-4 font-mono text-sm">
            <input value={inputMint} onChange={(e) => setInputMint(e.target.value)} placeholder="Token asal (mint)" className="bg-[var(--bg)] brutal-border px-3 py-2 focus:outline-none" disabled={isRunning} />
            <input value={outputMint} onChange={(e) => setOutputMint(e.target.value)} placeholder="Token tujuan (mint)" className="bg-[var(--bg)] brutal-border px-3 py-2 focus:outline-none" disabled={isRunning} />
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Jumlah (unit terkecil token)" className="bg-[var(--bg)] brutal-border px-3 py-2 focus:outline-none" disabled={isRunning} />
          </div>

          <label className="mt-4 flex items-center gap-2 font-mono text-sm cursor-pointer select-none">
            <input type="checkbox" checked={executeSwap} onChange={(e) => setExecuteSwap(e.target.checked)} disabled={isRunning} />
            Jalankan transaksi real (opsional)
          </label>

          {executeSwap && hasEnvIssues && <div className="mt-2 text-red-400 font-mono text-xs">Execute sementara tidak tersedia.</div>}

          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <button
              onClick={runForge}
              disabled={isRunning || (executeSwap && hasEnvIssues)}
              className="bg-[var(--neon)] text-black px-4 py-2 font-bold uppercase tracking-wider brutal-border disabled:opacity-50 flex items-center gap-2"
            >
              {isRunning ? 'Memproses...' : 'Jalankan'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && <div className="brutal-border border-red-500 text-red-400 bg-red-950/20 p-3 font-mono text-xs md:text-sm">{error}</div>}

        {result && (
          <div className="brutal-border bg-[var(--surface)] p-4 md:p-6 rounded-sm">
            <h3 className="text-lg md:text-xl font-bold uppercase mb-4">Hasil Proses</h3>
            <div className="font-mono text-xs md:text-sm space-y-2 mb-4">
              <div>mode: <span className="text-[var(--neon)]">{result.mode}</span></div>
              <div>wallet: <span className="break-all">{result.wallet}</span></div>
              {result.signature && <div className="break-all">signature: <a href={`https://solscan.io/tx/${result.signature}`} target="_blank" className="text-green-400 underline" rel="noreferrer">{result.signature}</a></div>}
              {result.runId && <div className="break-all">runId: <span className="text-[var(--neon)]">{result.runId}</span></div>}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input value={appTitle} onChange={(e)=>setAppTitle(e.target.value)} placeholder="Judul app" className="bg-[var(--bg)] brutal-border px-3 py-2 font-mono text-xs" />
                <select value={appType} onChange={(e)=>setAppType(e.target.value as any)} className="bg-[var(--bg)] brutal-border px-3 py-2 font-mono text-xs">
                  <option value="launch-campaign">Launch Campaign</option>
                  <option value="referral">Referral</option>
                  <option value="tipping">Tipping</option>
                </select>
                <input value={appDescription} onChange={(e)=>setAppDescription(e.target.value)} placeholder="Deskripsi singkat" className="bg-[var(--bg)] brutal-border px-3 py-2 font-mono text-xs" />
              </div>

              <div className="space-y-2">
                <div className="font-mono text-xs text-[var(--text-muted)]">Langkah 1: Buat konfigurasi app</div>
                <button onClick={generateConfig} className="px-3 py-2 brutal-border font-mono text-xs md:text-sm hover:bg-[var(--surface-hover)]">Buat Konfigurasi</button>
                {generatedConfig && <pre className="mt-2 brutal-border bg-[var(--bg)] p-2 overflow-auto text-xs font-mono max-h-[180px]">{JSON.stringify(generatedConfig, null, 2)}</pre>}
              </div>

              <div className="space-y-2">
                <div className="font-mono text-xs text-[var(--text-muted)]">Langkah 2: Publish app</div>
                <button onClick={publishRun} disabled={!result.runId || publishing || result.published} className="px-3 py-2 brutal-border bg-white text-black font-mono text-xs md:text-sm disabled:opacity-50">{result.published ? 'Sudah Dipublish' : publishing ? 'Mempublish...' : 'Publish App'}</button>
                {publishedAppId && <div className="font-mono text-xs text-[var(--neon)] break-all">appId: {publishedAppId}</div>}
              </div>

              <div className="space-y-2">
                <div className="font-mono text-xs text-[var(--text-muted)]">Langkah 3: Atur fee share</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input value={feeBaseMint} onChange={(e)=>setFeeBaseMint(e.target.value)} placeholder="Base mint" className="bg-[var(--bg)] brutal-border px-3 py-2 font-mono text-xs" />
                  <input value={feeClaimers} onChange={(e)=>setFeeClaimers(e.target.value)} placeholder="Wallet penerima (pisahkan koma)" className="bg-[var(--bg)] brutal-border px-3 py-2 font-mono text-xs" />
                  <input value={feeBps} onChange={(e)=>setFeeBps(e.target.value)} placeholder="BPS (contoh: 7000,3000)" className="bg-[var(--bg)] brutal-border px-3 py-2 font-mono text-xs" />
                </div>
                <button onClick={setupFeeSharing} disabled={!publishedAppId || feeSharingLoading} className="px-3 py-2 brutal-border font-mono text-xs md:text-sm disabled:opacity-50 hover:bg-[var(--surface-hover)]">{feeSharingLoading ? 'Menyimpan...' : 'Simpan Fee Share'}</button>
                {feeSharingMsg && <div className="font-mono text-xs text-[var(--text-muted)] break-all">{feeSharingMsg}</div>}
              </div>

              <a href="/apps" target="_blank" className="inline-block px-3 py-2 brutal-border font-mono text-xs md:text-sm hover:bg-[var(--surface-hover)]">Lihat Daftar App</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
