const fs = require('fs');

// 1. Update PremiumLoader
let loaderCode = fs.readFileSync('components/PremiumLoader.jsx', 'utf8');
loaderCode = loaderCode.replace('export default function PremiumLoader() {', 'export default function PremiumLoader({ inline = false }) {');

loaderCode = loaderCode.replace(
  '<div className="fixed inset-0 z-[99999] bg-white dark:bg-[#090a0f] flex flex-col items-center justify-center animate-in fade-in duration-300">',
  '<div className={inline ? "flex flex-col items-center justify-center w-full" : "fixed inset-0 z-[99999] bg-white dark:bg-[#090a0f] flex flex-col items-center justify-center animate-in fade-in duration-300"}>'
);

loaderCode = loaderCode.replace(
  '      <div className="h-8 relative w-full flex justify-center">',
  '      {!inline && (<div className="h-8 relative w-full flex justify-center">'
);

loaderCode = loaderCode.replace(
  '      </div>\n    </div>',
  '      </div>)}\n    </div>'
);

loaderCode = loaderCode.replace(
  '<div className="flex items-end justify-center gap-12 mb-16 h-[120px]">',
  '<div className={`flex items-end justify-center gap-12 h-[120px] ${inline ? "mb-6 scale-75 md:scale-100" : "mb-16"}`}>'
);

fs.writeFileSync('components/PremiumLoader.jsx', loaderCode);

// 2. Update Batch Page
let batchCode = fs.readFileSync('app/batch/[id]/page.jsx', 'utf8');
if (!batchCode.includes('PremiumLoader')) {
  batchCode = batchCode.replace("import { NavBar } from '@/components/NavBar';", "import { NavBar } from '@/components/NavBar';\nimport PremiumLoader from '@/components/PremiumLoader';");
}

const oldIcon = `<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-6 relative">
                     <div className="absolute inset-0 rounded-full border border-accent/20 border-t-accent animate-spin" style={{ animationDuration: '3s' }}></div>
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  </div>`;

batchCode = batchCode.replace(oldIcon, '<PremiumLoader inline={true} />');
fs.writeFileSync('app/batch/[id]/page.jsx', batchCode);

console.log("INLINE LOADER ADDED");
