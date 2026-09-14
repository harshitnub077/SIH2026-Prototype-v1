const fs = require('fs');
let code = fs.readFileSync('app/results/[id]/page.jsx', 'utf8');

// 1. Add success haptic inside the main useEffect (when report finishes loading)
// The effect sets setReport(data). We can add haptics there.
code = code.replace(
  'setReport(data.data || data);',
  'setReport(data.data || data);\n        if (typeof window !== "undefined" && navigator.vibrate) { navigator.vibrate([30, 50, 30]); }'
);

// 2. Make the tabs scrollable with snap-x on mobile
// Currently it is: <div className="grid grid-cols-4 border-b border-border mb-8 w-full">
code = code.replace(
  '<div className="grid grid-cols-4 border-b border-border mb-8 w-full">',
  '<div className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory border-b border-border mb-8 w-full">'
);

// Modify the tab button to have snap-center and flex-shrink-0
code = code.replace(
  `className={\`px-1 py-3 text-[10px] md:text-[13px] md:px-6 font-bold tracking-widest uppercase transition-all flex items-center justify-center text-center \${activeTab === tab ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-text-muted hover:text-text-primary'}\`}`,
  `className={\`snap-center shrink-0 min-w-[90px] flex-1 px-2 py-3 text-[10px] md:text-[13px] md:px-6 font-bold tracking-widest uppercase transition-all flex items-center justify-center text-center \${activeTab === tab ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-text-muted hover:text-text-primary'}\`}`
);

fs.writeFileSync('app/results/[id]/page.jsx', code);
console.log("RESULTS UI UPGRADED");
