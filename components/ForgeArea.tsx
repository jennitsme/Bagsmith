'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Code, Database, Cpu, ShieldCheck, Rocket, CheckCircle2 } from 'lucide-react';

export function ForgeArea() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const handleGenerate = () => {
    if (!prompt) return;
    setIsGenerating(true);
    setProgress(0);
    setIsDone(false);

    // Simulate generation process
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsGenerating(false);
            setIsDone(true);
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full relative">
      <div className="absolute inset-0 tech-grid opacity-20 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-4">
            Forge Your <span className="text-[var(--neon)]">Mini-App</span>
          </h2>
          <p className="text-[var(--text-muted)] font-mono text-sm md:text-base max-w-2xl mx-auto">
            Describe your crypto mini-app (loyalty, referral, tipping, gated access).
            Bagsmith will generate the logic, deploy smart contracts, and set up fee-sharing on Bags.
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto w-full">
          <div className="brutal-border bg-[var(--surface)] p-2 rounded-sm brutal-shadow transition-all focus-within:brutal-shadow-hover focus-within:border-[var(--neon)] relative z-20">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Create a referral campaign where users get 5% of trading fees and a unique NFT badge for inviting 3 friends..."
              className="w-full bg-transparent p-3 md:p-4 text-base md:text-lg font-mono resize-none focus:outline-none placeholder-[var(--text-muted)]/50 min-h-[100px] md:min-h-[120px]"
              disabled={isGenerating || isDone}
            />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 border-t border-[var(--line)] gap-4 sm:gap-2">
              <div className="flex flex-wrap gap-2">
                {['Loyalty', 'Referral', 'Tipping', 'Gated Access'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setPrompt(`Create a ${tag.toLowerCase()} mini-app that...`)}
                    disabled={isGenerating || isDone}
                    className="px-2 md:px-3 py-1 text-[10px] md:text-xs font-mono brutal-border rounded-sm hover:bg-[var(--neon)] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt || isDone}
                className="w-full sm:w-auto bg-[var(--neon)] text-black px-4 md:px-6 py-2 md:py-3 font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed brutal-border relative overflow-hidden group text-sm md:text-base"
              >
                <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                  {isGenerating ? (
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                  ) : isDone ? (
                    <>Deployed <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /></>
                  ) : (
                    <>Forge App <ArrowRight className="w-4 h-4 md:w-5 md:h-5" /></>
                  )}
                </span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {(isGenerating || isDone) && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden md:mt-8"
              >
                <div className="brutal-border bg-[var(--surface)] p-4 md:p-6 rounded-sm relative">
                  <div className="absolute top-0 left-0 h-1 bg-[var(--neon)] transition-all duration-150 ease-linear" style={{ width: `${progress}%` }} />
                  
                  <h3 className="text-lg md:text-xl font-bold uppercase mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                    {isDone ? (
                      <><CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-[var(--neon)]" /> App Successfully Deployed</>
                    ) : (
                      <><Cpu className="w-5 h-5 md:w-6 md:h-6 text-[var(--neon)]" /> Bagsmith is working...</>
                    )}
                  </h3>

                  <div className="space-y-3 md:space-y-4 font-mono text-xs md:text-sm">
                    <Step icon={Code} label="Analyzing prompt & generating logic..." active={progress > 0} done={progress > 25} />
                    <Step icon={Database} label="Compiling smart contract templates..." active={progress > 25} done={progress > 50} />
                    <Step icon={ShieldCheck} label="Running security & policy checks..." active={progress > 50} done={progress > 75} />
                    <Step icon={Rocket} label="Deploying to Bags Network & setting fee-sharing..." active={progress > 75} done={progress >= 100} />
                  </div>

                  {isDone && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-[var(--line)] flex flex-col sm:flex-row justify-between items-center gap-4"
                    >
                      <div className="flex w-full sm:w-auto gap-2 md:gap-4">
                        <button className="flex-1 sm:flex-none px-3 md:px-4 py-2 brutal-border bg-[var(--bg)] hover:bg-[var(--surface-hover)] font-mono text-xs md:text-sm transition-colors text-center">
                          View Contract
                        </button>
                        <button className="flex-1 sm:flex-none px-3 md:px-4 py-2 brutal-border bg-[var(--bg)] hover:bg-[var(--surface-hover)] font-mono text-xs md:text-sm transition-colors text-center">
                          Open Dashboard
                        </button>
                      </div>
                      <button 
                        onClick={() => {
                          setPrompt('');
                          setIsDone(false);
                          setProgress(0);
                        }}
                        className="text-[var(--text-muted)] hover:text-white font-mono text-xs md:text-sm transition-colors w-full sm:w-auto text-center"
                      >
                        Forge Another App
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Step({ icon: Icon, label, active, done }: { icon: any, label: string, active: boolean, done: boolean }) {
  return (
    <div className={`flex items-center gap-3 md:gap-4 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-30'}`}>
      <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center brutal-border transition-colors duration-300 flex-shrink-0 ${done ? 'bg-[var(--neon)] text-black border-[var(--neon)]' : active ? 'border-[var(--neon)] text-[var(--neon)]' : 'border-[var(--line)] text-[var(--text-muted)]'}`}>
        <Icon className="w-3 h-3 md:w-4 md:h-4" />
      </div>
      <span className={`transition-colors duration-300 ${done ? 'text-white' : active ? 'text-[var(--neon)]' : 'text-[var(--text-muted)]'} line-clamp-2`}>
        {label}
      </span>
      {active && !done && (
        <span className="ml-auto text-[var(--neon)] animate-pulse hidden sm:inline-block">...</span>
      )}
      {done && (
        <span className="ml-auto text-[var(--neon)] hidden sm:inline-block">Done</span>
      )}
    </div>
  );
}
