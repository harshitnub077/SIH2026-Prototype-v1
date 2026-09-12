const fs = require('fs');
let code = fs.readFileSync('components/BottomNav.jsx', 'utf8');
code = code.replace(/<\/Link>\s*}\)/, "</Link>");
fs.writeFileSync('components/BottomNav.jsx', code);
