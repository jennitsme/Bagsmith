'use client';

import { motion } from 'motion/react';
import { Layers, Copy } from 'lucide-react';
import { MINI_APP_TEMPLATES, type MiniAppTemplate } from '@/lib/templates';

export function TemplatesArea({ onUseTemplate }: { onUseTemplate: (template: MiniAppTemplate) => void }) {
  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[var(--accent)] rounded-sm flex items-center justify-center brutal-shadow flex-shrink-0">
            <Layers className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter">Smart Contract Templates</h2>
        </div>

        <p className="text-[var(--text-muted)] font-mono text-sm md:text-base mb-8 md:mb-12 max-w-2xl">
          Select a real template, auto-fill the Forge inputs, then run the pipeline.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {MINI_APP_TEMPLATES.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="brutal-border bg-[var(--surface)] p-4 md:p-6 flex flex-col group hover:brutal-shadow-hover transition-all duration-300"
            >
              <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
                {template.tags.map((tag) => (
                  <span key={tag} className="text-[10px] md:text-xs font-mono px-2 py-1 brutal-border rounded-sm text-[var(--neon)] border-[var(--neon)]/30 bg-[var(--neon)]/10">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="text-lg md:text-xl font-bold uppercase mb-2 group-hover:text-[var(--neon)] transition-colors">{template.name}</h3>
              <p className="text-[var(--text-muted)] font-mono text-xs md:text-sm mb-4 md:mb-6 flex-1">{template.desc}</p>

              <div className="pt-4 border-t border-[var(--line)] space-y-2">
                <button
                  onClick={() => navigator.clipboard.writeText(template.prompt)}
                  className="w-full text-xs md:text-sm font-mono flex items-center justify-center gap-2 text-[var(--text-muted)] hover:text-white transition-colors brutal-border px-3 py-2"
                >
                  <Copy className="w-3 h-3 md:w-4 md:h-4" /> Copy Prompt
                </button>
                <button
                  onClick={() => onUseTemplate(template)}
                  className="w-full text-xs md:text-sm font-bold uppercase tracking-wider bg-[var(--bg)] brutal-border px-3 md:px-4 py-2 group-hover:bg-[var(--neon)] group-hover:text-black transition-colors"
                >
                  Use Template in Forge
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
