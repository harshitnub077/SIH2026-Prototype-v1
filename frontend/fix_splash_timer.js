const fs = require('fs');
const path = 'components/SplashScreen.jsx';
let code = fs.readFileSync(path, 'utf8');

// Change timer1 from 2000 to 1000
code = code.replace(/setTimeout\(\(\) => \{\s*setFade\(true\);\s*\}, 2000\);/g, `setTimeout(() => {\n      setFade(true);\n    }, 1000);`);

// Change timer2 from 2800 to 1500
code = code.replace(/setTimeout\(\(\) => \{\s*setShow\(false\);\s*sessionStorage.setItem\('splash_shown', 'true'\);\s*\}, 2800\);/g, `setTimeout(() => {\n      setShow(false);\n      sessionStorage.setItem('splash_shown', 'true');\n    }, 1500);`);

// Change transition duration from 700 to 500 for a snappier fade
code = code.replace(/duration-700/g, 'duration-500');

fs.writeFileSync(path, code);
console.log("SPLASH SCREEN TIMER FIXED");
