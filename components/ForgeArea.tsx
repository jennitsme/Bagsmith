'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { MiniAppTemplate } from '@/lib/templates';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export function ForgeArea({ selectedTemplate }: { selectedTemplate?: MiniAppTemplate | null }) {
  const [prompt, setPrompt] = useState('');
  const [inputMint, setInputMint] = useState(SOL_MINT);
  const [outputMint, setOutputMint] = useState('');
  const [amount, setAmount] = useState('1000000');
  const [executeSwap, setExecuteSwap] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTemplate) return;
    setPrompt(selectedTemplate.prompt);
    setInputMint(selectedTemplate.defaults.inputMint);
    setOutputMint(selectedTemplate.defaults.outputMint);
    setAmount(selectedTemplate.defaults.amount);
    setExecuteSwap(selectedTemplate.defaults.executeSwap);
    setError(null);
    setResult(null);
  }, [selectedTemplate]);

  const runForge = async () => {
    setError(null);
    setResult(null);

    if (!prompt.trim()) {
      setError('Prompt is required.');
      return;
    }

    if (!inputMint.trim() || !outputMint.trim() || !amount.trim()) {
      setError('inputMint, outputMint, and amount are required.');
      return;
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
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Forge failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full relative">
      <div className="absolute inset-0 tech-grid opacity-20 pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-2 md:mb-4"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-4">
            Forge Your <span className="text-[var(--neon)]">Mini-App</span>
          </h2>
          <p className="text-[var(--text-muted)] font-mono text-sm md:text-base max-w-2xl mx-auto">
            Real pipeline: prompt intake, Bags quote retrieval, optional swap transaction creation, signing, and send.
          </p>
          {selectedTemplate && (
            <p className="mt-3 font-mono text-xs text-[var(--neon)]">
              Template loaded: {selectedTemplate.name}
            </p>
          )}
        </motion.div>

        <div className="brutal-border bg-[var(--surface)] p-4 md:p-6 rounded-sm">
          <label className="block font-mono text-xs text-[var(--text-muted)] mb-2">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your mini-app idea..."
            className="w-full bg-[var(--bg)] brutal-border p-3 md:p-4 text-sm md:text-base font-mono resize-none focus:outline-none min-h-[110px]"
            disabled={isRunning}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-4 font-mono text-sm">
            <input
              value={inputMint}
              onChange={(e) => setInputMint(e.target.value)}
              placeholder="Input mint"
              className="bg-[var(--bg)] brutal-border px-3 py-2 focus:outline-none"
              disabled={isRunning}
            />
            <input
              value={outputMint}
              onChange={(e) => setOutputMint(e.target.value)}
              placeholder="Output mint"
              className="bg-[var(--bg)] brutal-border px-3 py-2 focus:outline-none"
              disabled={isRunning}
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (smallest unit)"
              className="bg-[var(--bg)] brutal-border px-3 py-2 focus:outline-none"
              disabled={isRunning}
            />
          </div>

          <label className="mt-4 flex items-center gap-2 font-mono text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={executeSwap}
              onChange={(e) => setExecuteSwap(e.target.checked)}
              disabled={isRunning}
            />
            Execute real swap (create + sign + send transaction)
          </label>

          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <button
              onClick={runForge}
              disabled={isRunning}
              className="bg-[var(--neon)] text-black px-4 py-2 font-bold uppercase tracking-wider brutal-border disabled:opacity-50 flex items-center gap-2"
            >
              {isRunning ? 'Running...' : 'Run Forge Pipeline'} <ArrowRight className="w-4 h-4" />
            </button>
            <p className="font-mono text-xs text-[var(--text-muted)]">
              No fake progress bar. Status reflects actual backend operations.
            </p>
          </div>
        </div>

        {error && (
          <div className="brutal-border border-red-500 text-red-400 bg-red-950/20 p-3 font-mono text-xs md:text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="brutal-border bg-[var(--surface)] p-4 md:p-6 rounded-sm">
            <h3 className="text-lg md:text-xl font-bold uppercase mb-4">Pipeline Result</h3>

            <div className="font-mono text-xs md:text-sm space-y-2 mb-4">
              <div>mode: <span className="text-[var(--neon)]">{result.mode}</span></div>
              <div>wallet: <span className="break-all">{result.wallet}</span></div>
              <div>promptAccepted: {String(result?.stages?.promptAccepted)}</div>
              <div>quoteFetched: {String(result?.stages?.quoteFetched)}</div>
              <div>swapCreated: {String(result?.stages?.swapCreated)}</div>
              <div>transactionSent: {String(result?.stages?.transactionSent)}</div>
              {result.signature && <div className="break-all">signature: <span className="text-green-400">{result.signature}</span></div>}
            </div>

            <pre className="mt-4 brutal-border bg-[var(--bg)] p-3 md:p-4 overflow-auto text-xs md:text-sm font-mono max-h-[340px]">
{JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
