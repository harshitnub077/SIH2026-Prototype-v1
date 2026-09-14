const fs = require('fs');
const path = 'app/results/[id]/page.jsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/v\.status\.toUpperCase\(\)/g, "String(v.status).toUpperCase()");

fs.writeFileSync(path, code);
console.log("MADE TOUPPERCASE SAFE");
