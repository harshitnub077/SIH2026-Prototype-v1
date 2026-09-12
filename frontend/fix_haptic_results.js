const fs = require('fs');
let code = fs.readFileSync('app/results/[id]/page.jsx', 'utf8');

code = code.replace(
  'setReport(json.data);',
  'setReport(json.data);\n        if (typeof window !== "undefined" && navigator.vibrate) { navigator.vibrate([30, 50, 30]); }'
);

fs.writeFileSync('app/results/[id]/page.jsx', code);
console.log("ADDED MISSING HAPTIC");
