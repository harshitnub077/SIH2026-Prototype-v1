const fs = require('fs');
let code = fs.readFileSync('app/results/[id]/page.jsx', 'utf8');

// Unhide action buttons
code = code.replace('<div className="hidden md:flex flex-wrap gap-3 mt-8 pt-6 border-t border-border/50">', '<div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-border/50">');

// Find and delete the Mobile FABs block completely
const fabStart = code.indexOf('{/* Mobile FABs */}');
if (fabStart !== -1) {
  const fabEnd = code.indexOf('</div>', code.indexOf('<div className="md:hidden fixed bottom-24 right-4 z-40 flex flex-col gap-3">')) + 6;
  code = code.substring(0, fabStart) + code.substring(fabEnd);
}

fs.writeFileSync('app/results/[id]/page.jsx', code);
console.log("ACTION BUTTONS FIXED");
