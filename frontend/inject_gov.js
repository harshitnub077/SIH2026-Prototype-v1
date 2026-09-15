const fs = require('fs');
let code = fs.readFileSync('app/page.jsx', 'utf8');

const target = `<motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm mb-6 w-max mx-auto md:mx-0"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>`;
const newText = `
          {/* Government / Ministry Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center md:items-start gap-1 mb-8">
            <div className="flex items-center gap-3 border-b-2 border-[#Eab308] pb-2">
              <span className="text-[14px] md:text-[15px] font-bold tracking-wide" style={{ color: 'var(--color-text-primary)' }}>भारत सरकार</span>
              <span className="w-1 h-1 rounded-full bg-text-muted" style={{ background: 'var(--color-text-muted)' }}></span>
              <span className="text-[14px] md:text-[15px] font-bold tracking-wider" style={{ color: 'var(--color-text-primary)' }}>GOVERNMENT OF INDIA</span>
            </div>
            <p className="text-[12px] md:text-[13px] tracking-widest uppercase font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Ministry of Consumer Affairs, Food & Public Distribution
            </p>
          </motion.div>

          <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm mb-6 w-max mx-auto md:mx-0"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>`;

if (code.includes(target)) {
  code = code.replace(target, newText);
  fs.writeFileSync('app/page.jsx', code);
  console.log("INJECTED GOV HERO BADGE SUCCESSFULLY");
} else {
  console.log("TARGET NOT FOUND");
}
