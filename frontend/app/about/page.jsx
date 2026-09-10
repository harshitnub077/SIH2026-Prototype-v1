"use client";
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Scale, Cpu, FileText, Heart } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';

export default function AboutPage() {
  const router = useRouter();
  const RULES_VERSION = 'v1.4 - LM(PC) Rules 2011, Amendment 2022';
  const APP_VERSION   = '2.5.0';
  const BUILD_DATE    = '2026-09-04';

  return (
    <div className="min-h-screen bg-background text-text-primary pb-20">
      
      {/* App Bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-[var(--color-border)] h-16 flex items-center px-4 md:px-6">
        <button 
          onClick={() => { triggerHaptic('light'); router.back(); }}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <h1 className="text-[17px] font-bold ml-2">About MetroLens</h1>
      </div>

      <main className="max-w-[700px] mx-auto px-3 sm:px-6 py-6 sm:py-8 animate-fade-in">
        
        {/* Header / Logo Area */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-10 mt-2 sm:mt-4">
          {/* State Emblem of India */}
          <div className="mb-4 sm:mb-6 relative">
            <div className="absolute inset-0 bg-accent/5 rounded-full blur-2xl transform scale-150"></div>
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
              alt="State Emblem of India" 
              className="h-24 sm:h-32 w-auto relative z-10 drop-shadow-lg"
            />
          </div>
          <h2 className="text-[26px] sm:text-[32px] font-bold tracking-tight text-text-primary">MetroLens</h2>
          <p className="text-[13px] sm:text-[15px] font-medium text-accent uppercase tracking-widest mt-1">SIH26034</p>
          <p className="text-xs sm:text-[14px] text-text-secondary mt-2 sm:mt-3 max-w-md mx-auto leading-relaxed">
            AI-driven compliance engine for the Legal Metrology (Packaged Commodities) Rules, 2011.
          </p>
        </div>

        {/* Info Cards */}
        <div className="flex flex-col gap-4 sm:gap-6">
          
          <section className="glass rounded-2xl sm:rounded-[24px] border border-border/50 p-4 sm:p-6 shadow-sm">
            <h3 className="text-[12px] sm:text-[13px] font-bold tracking-widest uppercase text-text-muted mb-3 sm:mb-4">Project Overview</h3>
            <div className="space-y-3 sm:space-y-4 text-xs sm:text-[14px] text-text-secondary leading-relaxed">
              <p>
                <strong>MetroLens</strong> is built for the Smart India Hackathon (SIH) under the problem statement <strong>SIH26034</strong> issued by the <strong>Department of Consumer Affairs, Government of India</strong>.
              </p>
              <p>
                The objective is to automate the scrutiny of pre-packaged commodity labels. By leveraging advanced Vision AI, the system instantly identifies mandatory declarations like Product Name, Net Quantity, MRP, Manufacturer Details, and FSSAI Licenses.
              </p>
            </div>
          </section>

          <section className="glass rounded-2xl sm:rounded-[24px] border border-border/50 p-4 sm:p-6 shadow-sm">
            <h3 className="text-[12px] sm:text-[13px] font-bold tracking-widest uppercase text-text-muted mb-3 sm:mb-4">Key Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <div className="mt-1 text-accent"><Cpu size={20} /></div>
                <div>
                  <h4 className="font-semibold text-text-primary text-xs sm:text-[14px]">Vision Extraction</h4>
                  <p className="text-[11px] sm:text-[13px] text-text-secondary mt-0.5 sm:mt-1">Extracts nested text using Gemini Flash Vision and Tesseract OCR fallbacks.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 text-accent"><Scale size={20} /></div>
                <div>
                  <h4 className="font-semibold text-text-primary text-xs sm:text-[14px]">Rule Validation</h4>
                  <p className="text-[11px] sm:text-[13px] text-text-secondary mt-0.5 sm:mt-1">Executes 14+ specific clauses of the LM(PC) rules against extracted data.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 text-accent"><FileText size={20} /></div>
                <div>
                  <h4 className="font-semibold text-text-primary text-xs sm:text-[14px]">Exportable Audits</h4>
                  <p className="text-[11px] sm:text-[13px] text-text-secondary mt-0.5 sm:mt-1">Generates legally compliant PDF notices and CSV data exports.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="glass rounded-2xl sm:rounded-[24px] border border-border/50 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 bg-black/5 dark:bg-white/5 border-b border-border/50">
              <h3 className="text-[12px] sm:text-[13px] font-bold tracking-widest uppercase text-text-muted">System Details</h3>
            </div>
            <div className="p-4 sm:p-5 text-xs sm:text-[13px] text-text-secondary space-y-3">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-4 gap-y-3">
                <span className="text-text-muted font-mono text-[10px] sm:text-[11px] uppercase tracking-wider">App Version</span>
                <span className="font-semibold text-text-primary">{APP_VERSION}</span>
                
                <span className="text-text-muted font-mono text-[10px] sm:text-[11px] uppercase tracking-wider">Build Date</span>
                <span className="font-semibold text-text-primary">{BUILD_DATE}</span>
                
                <span className="text-text-muted font-mono text-[10px] sm:text-[11px] uppercase tracking-wider">Rules Engine</span>
                <span className="font-semibold text-text-primary">{RULES_VERSION}</span>
                
                <span className="text-text-muted font-mono text-[10px] sm:text-[11px] uppercase tracking-wider">Frontend</span>
                <span className="font-semibold text-text-primary">Next.js 16 (App Router)</span>
                
                <span className="text-text-muted font-mono text-[10px] sm:text-[11px] uppercase tracking-wider">Backend</span>
                <span className="font-semibold text-text-primary">Node.js + PostgreSQL</span>
              </div>
            </div>
          </section>

        </div>

                {/* Engineered By Team MetroLens */}
        <div className="mt-16 mb-10 flex flex-col items-center justify-center">
          
          <style>{`
            @keyframes levitatePremium {
              0%, 100% { transform: translateY(0); box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.1); }
              50% { transform: translateY(-6px); box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.05); }
            }
            @keyframes sweepPremium {
              0% { transform: translateX(-150%) skewX(-15deg); }
              100% { transform: translateX(150%) skewX(-15deg); }
            }
          `}</style>
          
          <div className="relative w-14 h-14 mb-5 rounded-2xl bg-gradient-to-br from-[#0B1F3A] to-blue-950 border border-amber-400/40 flex items-center justify-center overflow-hidden animate-[levitatePremium_5s_ease-in-out_infinite] shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full animate-[sweepPremium_4s_infinite_linear]"></div>
            <span className="font-bold text-[22px] text-amber-300 relative z-10 tracking-tight">TM</span>
          </div>
          
          <div className="text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase mb-1.5">
            Engineered By
          </div>
          <h3 className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight">
            Team MetroLens
          </h3>
          <p className="text-[12px] text-slate-500 mt-1 tracking-wider">
            Smart India Hackathon 2026 Team (SIH26034)
          </p>
        </div>

      </main>
    </div>
  );
}

