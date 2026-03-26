'use client';

import { motion } from 'motion/react';
import { Settings, User, Bell, Shield, Key, Database, Globe } from 'lucide-react';

export function SettingsArea() {
  const sections = [
    {
      title: 'Profile & Account',
      icon: User,
      items: [
        { label: 'Display Name', value: 'Creator.eth', type: 'text' },
        { label: 'Email Address', value: 'creator@example.com', type: 'email' },
        { label: 'Connected Wallet', value: '0x7F...3A92', type: 'text', disabled: true },
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'Deployment Alerts', value: true, type: 'toggle' },
        { label: 'Fee Payouts', value: true, type: 'toggle' },
        { label: 'Security Warnings', value: true, type: 'toggle' },
        { label: 'Weekly Analytics', value: false, type: 'toggle' },
      ]
    },
    {
      title: 'API & Integration',
      icon: Key,
      items: [
        { label: 'Bags Network API Key', value: 'sk_live_...', type: 'password' },
        { label: 'Webhook URL', value: 'https://api.creator.com/webhook', type: 'text' },
      ]
    }
  ];

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[var(--accent)] rounded-sm flex items-center justify-center brutal-shadow flex-shrink-0">
            <Settings className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter">Settings</h2>
        </div>

        <div className="space-y-6 md:space-y-8">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="brutal-border bg-[var(--surface)] p-4 md:p-6"
            >
              <h3 className="text-lg md:text-xl font-bold uppercase mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                <section.icon className="w-4 h-4 md:w-5 md:h-5 text-[var(--neon)]" />
                {section.title}
              </h3>
              
              <div className="space-y-4">
                {section.items.map((item, j) => (
                  <div key={j} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 md:p-4 brutal-border bg-[var(--bg)]">
                    <label className="font-mono text-xs md:text-sm text-[var(--text-muted)]">{item.label}</label>
                    
                    {item.type === 'toggle' ? (
                      <button className={`w-10 md:w-12 h-5 md:h-6 rounded-full transition-colors relative brutal-border ${item.value ? 'bg-[var(--neon)]' : 'bg-[var(--surface-hover)]'}`}>
                        <div className={`absolute top-0.5 bottom-0.5 w-4 md:w-5 bg-white rounded-full transition-transform ${item.value ? 'translate-x-5 md:translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    ) : (
                      <input
                        type={item.type}
                        defaultValue={item.value as string}
                        disabled={(item as any).disabled}
                        className="bg-[var(--surface)] brutal-border px-3 py-1.5 md:py-2 text-xs md:text-sm font-mono focus:outline-none focus:border-[var(--neon)] transition-colors w-full sm:w-64 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-end gap-4 pt-4"
          >
            <button className="px-4 md:px-6 py-2 md:py-3 font-mono text-xs md:text-sm brutal-border bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors">
              Cancel
            </button>
            <button className="px-4 md:px-6 py-2 md:py-3 font-bold uppercase tracking-wider text-xs md:text-sm brutal-border bg-[var(--neon)] text-black hover:bg-white transition-colors">
              Save Changes
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
