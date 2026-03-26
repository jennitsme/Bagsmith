'use client';

import { useEffect, useState } from 'react';
import bs58 from 'bs58';

import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { ForgeArea } from '@/components/ForgeArea';
import { AnalyticsOverview } from '@/components/AnalyticsOverview';
import { TemplatesArea } from '@/components/TemplatesArea';
import { SecurityArea } from '@/components/SecurityArea';
import { SettingsArea } from '@/components/SettingsArea';
import type { MiniAppTemplate } from '@/lib/templates';

type PhantomProvider = {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toBase58: () => string } }>;
  signMessage: (message: Uint8Array, display?: 'utf8' | 'hex') => Promise<{ signature: Uint8Array }>;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('forge');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MiniAppTemplate | null>(null);

  const [wallet, setWallet] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadSession = async () => {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    const data = await res.json();
    if (res.ok && data?.ok) setWallet(data.wallet || null);
  };

  useEffect(() => {
    loadSession();
  }, []);

  const signInWithWallet = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const provider = (window as any)?.solana as PhantomProvider | undefined;
      if (!provider?.isPhantom) throw new Error('Phantom wallet not detected. Install Phantom first.');

      const conn = await provider.connect();
      const walletAddress = conn.publicKey.toBase58();

      const nonceRes = await fetch('/api/auth/nonce');
      const nonceData = await nonceRes.json();
      if (!nonceRes.ok || !nonceData?.ok || !nonceData?.message) {
        throw new Error(nonceData?.error || 'Failed to get auth nonce.');
      }

      const message = String(nonceData.message);
      const encoded = new TextEncoder().encode(message);
      const signed = await provider.signMessage(encoded, 'utf8');
      const signatureB58 = bs58.encode(signed.signature);

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddress, message, signature: signatureB58 }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData?.ok) {
        throw new Error(verifyData?.error || 'Wallet sign-in failed.');
      }

      setWallet(verifyData.wallet || walletAddress);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unexpected auth error');
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setWallet(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        closeSidebar={() => setIsSidebarOpen(false)}
        wallet={wallet}
      />

      <div className="flex-1 flex flex-col relative overflow-hidden w-full">
        <TopNav
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          wallet={wallet}
          onSignIn={signInWithWallet}
          onLogout={logout}
          authLoading={authLoading}
        />

        {authError && (
          <div className="mx-4 md:mx-8 mt-3 brutal-border border-red-500 text-red-400 bg-red-950/20 p-3 font-mono text-xs md:text-sm">
            {authError}
          </div>
        )}

        <main className="flex-1 overflow-y-auto relative">
          {activeTab === 'forge' && <ForgeArea selectedTemplate={selectedTemplate} />}
          {activeTab === 'templates' && (
            <TemplatesArea
              onUseTemplate={(template) => {
                setSelectedTemplate(template);
                setActiveTab('forge');
              }}
            />
          )}
          {activeTab === 'analytics' && <AnalyticsOverview />}
          {activeTab === 'security' && <SecurityArea />}
          {activeTab === 'settings' && <SettingsArea />}
        </main>
      </div>
    </div>
  );
}
