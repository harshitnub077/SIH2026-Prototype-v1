const fs = require('fs');
let code = fs.readFileSync('app/page.jsx', 'utf8');

const target = `<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm mb-6 w-max mx-auto md:mx-0">`;
const newText = `
          {/* Government / Ministry Badge */}
          <div className="flex flex-col items-center md:items-start gap-1 mb-8 animate-fade-in-up">
            <div className="flex items-center gap-3 border-b-2 border-[#Eab308] pb-2">
              <span className="text-[14px] md:text-[15px] font-bold text-text-primary tracking-wide">भारत सरकार</span>
              <span className="w-1 h-1 rounded-full bg-text-muted"></span>
              <span className="text-[14px] md:text-[15px] font-bold text-text-primary tracking-wider">GOVERNMENT OF INDIA</span>
            </div>
            <p className="text-[12px] md:text-[13px] text-text-secondary tracking-widest uppercase font-medium">
              Ministry of Consumer Affairs, Food & Public Distribution
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm mb-6 w-max mx-auto md:mx-0">`;

if (code.includes(target)) {
  code = code.replace(target, newText);
  fs.writeFileSync('app/page.jsx', code);
  console.log("INJECTED GOV HERO BADGE");
} else {
  console.log("TARGET NOT FOUND");
}
