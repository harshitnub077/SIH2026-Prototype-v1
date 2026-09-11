"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '@/components/NavBar';
import {
  ArrowRight, ShieldCheck, Scan, CheckCircle2, AlertTriangle,
  XCircle, Scale, FileText, Check, Cpu, Eye, ExternalLink,
  ChevronRight, Building2, BookOpen, AlertOctagon
} from 'lucide-react';

function HeroSeal() {
  return (
    <div className="relative w-[230px] xs:w-[280px] sm:w-[360px] md:w-[420px] lg:w-[450px] max-w-full aspect-[4/5] flex items-center justify-center mx-auto perspective-1000">
      {/* Background Soft Golden Halo & Ambient Glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#D4AF37]/25 via-[#FF9933]/15 to-transparent blur-3xl -z-10 pointer-events-none" />
      
      {/* Tricolor Subtle Aura Ring */}
      <div 
        className="absolute w-[88%] h-[88%] rounded-full border border-[#D4AF37]/30 pointer-events-none -z-10 animate-spin-slow opacity-75" 
        style={{ animationDuration: '40s' }} 
      />

      {/* 3D Rendered Emblem Container */}
      <div className="relative z-10 w-full h-full flex items-center justify-center transform-gpu transition-all duration-700 hover:scale-[1.02]">
        <Image 
          unoptimized={true} 
          src="/emblem-transparent.png" 
          alt="State Emblem of India - Lion Capital of Ashoka" 
          width={450} 
          height={540} 
          priority 
          className="object-contain w-full h-full drop-shadow-[0_20px_45px_rgba(11,31,58,0.28)] dark:drop-shadow-[0_25px_50px_rgba(212,175,55,0.25)]" 
          sizes="(max-width: 768px) 100vw, 450px" 
        />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [activeScenario, setActiveScenario] = useState('compliant');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') || localStorage.getItem('token')) : null;
    setIsAuthenticated(!!token);
  }, []);

  const scenarios = {
    compliant: {
      title: "Compliant Retail Package",
      badge: "100% Compliant",
      badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      productName: "Sunrise Refined Sunflower Oil (500 ml)",
      category: "Edible Oil (Fourth Schedule Item 11)",
      mrp: "₹ 145.00",
      mrpStatus: "Rule 6(1)(d) • Inclusive of all taxes",
      netQty: "500 ml & 455 g",
      netQtyStatus: "Dual volume + weight declaration verified",
      capHeight: "2.52 mm ± 0.18 mm",
      capHeightStatus: "Rule 7(2) Table I: Conforms to ≥ 2.5 mm floor",
      usp: "₹ 0.29 / ml",
      uspStatus: "Rule 6(11) Recomputed & Verified",
      verdictText: "Conforms to all mandatory declarations under Legal Metrology Rules, 2011. Inspection closed.",
      actionText: "No penalty or notice required • Official audit logged to National Repository."
    },
    violation: {
      title: "Font Height Defect",
      badge: "Improvement Notice Issued",
      badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
      productName: "Crispy Wave Potato Chips (85 g)",
      category: "Packaged Food",
      mrp: "₹ 85.00",
      mrpStatus: "Rule 6(1)(d) Present",
      netQty: "85 g",
      netQtyStatus: "Rule 6(1)(c) Metric unit valid",
      capHeight: "1.82 mm ± 0.21 mm",
      capHeightStatus: "Rule 7(2) Table I: Deficient (Mandatory floor is 2.0 mm; 0.18 mm short)",
      usp: "₹ 1.00 / g",
      uspStatus: "Recomputed correctly",
      verdictText: "Potential Non-Compliance on MRP Cap-Height. Guard-banded per ILAC G8:09/2019.",
      actionText: "Jan Vishwas Act 2026: Form IN-1 Improvement Notice drafted with 15-day statutory cure period."
    },
    invalid: {
      title: "Non-Packaging / Invalid Image",
      badge: "Rejected at Quality Gate",
      badgeColor: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
      productName: "Human Face / Non-Packaging Image",
      category: "Out of Scope",
      mrp: "Not Declared",
      mrpStatus: "No retail label in frame",
      netQty: "Not Declared",
      netQtyStatus: "No commodity detected",
      capHeight: "No Numerals Detected",
      capHeightStatus: "Optical metrology aborted",
      usp: "Not Applicable",
      uspStatus: "No pricing data",
      verdictText: "SPECIFIC DIAGNOSTIC REJECTION: Image contains a human subject / non-packaging scene.",
      actionText: "Required: Physical container (pouch, box, bottle, tin) with printed Rule 6 declarations (MRP, Net Qty, Mfg Date, Packer Address)."
    }
  };

  const current = scenarios[activeScenario];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070D18] text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      
      {/* Production Indian Government Navigation Bar */}
      <NavBar />

      {/* Hero Section with Official State Emblem */}
      <section className="relative overflow-hidden min-h-[calc(100vh-68px)] flex items-center justify-center py-6 px-4 md:px-8 max-w-7xl mx-auto w-full border-b border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* Left Column: Official Government Pitch */}
          <div className="lg:col-span-7 flex flex-col items-start">
            
            {/* Government Ministry Plinth */}
            <div className="flex flex-col items-start gap-1 mb-5">
              <div className="flex items-center gap-3 border-b-2 border-[#EAB308] pb-1.5">
                <span className="text-xs sm:text-sm font-bold tracking-wide text-slate-900 dark:text-white">भारत सरकार</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-900 dark:text-white">GOVERNMENT OF INDIA</span>
              </div>
              <p className="text-[11px] sm:text-[12px] tracking-widest uppercase font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                Ministry of Consumer Affairs, Food &amp; Public Distribution
              </p>
            </div>

            {/* Problem Statement Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium mb-5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI-Assisted Field Decision System • Problem ID: SIH26034</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-[46px] font-bold tracking-tight text-slate-950 dark:text-white leading-[1.15] mb-4">
              AI-Assisted Legal Metrology Verification &amp; Inspection Suite.
            </h1>

            {/* Sub-headline */}
            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-2xl">
              Assisting Legal Metrology Officers with rapid optical verification of packaged commodity declarations under the <strong>2011 Rules</strong> and <strong>Jan Vishwas Act, 2026</strong>.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-8 w-full sm:w-auto">
              <Link
                href="/login"
                className="w-full sm:w-auto text-center inline-flex items-center justify-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Scan size={18} />
                <span>Start Label Inspection</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/rules"
                className="w-full sm:w-auto text-center inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-all shadow-sm"
              >
                <BookOpen size={16} className="text-slate-500" />
                <span>Browse Statutory Rules</span>
              </Link>
            </div>

            {/* Official Statutory Impact Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-5 border-t border-slate-200 dark:border-slate-800 w-full">
              <div className="p-2 sm:p-0">
                <div className="text-lg xs:text-xl sm:text-2xl font-black text-slate-950 dark:text-white font-mono tracking-tight">&lt; 3.2s</div>
                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">Inspection Velocity</div>
                <div className="text-[10px] text-slate-500">vs ~45 min manual audit</div>
              </div>
              <div className="p-2 sm:p-0">
                <div className="text-lg xs:text-xl sm:text-2xl font-black text-slate-950 dark:text-white font-mono tracking-tight">32 Rules</div>
                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">Statutory Scope</div>
                <div className="text-[10px] text-slate-500">LM(PC) 2011 schedule rules</div>
              </div>
              <div className="p-2 sm:p-0">
                <div className="text-lg xs:text-xl sm:text-2xl font-black text-slate-950 dark:text-white font-mono tracking-tight">0.01 mm</div>
                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">Optical Precision</div>
                <div className="text-[10px] text-slate-500">Calibrated numeral height</div>
              </div>
              <div className="p-2 sm:p-0">
                <div className="text-lg xs:text-xl sm:text-2xl font-black text-slate-950 dark:text-white font-mono tracking-tight">15-Day Cure</div>
                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">Decriminalized Flow</div>
                <div className="text-[10px] text-slate-500">Jan Vishwas Form IN-1</div>
              </div>
            </div>

          </div>

          {/* Right Column: Lion Capital of Ashoka Emblem */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <HeroSeal />
          </div>

        </div>
      </section>

      {/* Official Interactive Compliance Demonstration Portal */}
      <section className="py-8 sm:py-12 px-3 sm:px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-900 dark:text-blue-400">
                Official Compliance Verification Preview
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Deterministic Inspection Telemetry
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            Demonstrating how MetroLens distinguishes valid packaged commodities, catches statutory font height defects, and rejects non-packaging images at the quality gate.
          </p>
        </div>

        {/* Console Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          
          {/* Top Bar with Toggles */}
          <div className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Test Scenario:</span>
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 w-full sm:w-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveScenario('compliant')}
                className={`px-3 py-2 sm:py-1.5 rounded-lg transition-all text-center ${
                  activeScenario === 'compliant'
                    ? 'bg-[#0B1F3A] text-white shadow-sm'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                1. Compliant Pack
              </button>
              <button
                type="button"
                onClick={() => setActiveScenario('violation')}
                className={`px-3 py-2 sm:py-1.5 rounded-lg transition-all text-center ${
                  activeScenario === 'violation'
                    ? 'bg-[#0B1F3A] text-white shadow-sm'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                2. Font Defect
              </button>
              <button
                type="button"
                onClick={() => setActiveScenario('invalid')}
                className={`px-3 py-2 sm:py-1.5 rounded-lg transition-all text-center ${
                  activeScenario === 'invalid'
                    ? 'bg-[#0B1F3A] text-white shadow-sm'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                3. Quality Gate Rejection
              </button>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-5 sm:p-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase">Subject:</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{current.productName}</h3>
                <span className="text-xs text-slate-500 font-medium">{current.category}</span>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${current.badgeColor}`}>
                {current.badge}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Maximum Retail Price</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-1">{current.mrp}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{current.mrpStatus}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Net Quantity</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-1">{current.netQty}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{current.netQtyStatus}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Numeral Cap-Height</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-1">{current.capHeight}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{current.capHeightStatus}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Unit Sale Price (USP)</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-1">{current.usp}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{current.uspStatus}</div>
              </div>

            </div>

            {/* Diagnostic Alert Box */}
            <div className={`p-4 rounded-xl border flex items-start gap-3.5 text-xs sm:text-sm leading-relaxed ${
              activeScenario === 'compliant'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                : activeScenario === 'violation'
                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300'
                : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300'
            }`}>
              {activeScenario === 'compliant' && <CheckCircle2 size={20} className="shrink-0 mt-0.5 text-emerald-600" />}
              {activeScenario === 'violation' && <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-600" />}
              {activeScenario === 'invalid' && <AlertOctagon size={20} className="shrink-0 mt-0.5 text-rose-600" />}
              <div>
                <p className="font-bold">{current.verdictText}</p>
                <p className="text-xs opacity-90 mt-1">{current.actionText}</p>
              </div>
            </div>

          </div>

          {/* Action Footer */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-700 px-5 py-3.5 flex items-center justify-between text-xs">
            <span className="text-slate-500">Ready to audit actual field evidence?</span>
            <Link href="/upload" className="font-bold text-[#0B1F3A] dark:text-blue-400 hover:underline flex items-center gap-1">
              Launch Inspection Studio <ChevronRight size={14} />
            </Link>
          </div>

        </div>
      </section>

      {/* 3 Core Legal Metrology Pillars */}
      <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto w-full border-t border-slate-200 dark:border-slate-800">
        <div className="mb-8">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Statutory Architecture</span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white mt-1">
            Engineered for Legal Defense &amp; Enforcement
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 flex items-center justify-center mb-4">
              <Scale size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Physical Metrology</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 flex-1">
              Recovers real-world scale from calibrated reference cards (`ML-REF-2026-0842`) to calculate Principal Display Panel area and measure numeral cap-height in millimetres per Rule 7(2) Tables I &amp; II.
            </p>
            <div className="text-[11px] font-mono font-semibold text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
              ISO/IEC 17025 &amp; ILAC G8 Guard-Banding
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Cpu size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Statutory Arithmetic</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 flex-1">
              Recomputes Unit Sale Price across grams, kg, ml, and litre slabs, enforces Fourth Schedule Item 11 dual edible-oil declarations, and accounts for Rule 26 exemptions for packs &le;10g / 10ml.
            </p>
            <div className="text-[11px] font-mono font-semibold text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
              Deterministic Formula Validation
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 flex items-center justify-center mb-4">
              <FileText size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Jan Vishwas Enforcement</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 flex-1">
              Issues Improvement Notices for 1st-time specified defects (rectification window), enforces Section 48(4) 3-year repeat offender bars, and hashes evidence chains for Section 50 appeals.
            </p>
            <div className="text-[11px] font-mono font-semibold text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
              Court-Admissible Dossier Generation
            </div>
          </div>

        </div>
      </section>

      {/* Production Government Footer */}
      <footer className="mt-auto bg-[#071324] text-slate-400 text-xs border-t border-blue-950 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
              alt="State Emblem of India" 
              className="h-8 w-auto object-contain brightness-0 invert opacity-80"
            />
            <div>
              <div className="font-semibold text-slate-200">Department of Consumer Affairs</div>
              <div className="text-[11px] text-slate-500">Ministry of Consumer Affairs, Food &amp; Public Distribution • Government of India</div>
            </div>
          </div>
          <div className="text-center sm:text-right text-[11px] text-slate-500">
            Smart India Hackathon 2026 Prototype (SIH26034) • Enforcing Legal Metrology (Packaged Commodities) Rules, 2011
          </div>
        </div>
      </footer>

    </div>
  );
}
