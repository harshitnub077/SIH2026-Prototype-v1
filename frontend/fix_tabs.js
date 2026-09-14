const fs = require('fs');
let code = fs.readFileSync('app/results/[id]/page.jsx', 'utf8');

const targetStr = `className=\`px-6 py-3 text-[13px] font-bold tracking-widest uppercase transition-all \${activeTab === tab ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-text-muted hover:text-text-primary'}\``;
const newStr = `className=\`px-4 md:px-6 py-3 text-[12px] md:text-[13px] font-bold tracking-widest uppercase shrink-0 whitespace-nowrap transition-all \${activeTab === tab ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-text-muted hover:text-text-primary'}\``;

code = code.replace(targetStr, newStr);

const targetTabsFlex = '<div className="flex border-b border-border/50 mb-8">';
const newTabsFlex = '<div className="flex border-b border-border/50 mb-8 overflow-x-auto hide-scrollbar scroll-smooth">';

code = code.replace(targetTabsFlex, newTabsFlex);
// it might already have some of these classes
code = code.replace(/<div className="flex border-b border-border\/50 mb-8[^>]*">/, newTabsFlex);

fs.writeFileSync('app/results/[id]/page.jsx', code);
console.log("FIXED TABS");
