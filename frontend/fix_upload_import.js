const fs = require('fs');
let code = fs.readFileSync('app/upload/page.jsx', 'utf8');

if (!code.includes('import PremiumLoader')) {
  code = code.replace("import NavBar from '@/components/NavBar';", "import NavBar from '@/components/NavBar';\nimport PremiumLoader from '@/components/PremiumLoader';");
  fs.writeFileSync('app/upload/page.jsx', code);
  console.log("IMPORT INJECTED");
}
