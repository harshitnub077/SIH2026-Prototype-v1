const fs = require('fs');
let code = fs.readFileSync('app/history/page.jsx', 'utf8');

// The block to replace is the entire `<div className="flex flex-col gap-4 md:mello-card md:gap-0 md:overflow-hidden md:p-0">` up to the end of its block.
const startStr = '<div className="flex flex-col gap-4 md:mello-card md:gap-0 md:overflow-hidden md:p-0">';
// Find where it ends
const endIdx = code.lastIndexOf('</div>\n        </div>\n      </div>\n    </div>');

const newGridCode = `
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {scans.length === 0 && <div className="col-span-full p-10 text-center text-text-muted">No scans found.</div>}
          {scans.map((s, i) => {
            const isPass = s.overall_compliance === 'PASS' || s.overall_compliance === 'pass' || s.overallStatus === 'compliant';
            const isProcessing = s.overall_compliance === 'processing' || s.status === 'processing';
            const badgeClass = isPass ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : (isProcessing ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20');
            const statusText = s.status === 'failed' ? 'FAILED' : (s.overall_compliance || s.status || 'UNKNOWN');
            
            return (
              <div 
                key={i} 
                className="group relative flex flex-col bg-surface/50 dark:bg-white/[0.02] border border-border rounded-[24px] p-6 hover:border-accent hover:shadow-lg transition-all cursor-pointer overflow-hidden" 
                onClick={() => router.push(\`/results/\${s.id}\`)}
              >
                {/* Decorative background glow based on status */}
                <div className={\`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-[50px] opacity-20 transition-opacity group-hover:opacity-40 \${isPass ? 'bg-emerald-500' : (isProcessing ? 'bg-blue-500' : 'bg-red-500')}\`}></div>
                
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="w-12 h-12 rounded-[16px] bg-background border border-border flex items-center justify-center shadow-sm">
                    {/* Fallback Icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-secondary"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  </div>
                  
                  <span className={\`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border shadow-sm \${badgeClass}\`}>
                    {statusText}
                  </span>
                </div>
                
                <div className="relative z-10 flex-grow">
                  <h3 className="text-[18px] font-bold tracking-tight text-text-primary mb-1 line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                    {s.product_name || s.product?.product_name || 'Unknown Product'}
                  </h3>
                  <p className="text-[13px] text-text-muted font-medium mb-6">
                    {s.brand_name || s.product?.brand_name || 'Scan ID: ' + s.id.substring(0,8)}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-border/50 relative z-10">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-text-secondary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    {new Date(s.createdAt || s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  
                  <button 
                    onClick={(e) => handleDelete(e, s.id)} 
                    className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-text-muted hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-colors" 
                    title="Delete Scan"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
`;
const startIndex = code.indexOf(startStr);
code = code.substring(0, startIndex) + newGridCode + code.substring(endIdx);
fs.writeFileSync('app/history/page.jsx', code);
console.log("HISTORY PAGE UPGRADED");
