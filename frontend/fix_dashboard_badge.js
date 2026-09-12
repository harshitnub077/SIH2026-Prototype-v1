const fs = require('fs');
const path = 'app/dashboard/page.jsx';
let code = fs.readFileSync(path, 'utf8');

const oldFunc = `const getBadgeClass = (s) => {
    if (s === 'PASS') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
    if (s === 'MANUAL REVIEW') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
    if (s === 'POTENTIAL NON-COMPLIANCE') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  };`;

const newFunc = `const getBadgeClass = (s) => {
    const v = String(s).toUpperCase();
    if (v === 'PASS' || v === 'COMPLIANT') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
    if (v === 'MANUAL REVIEW' || v === 'NEEDS_REVIEW') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
    if (v === 'POTENTIAL NON-COMPLIANCE' || v === 'NON_COMPLIANT' || v === 'FAILED' || v === 'FAIL') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  };`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync(path, code);
console.log("FIXED DASHBOARD BADGE");
