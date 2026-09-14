const fs = require('fs');

let code = fs.readFileSync('app/batch/[id]/page.jsx', 'utf8');

if (!code.includes('import DynamicLoader')) {
  code = code.replace("import NavBar from '@/components/NavBar';", "import NavBar from '@/components/NavBar';\nimport DynamicLoader from '@/components/DynamicLoader';");
  fs.writeFileSync('app/batch/[id]/page.jsx', code);
  console.log("ADDED IMPORT");
} else {
  console.log("IMPORT ALREADY EXISTS");
}
