const fs = require('fs');
let code = fs.readFileSync('app/login/page.jsx', 'utf8');

code = code.replace('mello-card p-10', 'mello-card p-6 sm:p-10');
code = code.replace('text-[32px]', 'text-[28px] md:text-[32px]');

fs.writeFileSync('app/login/page.jsx', code);
console.log("LOGIN FIXED");
