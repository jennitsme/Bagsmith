'use client';

import { motion } from 'motion/react';
import { Activity, Users, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function AnalyticsOverview() {
  const stats = [
    { label: 'Total DAU', value: '12,450', change: '+14.5%', positive: true, icon: Users },
    { label: 'MRR Equivalent', value: '$45,200', change: '+8.2%', positive: true, icon: DollarSign },
    { label: 'Tx Volume (24h)', value: '1.2M', change: '-2.4%', positive: false, icon: Activity },
    { label: 'Active Traders', value: '3,890', change: '+21.1%', positive: true, icon: TrendingUp },
  ];

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter">Analytics & Ranking Engine</h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-3 md:px-4 py-2 text-xs md:text-sm font-mono brutal-border bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors">24h</button>
            <button className="flex-1 sm:flex-none px-3 md:px-4 py-2 text-xs md:text-sm font-mono brutal-border bg-[var(--neon)] text-black font-bold">7d</button>
            <button className="flex-1 sm:flex-none px-3 md:px-4 py-2 text-xs md:text-sm font-mono brutal-border bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors">30d</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="brutal-border bg-[var(--surface)] p-4 md:p-6 relative group hover:brutal-shadow-hover transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-sm bg-[var(--bg)] brutal-border flex items-center justify-center text-[var(--neon)] group-hover:bg-[var(--neon)] group-hover:text-black transition-colors duration-300">
                  <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className={`flex items-center gap-1 text-xs md:text-sm font-mono ${stat.positive ? 'text-[var(--neon)]' : 'text-[var(--accent)]'}`}>
                  {stat.positive ? <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" /> : <ArrowDownRight className="w-3 h-3 md:w-4 md:h-4" />}
                  {stat.change}
                </div>
              </div>
              <h3 className="text-[var(--text-muted)] font-mono text-xs md:text-sm uppercase tracking-wider mb-1 md:mb-2 group-hover:text-white transition-colors duration-300">{stat.label}</h3>
              <p className="text-3xl md:text-4xl font-bold tracking-tighter">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 brutal-border bg-[var(--surface)] p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold uppercase mb-4 md:mb-6">Top Performing Mini-Apps</h3>
            <div className="space-y-3 md:space-y-4">
              {[
                { name: 'Degen Referral Loop', type: 'Referral', volume: '$450k', users: '2.4k' },
                { name: 'VIP Alpha Access', type: 'Gated Access', volume: '$210k', users: '850' },
                { name: 'Meme Coin Tipping', type: 'Tipping', volume: '$120k', users: '5.1k' },
                { name: 'Trader Loyalty Pass', type: 'Loyalty', volume: '$85k', users: '1.2k' },
              ].map((app, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 brutal-border bg-[var(--bg)] hover:border-[var(--neon)] transition-colors group cursor-pointer gap-4 sm:gap-0">
                  <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                    <span className="text-[var(--text-muted)] font-mono w-4 text-xs md:text-sm group-hover:text-[var(--neon)] transition-colors">{i + 1}</span>
                    <div>
                      <p className="font-bold text-sm md:text-base group-hover:text-[var(--neon)] transition-colors">{app.name}</p>
                      <p className="text-[10px] md:text-xs font-mono text-[var(--text-muted)] group-hover:text-white/70 transition-colors">{app.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 md:gap-8 text-right font-mono text-xs md:text-sm w-full sm:w-auto justify-end border-t sm:border-t-0 border-[var(--line)] pt-2 sm:pt-0">
                    <div>
                      <p className="text-[var(--text-muted)] text-[10px] md:text-xs group-hover:text-white/70 transition-colors">Volume</p>
                      <p>{app.volume}</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)] text-[10px] md:text-xs group-hover:text-white/70 transition-colors">Users</p>
                      <p>{app.users}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="brutal-border bg-[var(--surface)] p-4 md:p-6 flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--neon)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h3 className="text-lg md:text-xl font-bold uppercase mb-4 md:mb-6 relative z-10">Fee Sharing Payouts</h3>
            <div className="flex-1 flex flex-col justify-center items-center text-center p-4 md:p-6 brutal-border border-dashed border-[var(--text-muted)] mb-4 md:mb-6 relative z-10 group-hover:border-[var(--neon)] transition-colors duration-300">
              <DollarSign className="w-8 h-8 md:w-12 md:h-12 text-[var(--neon)] mb-3 md:mb-4" />
              <p className="text-[var(--text-muted)] font-mono text-xs md:text-sm mb-1 md:mb-2 group-hover:text-white/70 transition-colors">Available to claim</p>
              <p className="text-4xl md:text-5xl font-bold tracking-tighter text-[var(--neon)]">12.4 ETH</p>
              <p className="text-[10px] md:text-xs font-mono text-[var(--text-muted)] mt-1 md:mt-2 group-hover:text-white/70 transition-colors">≈ $42,500 USD</p>
            </div>
            <button className="w-full py-3 md:py-4 bg-[var(--neon)] text-black font-bold text-sm md:text-base uppercase tracking-wider brutal-border hover:bg-white transition-colors relative z-10">
              Claim Payout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
