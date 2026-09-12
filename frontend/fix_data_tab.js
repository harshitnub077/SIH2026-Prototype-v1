const fs = require('fs');
let code = fs.readFileSync('app/results/[id]/page.jsx', 'utf8');

const oldDataTabStr = `          {/* TAB 3: DATA EXTRACTED */}
        {activeTab === 'data' && (
            <div className="animate-fade-in">
               <h3 className="text-[16px] md:text-[18px] font-medium text-text-primary mb-4 md:mb-6">AI Structured Extraction</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(fields).filter(([k, v]) => !k.startsWith('_') && v).map(([k, v]) => (
                    <div key={k} className="glass rounded-[12px] md:rounded-[16px] p-4 md:p-5">
                      <div className="text-[10px] font-bold tracking-widest uppercase text-text-muted mb-2">
                        {k.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[14px] text-text-primary font-medium break-words leading-tight">
                        {String(v)}
                      </div>
                    </div>
                  ))}
               </div>
               <div className="mt-8 glass rounded-[16px] p-6">
                 <h3 className="text-[16px] font-medium text-text-primary mb-4">Raw OCR Extraction Log</h3>
                 <div className="bg-black/5 border border-border p-4 rounded-[12px] font-mono text-[12px] text-text-muted whitespace-pre-wrap max-h-64 overflow-y-auto">
                   {report.ocr_raw_text || report.ocrRawText || 'No raw text available.'}
                 </div>
               </div>
            </div>
        )}`;

const newDataTabStr = `          {/* TAB 3: DATA EXTRACTED */}
        {activeTab === 'data' && (
            <div className="animate-fade-in flex flex-col md:flex-row gap-8 items-start">
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
                 </div>
               </div>
               
               {/* Right Column: AI Raw Feed */}
               <div className="w-full md:w-1/2 sticky top-24">
                 <div className="glass rounded-[24px] p-6 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors"></div>
                   <div className="flex items-center gap-2 mb-4 relative z-10">
                     <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                     <h3 className="text-[11px] font-mono tracking-widest uppercase text-accent">Raw AI Feed</h3>
                   </div>
                   <div className="bg-black/90 dark:bg-black p-5 rounded-[16px] font-mono text-[11px] text-emerald-400 whitespace-pre-wrap max-h-[400px] overflow-y-auto border border-white/10 shadow-inner relative z-10 custom-scrollbar allow-select">
                     {report.ocr_raw_text || report.ocrRawText || '>> AWAITING TELEMETRY FEED...\\n>> NO RAW DATA RECEIVED.'}
                   </div>
                 </div>
               </div>
            </div>
        )}`;

if (code.includes('AI Structured Extraction')) {
  // Use regex to replace the entire old tab safely
  const regex = /\{\/\* TAB 3: DATA EXTRACTED \*\/\}.*?activeTab === 'data'.*?<\/div>\s*\}\)/s;
  code = code.replace(regex, newDataTabStr);
  fs.writeFileSync('app/results/[id]/page.jsx', code);
  console.log("DATA TAB UPGRADED");
} else {
  console.log("COULD NOT FIND DATA TAB");
}
