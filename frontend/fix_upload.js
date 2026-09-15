const fs = require('fs');
let code = fs.readFileSync('app/upload/page.jsx', 'utf8');

// The line: <div className="grid grid-cols-1 md:grid-cols-5 gap-0 md:gap-6 flex-1 md:flex-none h-[calc(100vh-140px)] md:h-auto">
// On mobile it should be h-auto, not fixed height. 
code = code.replace('h-[calc(100vh-140px)] md:h-auto', 'min-h-[calc(100vh-140px)] h-auto md:h-auto');

// Also, the system output has a fixed height: h-[480px]
// Let's make it h-[320px] md:h-[480px] to save screen space on mobile
code = code.replace('h-[480px]', 'h-[320px] md:h-[480px]');

// Button takes too much space? h-[56px] is fine for touch targets.

fs.writeFileSync('app/upload/page.jsx', code);
console.log("UPLOAD FIXED");
