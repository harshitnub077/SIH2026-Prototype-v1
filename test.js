const code = require('fs').readFileSync('frontend/app/results/[id]/page.jsx', 'utf8');
const idx = code.indexOf("activeTab === 'data'");
console.log(code.substring(idx, idx + 1000));
