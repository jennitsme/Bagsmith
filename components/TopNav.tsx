'use client';

import { Bell, Search, ChevronDown, Menu } from 'lucide-react';

export function TopNav({ toggleSidebar }: { toggleSidebar: () => void }) {
  return (
    <header className="h-16 brutal-border border-x-0 border-t-0 flex items-center justify-between px-4 md:px-8 bg-[var(--surface)]/50 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-2 md:gap-4 w-full md:w-1/3">
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-2 text-[var(--text-muted)] hover:text-white transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search projects, templates, tx..."
            className="w-full bg-[var(--bg)] brutal-border rounded-sm py-2 pl-10 pr-4 text-sm font-mono focus:outline-none focus:border-[var(--neon)] transition-colors placeholder-[var(--text-muted)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 brutal-border rounded-full bg-[var(--bg)]">
          <div className="w-2 h-2 rounded-full bg-[var(--neon)] animate-pulse" />
          <span className="text-[10px] md:text-xs font-mono text-[var(--neon)] uppercase tracking-wider hidden sm:inline-block">Bags Network: Live</span>
          <span className="text-[10px] md:text-xs font-mono text-[var(--neon)] uppercase tracking-wider sm:hidden">Live</span>
        </div>

        <button className="relative p-2 text-[var(--text-muted)] hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--accent)] rounded-full" />
        </button>

        <div className="flex items-center gap-2 md:gap-3 brutal-border px-2 md:px-3 py-1.5 rounded-sm cursor-pointer hover:bg-[var(--surface-hover)] transition-colors">
          <div className="w-6 h-6 rounded-sm bg-gradient-to-br from-[var(--neon)] to-[var(--accent)]" />
          <span className="text-sm font-bold hidden sm:inline-block">Creator.eth</span>
          <ChevronDown className="w-4 h-4 text-[var(--text-muted)] hidden sm:inline-block" />
        </div>
      </div>
    </header>
  );
}
