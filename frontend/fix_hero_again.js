const fs = require('fs');
let code = fs.readFileSync('app/results/[id]/page.jsx', 'utf8');

const heroStart = code.indexOf('{/* HERO SECTION */}');
const actionStart = code.indexOf('{/* Action Buttons */}');

if (heroStart !== -1 && actionStart !== -1) {
    const newHero = `{/* HERO SECTION */}
          <div className="glass rounded-[20px] md:rounded-[24px] p-4 md:p-8 mb-6 md:mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
            
            {/* Top row: Badge and ID */}
            <div className="flex flex-wrap items-center gap-2 mb-3 relative z-10">
              <span className={\`text-[10px] font-mono tracking-[0.1em] uppercase px-3 py-1 rounded-full \${badgeClass}\`}>
                {report.overallStatus || report.overall_compliance}
              </span>
              <span className="text-[10px] font-mono text-text-muted tracking-wider truncate max-w-[150px] md:max-w-xs">
                ID: {report.id}
              </span>
            </div>
            
            {/* Main Content: Name/Brand (Left) & Score (Right) */}
            <div className="flex flex-row justify-between items-center gap-4 relative z-10">
              <div className="flex-1 min-w-0">
                <h1 className="text-[20px] md:text-[40px] font-bold tracking-tight mb-1 text-text-primary leading-tight line-clamp-3">
                  {report.product?.product_name || fields.product_name || 'Unknown Product'}
                </h1>
                <p className="text-text-secondary text-[13px] md:text-[16px] truncate">
                  {report.product?.brand_name || fields.brand_name || 'Brand Unspecified'}
                </p>
              </div>
              
              <div className="flex flex-col items-center justify-center shrink-0 bg-background/50 border border-border/50 rounded-xl p-3 shadow-sm min-w-[80px] md:min-w-[120px]">
                <div className="text-[8px] md:text-[10px] text-text-muted font-bold tracking-[0.1em] uppercase mb-1">Score</div>
                <div className={\`text-[32px] md:text-[56px] font-black tracking-tighter leading-none \${scoreColor}\`}>
                  {report.compliance_score || report.complianceScore}%
                </div>
              </div>
            </div>
            
            `;

    code = code.substring(0, heroStart) + newHero + code.substring(actionStart);
    fs.writeFileSync('app/results/[id]/page.jsx', code);
    console.log("HERO REBUILT SUCCESSFULLY");
} else {
    console.log("COULD NOT FIND MARKERS");
}
