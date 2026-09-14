const fs = require('fs');
let code = fs.readFileSync('app/results/[id]/page.jsx', 'utf8');

const oldFlex = '<div className="flex border-b border-border/50 mb-8 overflow-x-auto hide-scrollbar scroll-smooth">';
const newFlex = '<div className="grid grid-cols-4 border-b border-border/50 mb-8 w-full">';
code = code.replace(oldFlex, newFlex);

const oldBtn = 'className={`px-4 md:px-6 py-3 text-[12px] md:text-[13px] font-bold tracking-widest uppercase shrink-0 whitespace-nowrap transition-all ${activeTab === tab ? \'text-accent border-b-2 border-accent bg-accent/5\' : \'text-text-muted hover:text-text-primary\'}`}';
const newBtn = 'className={`flex justify-center items-center py-3 text-[10px] sm:text-[12px] md:text-[13px] font-bold tracking-widest uppercase text-center transition-all ${activeTab === tab ? \'text-accent border-b-2 border-accent bg-accent/5\' : \'text-text-muted hover:text-text-primary\'}`}';
code = code.replace(oldBtn, newBtn);

fs.writeFileSync('app/results/[id]/page.jsx', code);
console.log("TABS FIXED GRID");
