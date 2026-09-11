"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// High-end 3D SVGs relevant to Food Packaging & Legal Metrology
const icons = [
  // 1. Packaging Telemetry (Scanning)
  <svg key="scan" width="70" height="70" viewBox="0 0 100 100" fill="none" className="drop-shadow-2xl">
    <defs>
      <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F59E0B"/><stop offset="100%" stopColor="#B45309"/></linearGradient>
      <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="transparent"/><stop offset="50%" stopColor="#FCD34D"/><stop offset="100%" stopColor="transparent"/></linearGradient>
    </defs>
    <rect x="25" y="15" width="50" height="70" rx="6" fill="url(#docGrad)" stroke="#FCD34D" strokeWidth="3" />
    <rect x="35" y="30" width="30" height="4" rx="2" fill="#FFF" opacity="0.6" />
    <rect x="35" y="45" width="20" height="4" rx="2" fill="#FFF" opacity="0.6" />
    <rect x="35" y="60" width="25" height="4" rx="2" fill="#FFF" opacity="0.6" />
    <rect x="15" y="48" width="70" height="4" fill="url(#laserGrad)" className="animate-pulse" />
  </svg>,

  // 2. OCR Scanner / Eye (Extraction)
  <svg key="scanner" width="70" height="70" viewBox="0 0 100 100" fill="none" className="drop-shadow-2xl">
    <defs>
      <linearGradient id="scanLine" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="transparent"/><stop offset="50%" stopColor="#3B82F6"/><stop offset="100%" stopColor="transparent"/></linearGradient>
      <linearGradient id="lens2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#60A5FA"/><stop offset="100%" stopColor="#1E3A8A"/></linearGradient>
    </defs>
    <rect x="15" y="20" width="70" height="60" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="2" />
    <rect x="25" y="30" width="50" height="6" fill="#334155" rx="3" />
    <rect x="25" y="45" width="40" height="6" fill="#334155" rx="3" />
    <rect x="25" y="60" width="30" height="6" fill="#334155" rx="3" />
    
    <circle cx="65" cy="65" r="25" fill="url(#lens2)" opacity="0.9" stroke="#94A3B8" strokeWidth="4" />
    <path d="M65 45a20 20 0 0 0-20 20 20 20 0 0 1 20-20z" fill="#FFF" opacity="0.6"/>
    <line x1="50" y1="65" x2="80" y2="65" stroke="#60A5FA" strokeWidth="2" />
    <line x1="65" y1="50" x2="65" y2="80" stroke="#60A5FA" strokeWidth="2" />
  </svg>,

  // 3. Legal Scales (Rules Engine)
  <svg key="scales" width="70" height="70" viewBox="0 0 100 100" fill="none" className="drop-shadow-2xl">
    <defs>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FDE047"/><stop offset="100%" stopColor="#A16207"/></linearGradient>
      <linearGradient id="silver" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F1F5F9"/><stop offset="100%" stopColor="#94A3B8"/></linearGradient>
    </defs>
    <path d="M50 10 L50 85" stroke="url(#gold)" strokeWidth="6" strokeLinecap="round" />
    <path d="M40 85 L60 85 L55 95 L45 95 Z" fill="url(#gold)" />
    <path d="M20 30 L80 30" stroke="url(#gold)" strokeWidth="6" strokeLinecap="round" />
    <circle cx="50" cy="30" r="6" fill="url(#silver)" />
    
    <path d="M20 30 L10 55 L30 55 Z" fill="none" stroke="url(#silver)" strokeWidth="2" />
    <path d="M10 55 C10 65 30 65 30 55 Z" fill="url(#gold)" opacity="0.9" />
    
    <path d="M80 30 L70 55 L90 55 Z" fill="none" stroke="url(#silver)" strokeWidth="2" />
    <path d="M70 55 C70 65 90 65 90 55 Z" fill="url(#gold)" opacity="0.9" />
  </svg>,

  // 4. Verified Shield (Compliance)
  <svg key="shield" width="70" height="70" viewBox="0 0 100 100" fill="none" className="drop-shadow-2xl">
    <defs>
      <linearGradient id="shieldBase2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#059669"/><stop offset="100%" stopColor="#064E3B"/></linearGradient>
      <linearGradient id="shieldFront2" x1="20%" y1="0%" x2="80%" y2="100%"><stop offset="0%" stopColor="#34D399"/><stop offset="100%" stopColor="#047857"/></linearGradient>
    </defs>
    <path d="M50 90s35-15 35-45V25L50 10L15 25v30c0 30 35 45 35 45z" fill="url(#shieldBase2)" transform="translate(4, 4)"/>
    <path d="M50 90s35-15 35-45V25L50 10L15 25v30c0 30 35 45 35 45z" fill="url(#shieldFront2)"/>
    <path d="M50 90c0 0-35-15-35-45V25L50 10v80z" fill="#FFF" opacity="0.2"/>
    <path d="M30 50 L45 65 L70 35" stroke="#FFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
];

const texts = [
  "Extracting Packaging Telemetry",
  "Running OCR Vision Models",
  "Auditing Legal Metrology Rules",
  "Finalizing Compliance Score"
];

export default function DynamicLoader() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % icons.length);
    }, 2500); // 2.5s per state
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      
      {/* 3D Flip Container */}
      <div 
        className="relative w-32 h-32 flex items-center justify-center mb-10" 
        style={{ perspective: 1200 }} // Gives the 3D depth illusion
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ rotateY: 90, opacity: 0, scale: 0.8 }}
            animate={{ rotateY: 0, opacity: 1, scale: 1 }}
            exit={{ rotateY: -90, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute flex items-center justify-center"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Soft glowing aura behind the icon */}
            <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full scale-150"></div>
            {icons[index]}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Text Carousel */}
      <div className="h-6 overflow-hidden relative w-full max-w-[280px]">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-[13px] font-bold tracking-widest uppercase text-text-secondary text-center absolute w-full"
          >
            {texts[index]}...
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="w-48 h-1 bg-border rounded-full mt-6 overflow-hidden relative">
        <motion.div 
          className="absolute top-0 left-0 h-full bg-accent"
          initial={{ width: '0%' }}
          animate={{ width: `${((index + 1) / icons.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

    </div>
  );
}
