const fs = require('fs');
let code = fs.readFileSync('components/NavBar.jsx', 'utf8');

// Change px-6 to px-4 md:px-6
code = code.replace('px-6 sticky', 'px-4 md:px-6 sticky');

// Adjust the title area for mobile
const titleTarget = `<div className="flex flex-col justify-center">
          <span className="text-[10px] font-sans tracking-[0.05em] text-white/80 uppercase mb-0.5 font-medium">सत्यमेव जयते Dept. of Consumer Affairs</span>
          <span className="font-semibold tracking-tight text-[17px] text-white leading-none">MetroLens <span className="font-normal text-white/80 text-[15px]">Legal Metrology</span></span>
        </div>`;

const newTitle = `<div className="flex flex-col justify-center max-w-[200px] sm:max-w-none">
          <span className="hidden sm:block text-[9px] font-sans tracking-[0.05em] text-white/80 uppercase mb-0.5 font-medium leading-none truncate">सत्यमेव जयते Dept. of Consumer Affairs</span>
          <span className="font-semibold tracking-tight text-[16px] sm:text-[17px] text-white leading-none truncate">MetroLens <span className="hidden sm:inline font-normal text-white/80 text-[15px]">Legal Metrology</span></span>
        </div>`;

code = code.replace(titleTarget, newTitle);

fs.writeFileSync('components/NavBar.jsx', code);
console.log("NAVBAR FIXED");
