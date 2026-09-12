const fs = require('fs');
let code = fs.readFileSync('components/BottomNav.jsx', 'utf8');

// The BottomNav background is bg-[var(--color-surface)].
// Let's make it explicitly bg-white dark:bg-[#090a0f] and perfectly opaque
code = code.replace('bg-[var(--color-surface)]', 'bg-white dark:bg-[#090a0f]');
fs.writeFileSync('components/BottomNav.jsx', code);
console.log("BOTTOMNAV FIXED");
