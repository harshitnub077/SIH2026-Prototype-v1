const fs = require('fs');
let code = fs.readFileSync('frontend/app/dashboard/page.jsx', 'utf8');

// Use a regex to strip out all 'dark:something' classes
code = code.replace(/\s*dark:[a-zA-Z0-9_/\-\[\]#%]+/g, '');

fs.writeFileSync('frontend/app/dashboard/page.jsx', code);
console.log("DARK MODE STRIPPED");
