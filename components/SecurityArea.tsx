'use client';

import { motion } from 'motion/react';
import { Shield, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function SecurityArea() {
  const checks = [
    { name: 'Reentrancy Guards', status: 'Passed', desc: 'All external calls are protected against reentrancy attacks.' },
    { name: 'Access Control', status: 'Passed', desc: 'Only authorized roles can execute sensitive functions.' },
    { name: 'Rate Limiting', status: 'Active', desc: 'API endpoints are rate-limited to prevent abuse.' },
    { name: 'Signature Verification', status: 'Active', desc: 'All off-chain actions require valid EIP-712 signatures.' },
    { name: 'Treasury Controls', status: 'Passed', desc: 'Multi-sig required for treasury withdrawals > 10 ETH.' },
    { name: 'Policy Checks', status: 'Warning', desc: '1 mini-app flagged for potentially violating Bags terms.' },
  ];

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[var(--accent)] rounded-sm flex items-center justify-center brutal-shadow flex-shrink-0">
            <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter">Security & Policy Layer</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="lg:col-span-2 brutal-border bg-[var(--surface)] p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold uppercase mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
              <Lock className="w-4 h-4 md:w-5 md:h-5 text-[var(--neon)]" />
              Contract Guardrails
            </h3>
            <div className="space-y-3 md:space-y-4">
              {checks.map((check, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 brutal-border bg-[var(--bg)] gap-3 sm:gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-sm md:text-base mb-1">{check.name}</p>
                    <p className="text-xs md:text-sm font-mono text-[var(--text-muted)]">{check.desc}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 rounded-sm text-[10px] md:text-xs font-mono uppercase tracking-wider brutal-border whitespace-nowrap ${
                    check.status === 'Passed' || check.status === 'Active' 
                      ? 'bg-[var(--neon)]/10 text-[var(--neon)] border-[var(--neon)]/30' 
                      : 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30'
                  }`}>
                    {check.status === 'Passed' || check.status === 'Active' ? <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" /> : <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />}
                    {check.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="brutal-border bg-[var(--surface)] p-4 md:p-6 flex flex-col">
            <h3 className="text-lg md:text-xl font-bold uppercase mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-[var(--accent)]" />
              Active Alerts
            </h3>
            <div className="flex-1 space-y-3 md:space-y-4">
              <div className="p-3 md:p-4 brutal-border border-l-4 border-l-[var(--accent)] bg-[var(--bg)]">
                <p className="font-bold text-sm mb-1 md:mb-2">High Gas Usage Detected</p>
                <p className="text-[10px] md:text-xs font-mono text-[var(--text-muted)]">Mini-app &quot;Degen Referral Loop&quot; is consuming 30% more gas than average. Consider optimizing the payout loop.</p>
                <button className="mt-3 md:mt-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:text-white transition-colors">Investigate &rarr;</button>
              </div>
              <div className="p-3 md:p-4 brutal-border border-l-4 border-l-yellow-500 bg-[var(--bg)]">
                <p className="font-bold text-sm mb-1 md:mb-2">Policy Warning</p>
                <p className="text-[10px] md:text-xs font-mono text-[var(--text-muted)]">&quot;Meme Coin Tipping&quot; app description contains flagged keywords. Review required.</p>
                <button className="mt-3 md:mt-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-yellow-500 hover:text-white transition-colors">Review App &rarr;</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
