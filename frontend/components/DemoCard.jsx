"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DemoCard({ steps, autoPlay = true, loop = true, showCursor = false }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTapping, setIsTapping] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setCurrentStep(steps.length - 1);
      return;
    }

    if (!autoPlay || steps.length === 0) return;
    
    let timeoutId;
    let tapTimeoutId;

    const playNext = () => {
      const step = steps[currentStep];
      const duration = step.durationMs || 2500;
      
      // Trigger tap animation 300ms before state change if cursor is enabled
      if (showCursor && currentStep === 0) {
        tapTimeoutId = setTimeout(() => setIsTapping(true), duration - 300);
      }
      
      timeoutId = setTimeout(() => {
        setIsTapping(false);
        if (currentStep < steps.length - 1) {
          setCurrentStep(c => c + 1);
        } else if (loop) {
          setCurrentStep(0);
        }
      }, duration);
    };
    
    playNext();
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(tapTimeoutId);
    };
  }, [currentStep, autoPlay, steps, loop, showCursor]);

  const handleTap = () => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setCurrentStep(steps.length - 1);
      return;
    }

    if (autoPlay) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep(c => c + 1);
    } else if (loop) {
      setCurrentStep(0);
    }
  };

  const step = steps[currentStep];

  return (
    <div 
      className={`mello-card-flat  flex flex-col overflow-hidden w-full h-[320px] relative ${!autoPlay ? 'cursor-pointer hover:border-mist transition-colors group' : ''}`}
      onClick={handleTap}
    >
      <div className="flex justify-between items-center px-4 py-3 border-b border-border bg-surface/50 z-10">
        <span className="text-[12px] font-medium text-text-secondary uppercase tracking-widest">{step.label}</span>
        {!autoPlay && (
          <span className="text-[11px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">Tap to advance &rarr;</span>
        )}
      </div>
      
      <div className="relative flex-1 bg-background overflow-hidden p-6 flex flex-col justify-center items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
            className="w-full flex justify-center"
          >
            {step.content}
          </motion.div>
        </AnimatePresence>

        {showCursor && currentStep === 0 && (
          <motion.div 
            className="absolute z-50 w-6 h-6 rounded-full bg-surface  border border-border shadow-lg pointer-events-none"
            initial={{ opacity: 0, x: 20, y: 30 }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              y: 0,
              scale: isTapping ? 0.7 : 1,
              backgroundColor: isTapping ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)'
            }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{ right: '40%', bottom: '30%' }}
          />
        )}
      </div>
      
      {/* Progress Indicator */}
      <div className="h-1 w-full bg-surface flex z-10">
         {steps.map((_, i) => (
           <div 
             key={i} 
             className={`flex-1 h-full transition-colors duration-500 ${i <= currentStep ? 'bg-mist' : 'bg-transparent'}`} 
           />
         ))}
      </div>
    </div>
  );
}
