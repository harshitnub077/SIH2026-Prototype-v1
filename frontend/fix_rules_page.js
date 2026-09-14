const fs = require('fs');
let code = fs.readFileSync('app/rules/page.jsx', 'utf8');

// I am going to replace `mello-card-flat` with `glass border border-border/50 shadow-sm hover:scale-[1.02] transition-transform duration-300 rounded-[24px]`
// And I will replace `mello-badge-pass` with a cleaner badge.
code = code.replace(/mello-card-flat/g, "glass border border-border/50 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 rounded-[24px]");

// Change badge classes
code = code.replace(/mello-badge-pass/g, "px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold tracking-widest uppercase");
code = code.replace(/mello-badge-na/g, "px-3 py-1 bg-text-muted/10 text-text-muted border border-border rounded-full text-[10px] font-bold tracking-widest uppercase");

// Ensure the page container has `animate-fade-in`
if(code.includes('<div className="min-h-screen bg-background text-text-primary">')) {
  code = code.replace('<div className="min-h-screen bg-background text-text-primary">', '<div className="min-h-screen bg-background text-text-primary animate-fade-in">');
}

fs.writeFileSync('app/rules/page.jsx', code);
console.log("RULES PATCHED");
