'use client';
import { useState, useEffect } from 'react';

export default function PremiumLoader({ inline = false }) {
  const texts = [
    "Scanning label details...",
    "Extracting manufacturer data...",
    "Cross-checking metrology rules...",
    "Generating compliance report..."
  ];
  const [textIdx, setTextIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIdx((prev) => (prev + 1) % texts.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <div className={inline ? "flex flex-col items-center justify-center w-full" : "fixed inset-0 z-[99999] bg-white dark:bg-[#090a0f] flex flex-col items-center justify-center animate-in fade-in duration-300"}>
      
      {/* Animated Objects Container */}
      <div className={`flex items-end justify-center gap-12 h-[120px] ${inline ? "mb-6 scale-75 md:scale-100" : "mb-16"}`}>
        
        {/* Object 1: Shield */}
        <div className="flex flex-col items-center gap-6">
          <div className="animate-[bounceFloat_1.5s_ease-in-out_infinite_alternate]">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="url(#shieldGrad)" className="drop-shadow-xl">
              <defs>
                <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E3A8A" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          {/* Shadow */}
          <div className="w-12 h-2 bg-black/15 dark:bg-white/20 rounded-[100%] blur-[2px] animate-[shadowScale_1.5s_ease-in-out_infinite_alternate]"></div>
        </div>

        {/* Object 2: Document */}
        <div className="flex flex-col items-center gap-6">
          <div className="animate-[bounceFloat_1.5s_ease-in-out_infinite_alternate-reverse]">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="url(#docGrad)" className="drop-shadow-xl">
              <defs>
                <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#FCD34D" />
                </linearGradient>
              </defs>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" fill="#FCD34D" />
              <line x1="16" y1="13" x2="8" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="17" x2="8" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="10" y1="9" x2="8" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          {/* Shadow */}
          <div className="w-12 h-2 bg-black/15 dark:bg-white/20 rounded-[100%] blur-[2px] animate-[shadowScale_1.5s_ease-in-out_infinite_alternate-reverse]"></div>
        </div>
        
      </div>

      {/* Dynamic Text */}
      {!inline && (<div className="h-8 relative w-full flex justify-center">
         <div key={textIdx} className="absolute text-[16px] md:text-[18px] font-bold text-text-primary tracking-wide text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
           {texts[textIdx]}
         </div>
      </div>)}
    </div>
  );
}
