'use client';

import { motion } from 'motion/react';
import { Terminal, Zap, BarChart2, Settings, Wallet, Layers, Box, X, User } from 'lucide-react';

const navItems = [
  { icon: Terminal, label: 'Builder', id: 'forge' },
  { icon: Layers, label: 'Templates', id: 'templates' },
  { icon: Box, label: 'Apps', id: 'apps' },
  { icon: BarChart2, label: 'Analytics', id: 'analytics' },
  { icon: User, label: 'Profile', id: 'profile' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

function shortWallet(wallet: string) {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  isOpen,
  closeSidebar,
  wallet,
  profile,
}: {
  activeTab: string;
  setActiveTab: (id: string) => void;
  isOpen: boolean;
  closeSidebar: () => void;
  wallet: string | null;
  profile: { displayName: string; avatarUrl: string; bio: string } | null;
}) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm" onClick={closeSidebar} />}

      <div
        className={`fixed md:static inset-y-0 left-0 w-64 h-screen brutal-border border-y-0 border-l-0 bg-[var(--bg)] flex flex-col justify-between p-4 z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-12 px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[var(--neon)] rounded-sm flex items-center justify-center brutal-shadow">
                <Zap className="w-5 h-5 text-black" />
              </div>
              <h1 className="text-xl font-bold tracking-tighter uppercase">Bagsmith</h1>
            </div>
            <button onClick={closeSidebar} className="md:hidden text-[var(--text-muted)] hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 relative group overflow-hidden ${
                    isActive ? 'text-black' : 'text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-[var(--neon)]"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-black' : 'group-hover:text-[var(--neon)] transition-colors'}`} />
                  <span className="font-mono text-sm relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="brutal-border p-4 rounded-sm bg-[var(--surface)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-[var(--accent)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
          <div className="relative z-10 flex items-center gap-3">
            <Wallet className="w-5 h-5 group-hover:text-white transition-colors" />
            <div className="flex flex-col text-left">
              <span className="font-mono text-xs text-[var(--text-muted)] group-hover:text-white/70 transition-colors">
                {wallet ? 'Connected' : 'Not Connected'}
              </span>
              <span className="font-mono text-sm font-bold truncate w-32">{wallet ? (profile?.displayName || shortWallet(wallet)) : '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
