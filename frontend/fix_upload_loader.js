const fs = require('fs');

let code = fs.readFileSync('app/upload/page.jsx', 'utf8');

code = code.replace("import PremiumLoader from '@/components/PremiumLoader';", "import DynamicLoader from '@/components/DynamicLoader';");
code = code.replace("<PremiumLoader />", '<div className="fixed inset-0 z-[99999] bg-background flex items-center justify-center"><DynamicLoader /></div>');

fs.writeFileSync('app/upload/page.jsx', code);
console.log("UPGRADED UPLOAD PAGE");
