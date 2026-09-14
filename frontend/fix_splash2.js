const fs = require('fs');
let code = fs.readFileSync('components/SplashScreen.jsx', 'utf8');
code = code.replace('opacity-0 animate-[fadeIn_1s_ease-in-out_0.2s_forwards]', 'animate-pulse');
fs.writeFileSync('components/SplashScreen.jsx', code);
