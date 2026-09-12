"use client";
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function PipelineDiagram() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 40%"]
  });

  const nodes = [
    { id: 1, label: "Image Upload", tooltip: "High-res raw image ingestion" },
    { id: 2, label: "OCR Extraction", tooltip: "Tesseract OCR + Gemini Vision fallback" },
    { id: 3, label: "Rule Validation", tooltip: "Deterministic rules engine" },
    { id: 4, label: "Compliance Report", tooltip: "PDF generation & citations" },
    { id: 5, label: "Dashboard", tooltip: "Enforcement officer repository" }
  ];

  // We map the path length to scrollYProgress
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={containerRef} className="relative w-full max-w-[1000px] mx-auto py-20 px-4 md:px-0">
      
      {/* Desktop SVG Line */}
      <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] -translate-y-1/2 z-0">
        <svg width="100%" height="2" preserveAspectRatio="none">
          <line x1="0" y1="1" x2="100%" y2="1" stroke="var(--color-border)" strokeWidth="2" />
          <motion.line 
            x1="0" y1="1" x2="100%" y2="1" 
            stroke="var(--accent, #fb923c)" 
            strokeWidth="2"
            style={{ pathLength }}
          />
        </svg>
      </div>

      {/* Mobile SVG Line */}
      <div className="block md:hidden absolute left-8 top-0 w-[2px] h-full z-0">
        <svg width="2" height="100%" preserveAspectRatio="none">
          <line x1="1" y1="0" x2="1" y2="100%" stroke="var(--color-border)" strokeWidth="2" />
          <motion.line 
            x1="1" y1="0" x2="1" y2="100%" 
            stroke="var(--accent, #fb923c)" 
            strokeWidth="2"
            style={{ pathLength }}
          />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-12 md:gap-4">
        {nodes.map((node, index) => {
          // Calculate when this node should appear based on scroll (approximate)
          const nodeAppearPoint = index / (nodes.length - 1);
          const opacity = useTransform(
            scrollYProgress, 
            [Math.max(0, nodeAppearPoint - 0.1), nodeAppearPoint], 
            [0, 1]
          );
          const y = useTransform(
            scrollYProgress, 
            [Math.max(0, nodeAppearPoint - 0.1), nodeAppearPoint], 
            [16, 0]
          );

          return (
            <motion.div 
              key={node.id}
              style={{ opacity, y }}
              className="flex items-center md:flex-col md:justify-center gap-4 md:gap-3 group cursor-help pl-6 md:pl-0"
            >
              <div className="w-4 h-4 rounded-full bg-background border-2 border-border group-hover:border-accent transition-colors relative z-10 shadow-lg">
                <div className="absolute inset-0 bg-accent rounded-full opacity-0 group-hover:opacity-100 scale-50 transition-all"></div>
              </div>
              <div className="mello-card-flat bg-surface  px-4 py-3 min-w-[140px] text-center border-border relative">
                <span className="text-[13px] font-medium text-text-primary block">{node.label}</span>
                
                {/* Tooltip */}
                <div className="absolute top-full md:top-auto md:bottom-full left-1/2 -translate-x-1/2 mt-2 md:mt-0 md:mb-2 w-[180px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-background border border-border p-2 rounded-lg text-[11px] text-text-secondary shadow-sm z-50">
                  {node.tooltip}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
