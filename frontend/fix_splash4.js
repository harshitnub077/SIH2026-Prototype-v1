const fs = require('fs');
let code = fs.readFileSync('components/SplashScreen.jsx', 'utf8');
code = code.replace('bg-white dark:bg-[#090a0f]', 'bg-[#1E3A8A]');
fs.writeFileSync('components/SplashScreen.jsx', code);
