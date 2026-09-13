const fs = require('fs');
let code = fs.readFileSync('app/layout.jsx', 'utf8');

const target = '<BottomNav />';
const replacement = '<BottomNav />\n          <div className="md:hidden fixed bottom-0 left-0 w-full h-[env(safe-area-inset-bottom)] bg-white dark:bg-[#090a0f] z-[99999] pointer-events-none"></div>';

if (!code.includes('fixed bottom-0 left-0 w-full h-[env(safe-area-inset-bottom)]')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('app/layout.jsx', code);
    console.log("LAYOUT BOTTOM FIXED");
}
