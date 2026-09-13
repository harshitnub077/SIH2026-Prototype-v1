const fs = require('fs');
let code = fs.readFileSync('app/results/[id]/page.jsx', 'utf8');

const oldHero = `<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[12px] font-mono text-text-muted tracking-wider">ID: {report.id}</span>
                <span className={\`text-[10px] font-mono tracking-[0.2em] uppercase px-3 py-1 rounded-full \${badgeClass}\`}>
                  {report.overallStatus || report.overall_compliance}
                </span>
              </div>
              <h1 className="text-[24px] md:text-[40px] font-medium tracking-tight mb-1 text-text-primary">
                {report.product?.product_name || fields.product_name || 'Unknown Product'}
              </h1>
              <p className="text-text-secondary text-[16px]">
                {report.product?.brand_name || fields.brand_name || 'Brand Unspecified'}
              </p>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="text-[10px] text-text-muted font-mono tracking-[0.2em] uppercase mb-1">AI Compliance Score</div>
              <div className={\`text-[40px] md:text-[56px] font-medium tracking-tighter leading-none \${scoreColor} drop-shadow-sm\`}>
                {report.compliance_score || report.complianceScore}%
              </div>
            </div>
          </div>`;

const newHero = `<div className="flex flex-col gap-5 relative z-10 w-full">
            <div className="flex justify-between items-start w-full">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={\`text-[9px] sm:text-[10px] font-mono tracking-[0.15em] sm:tracking-[0.2em] uppercase px-2 sm:px-3 py-1 rounded-full \${badgeClass}\`}>
                    {report.overallStatus || report.overall_compliance}
                  </span>
                  <span className="text-[10px] sm:text-[12px] font-mono text-text-muted tracking-wider truncate max-w-[120px] sm:max-w-none">ID: {report.id.split('-')[0]}</span>
                </div>
                <h1 className="text-[22px] sm:text-[26px] md:text-[40px] font-semibold tracking-tight leading-[1.1] text-text-primary pr-2">
                  {report.product?.product_name || fields.product_name || 'Unknown Product'}
                </h1>
                <p className="text-text-secondary text-[14px] sm:text-[16px]">
                  {report.product?.brand_name || fields.brand_name || 'Brand Unspecified'}
                </p>
              </div>
              
              <div className="flex flex-col items-end bg-surface/50 rounded-2xl p-3 sm:p-4 border border-border shadow-sm shrink-0">
                <div className="text-[8px] sm:text-[10px] text-text-muted font-mono tracking-[0.1em] sm:tracking-[0.2em] uppercase mb-1 text-right">Score</div>
                <div className={\`text-[28px] sm:text-[36px] md:text-[48px] font-bold tracking-tighter leading-none \${scoreColor}\`}>
                  {report.compliance_score || report.complianceScore}%
                </div>
              </div>
            </div>
          </div>`;

code = code.replace(oldHero, newHero);
fs.writeFileSync('app/results/[id]/page.jsx', code);
console.log("HERO FIXED");
