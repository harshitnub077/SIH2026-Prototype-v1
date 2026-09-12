const fs = require('fs');
let code = fs.readFileSync('app/dashboard/page.jsx', 'utf8');

code = code.replace('<div className="lg:col-span-3 bg-white dark:bg-[#11131a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 lg:p-8">', '<div className="lg:col-span-3 bg-white dark:bg-[#11131a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-4 md:p-6 lg:p-8 min-w-0 overflow-hidden">');

fs.writeFileSync('app/dashboard/page.jsx', code);
console.log("FIXED DASHBOARD CHART");
