const fs = require('fs');
let code = fs.readFileSync('frontend/app/layout.jsx', 'utf8');

code = code.replace(
  "import BottomNav from '../components/BottomNav'", 
  "import BottomNav from '../components/BottomNav'\nimport SplashScreen from '../components/SplashScreen'"
);

code = code.replace(
  /<body className=\{([^>]+)>\s*/g,
  '<body className={$1}>\n        <SplashScreen />\n'
);

fs.writeFileSync('frontend/app/layout.jsx', code);
console.log("SPLASH INJECTED");
