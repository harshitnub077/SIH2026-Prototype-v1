const fs = require('fs');
let code = fs.readFileSync('app/manifest.js', 'utf8');
code = code.replace("src: '/emblem-transparent.png',", "src: '/icon-with-text.png',");
fs.writeFileSync('app/manifest.js', code);
console.log("MANIFEST ICON FIXED");
