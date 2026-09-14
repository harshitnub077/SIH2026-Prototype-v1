const fs = require('fs');
let code = fs.readFileSync('app/results/[id]/page.jsx', 'utf8');

const startStr = "{/* TAB 3: DATA EXTRACTED */}";
const endStr = "        )}";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr, startIndex) + endStr.length;

if (startIndex !== -1 && endIndex !== -1) {
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
  code = code.substring(0, startIndex) + proDataTab + code.substring(endIndex);
  fs.writeFileSync('app/results/[id]/page.jsx', code);
  console.log("RESULTS FIXED MANUALLY");
}
