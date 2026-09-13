const fs = require('fs');
let code = fs.readFileSync('app/manifest.js', 'utf8');
code = code.replace("display: 'standalone',", "display: 'fullscreen',");
fs.writeFileSync('app/manifest.js', code);
console.log("MANIFEST FIXED");
