const fs = require('fs');
let code = fs.readFileSync('frontend/app/page.jsx', 'utf8');
code = code.replace('// Force Vercel to never cache this page\nexport const dynamic = \'force-dynamic\';\nexport const revalidate = 0;\n', '');
fs.writeFileSync('frontend/app/page.jsx', code);
console.log("REVERTED CACHE BUSTER");
