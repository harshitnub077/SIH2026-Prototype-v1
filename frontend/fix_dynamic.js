const fs = require('fs');

let code = fs.readFileSync('app/batch/[id]/page.jsx', 'utf8');

// Ensure DynamicLoader is imported instead of PremiumLoader
if (code.includes('import PremiumLoader')) {
  code = code.replace("import PremiumLoader from '@/components/PremiumLoader';", "import DynamicLoader from '@/components/DynamicLoader';");
} else {
  code = code.replace("import { NavBar } from '@/components/NavBar';", "import { NavBar } from '@/components/NavBar';\nimport DynamicLoader from '@/components/DynamicLoader';");
}

const startString = `<div className="flex flex-col items-center justify-center min-h-[70vh] px-4 w-full max-w-5xl mx-auto">`;
const endString = `          ) : batch?.status === 'failed' ? (`;

const startIndex = code.indexOf(startString);
const endIndex = code.indexOf(endString);

if (startIndex !== -1 && endIndex !== -1) {
  const newLoadingBlock = `<div className="flex flex-col items-center justify-center min-h-[70vh] px-4 w-full">
              <DynamicLoader currentLog={batch?.liveLog || "Evaluating Rule 6 compliance parameters..."} />
          </div>
`;
  
  code = code.substring(0, startIndex) + newLoadingBlock + code.substring(endIndex);
  fs.writeFileSync('app/batch/[id]/page.jsx', code);
  console.log("REPLACED BATCH PAGE UI");
} else {
  console.log("COULD NOT FIND INDEXES");
}
