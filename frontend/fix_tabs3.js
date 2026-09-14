const fs = require('fs');
let code = fs.readFileSync('app/results/[id]/page.jsx', 'utf8');

// The line is: <div className="flex space-x-1 border-b border-border mb-8">
code = code.replace('<div className="flex space-x-1 border-b border-border mb-8">', '<div className="grid grid-cols-4 border-b border-border mb-8 w-full">');

// ALSO fix the tab buttons to have 0 horizontal padding so they fit nicely on mobile!
// Current: className={`px-6 py-3 text-[13px]...
// New: className={`px-1 py-3 text-[10px] md:text-[13px] md:px-6...
code = code.replace('className={`px-6 py-3 text-[13px] font-bold tracking-widest uppercase transition-all', 'className={`px-1 py-3 text-[10px] md:text-[13px] md:px-6 font-bold tracking-widest uppercase transition-all flex items-center justify-center text-center');

fs.writeFileSync('app/results/[id]/page.jsx', code);
console.log("TABS TRULY FIXED");
