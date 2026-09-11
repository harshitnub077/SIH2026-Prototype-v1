const fs = require('fs');
let code = fs.readFileSync('app/results/[id]/page.jsx', 'utf8');

// I am checking out the perfectly working version before I broke it.
// It has the Hacker Terminal code. Let's find it.
const hackerStr = `{/* TAB 3: DATA EXTRACTED */}
        {activeTab === 'data' && (
            <div className="animate-fade-in flex flex-col md:flex-row gap-8 items-start w-full">
               {/* Left Column: The Interactive Dictionary */}
               <div className="w-full md:w-1/2 flex flex-col gap-3">
                 <h3 className="text-[14px] font-bold tracking-widest uppercase text-text-muted mb-2">Structured Telemetry</h3>
                 <div className="flex flex-col border border-border/50 rounded-2xl overflow-hidden shadow-sm bg-surface/30">
                    {Object.entries(fields).filter(([k, v]) => !k.startsWith('_') && v).map(([k, v], i) => (
                      <div 
                        key={k} 
                        className="flex flex-col sm:flex-row sm:items-start justify-between p-4 border-b border-border/50 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors animate-in fade-in slide-in-from-left-4" 
                        style={{ animationFillMode: 'both', animationDelay: \`\${i * 50}ms\` }}
                      >
                        <div className="text-[11px] font-mono tracking-widest uppercase text-text-muted sm:w-1/3 pt-1">
                          {k.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[14px] text-text-primary font-medium break-words sm:w-2/3 leading-relaxed mt-1 sm:mt-0">
                          {String(v)}
                        </div>
                      </div>
                    ))}
                    {Object.entries(fields).filter(([k, v]) => !k.startsWith('_') && v).length === 0 && (
                      <div className="p-6 text-sm text-text-muted text-center">No structured data extracted.</div>
                    )}
                 </div>
               </div>
               
               {/* Right Column: AI Raw Feed */}
               <div className="w-full md:w-1/2 md:sticky md:top-24 mt-8 md:mt-0">
                 <div className="glass rounded-[24px] p-6 relative overflow-hidden group border border-border/50 bg-black">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors"></div>
                   <div className="flex items-center gap-3 mb-4 relative z-10">
                     <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.9)]"></div>
                     <h3 className="text-[12px] font-mono tracking-widest uppercase text-accent">Raw AI Feed</h3>
                   </div>
                   <div className="bg-[#050505] p-5 rounded-[16px] font-mono text-[12px] md:text-[13px] text-emerald-400 whitespace-pre-wrap h-[300px] md:h-[400px] overflow-y-auto border border-white/10 shadow-inner relative z-10 custom-scrollbar allow-select leading-relaxed">
                     {report.ocr_raw_text || report.ocrRawText || '>> AWAITING TELEMETRY FEED...\\n>> NO RAW DATA RECEIVED.'}
                   </div>
                 </div>
               </div>
            </div>
        )}`;

const proDataTab = `{/* TAB 3: DATA EXTRACTED */}
        {activeTab === 'data' && (
            <div className="animate-fade-in flex flex-col md:flex-row gap-6 items-start w-full">
               {/* Left Column: Professional Structured Data */}
               <div className="w-full md:w-7/12 flex flex-col gap-4">
                 <h3 className="text-[13px] font-bold tracking-widest uppercase text-text-muted px-1">Structured Telemetry</h3>
                 <div className="glass rounded-[24px] overflow-hidden border border-border/50 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border/40">
                    {Object.entries(fields).filter(([k, v]) => !k.startsWith('_') && v).map(([k, v], i) => (
                      <div key={k} className="bg-background/80 backdrop-blur-md p-5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <div className="text-[11px] font-bold tracking-widest uppercase text-text-muted mb-1.5">
                          {k.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[14px] text-text-primary font-medium break-words leading-relaxed">
                          {String(v)}
                        </div>
                      </div>
                    ))}
                    </div>
                    {Object.entries(fields).filter(([k, v]) => !k.startsWith('_') && v).length === 0 && (
                      <div className="p-8 text-sm text-text-muted text-center bg-background/50">No structured data extracted.</div>
                    )}
                 </div>
               </div>
               
               {/* Right Column: Clean Raw Logs */}
               <div className="w-full md:w-5/12 flex flex-col gap-4 md:sticky md:top-24 mt-8 md:mt-0">
                 <h3 className="text-[13px] font-bold tracking-widest uppercase text-text-muted px-1">Raw OCR Output</h3>
                 <div className="glass rounded-[24px] overflow-hidden border border-border/50 shadow-sm bg-black/5 dark:bg-white/5 relative">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-[40px] pointer-events-none"></div>
                   <div className="p-5 font-mono text-[12px] md:text-[13px] text-text-secondary whitespace-pre-wrap h-[300px] md:h-[400px] overflow-y-auto custom-scrollbar allow-select leading-relaxed relative z-10">
                     {report.ocr_raw_text || report.ocrRawText || 'No raw data available.'}
                   </div>
                 </div>
               </div>
            </div>
        )}`;

if (code.includes(hackerStr)) {
  code = code.replace(hackerStr, proDataTab);
  fs.writeFileSync('app/results/[id]/page.jsx', code);
  console.log("SUCCESSFULLY REPLACED HACKER TERMINAL WITH PRO UI");
} else {
  console.log("COULD NOT FIND HACKER TERMINAL STRING");
}
