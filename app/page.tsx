'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { ForgeArea } from '@/components/ForgeArea';
import { AnalyticsOverview } from '@/components/AnalyticsOverview';
import { TemplatesArea } from '@/components/TemplatesArea';
import { SecurityArea } from '@/components/SecurityArea';
import { SettingsArea } from '@/components/SettingsArea';

export default function Home() {
  const [activeTab, setActiveTab] = useState('forge');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      />
      
      <div className="flex-1 flex flex-col relative overflow-hidden w-full">
        <TopNav toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto relative">
          {activeTab === 'forge' && <ForgeArea />}
          {activeTab === 'templates' && <TemplatesArea />}
          {activeTab === 'analytics' && <AnalyticsOverview />}
          {activeTab === 'security' && <SecurityArea />}
          {activeTab === 'settings' && <SettingsArea />}
        </main>
      </div>
    </div>
  );
}
