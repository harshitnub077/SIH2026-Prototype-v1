const fs = require('fs');
let code = fs.readFileSync('app/layout.jsx', 'utf8');

code = code.replace('font-sans pb-24 md:pb-0', 'font-sans pb-24 md:pb-0 overflow-x-hidden w-full');

fs.writeFileSync('app/layout.jsx', code);
console.log("FIXED LAYOUT OVERFLOW");
