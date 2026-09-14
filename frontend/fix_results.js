const fs = require('fs');
let code = fs.readFileSync('app/results/[id]/page.jsx', 'utf8');

// Fix max-w and paddings for mobile
code = code.replace('<main className="max-w-[1000px] mx-auto px-6 mt-8">', '<main className="max-w-[1000px] mx-auto px-4 md:px-6 mt-4 md:mt-8">');
code = code.replace('<div className="glass rounded-[24px] p-8 mb-8 relative overflow-hidden">', '<div className="glass rounded-[20px] md:rounded-[24px] p-5 md:p-8 mb-6 md:mb-8 relative overflow-hidden">');

// AI Executive summary box padding
code = code.replace('<div className="glass rounded-[20px] p-6 border-l-4 border-l-accent mb-8">', '<div className="glass rounded-[16px] md:rounded-[20px] p-5 md:p-6 border-l-4 border-l-accent mb-6 md:mb-8">');

// Rules Layout Tabs (if they have fixed widths)
code = code.replace(/text-\[14px\] tracking-\[0\.2em\] uppercase px-6 py-4/g, 'text-[12px] md:text-[14px] tracking-[0.1em] md:tracking-[0.2em] uppercase px-4 md:px-6 py-3 md:py-4');

// Extracted fields padding
code = code.replace(/<div key=\{k\} className="glass rounded-\[16px\] p-5">/g, '<div key={k} className="glass rounded-[12px] md:rounded-[16px] p-4 md:p-5">');
code = code.replace(/<h3 className="text-\[18px\] font-medium text-text-primary mb-6">AI Structured Extraction<\/h3>/g, '<h3 className="text-[16px] md:text-[18px] font-medium text-text-primary mb-4 md:mb-6">AI Structured Extraction</h3>');

// Score layout text sizes
code = code.replace(/text-\[32px\] md:text-\[40px\]/g, 'text-[24px] md:text-[40px]');
code = code.replace(/text-\[56px\]/g, 'text-[40px] md:text-[56px]');

// Fix grid gap on mobile
code = code.replace(/gap-6/g, 'gap-4 md:gap-6');

// Violations Box Padding
code = code.replace(/<div key=\{'fail-'\+i\} className="glass rounded-\[16px\] p-6 border-l-4/g, '<div key={\'fail-\'+i} className="glass rounded-[12px] md:rounded-[16px] p-4 md:p-6 border-l-4');
code = code.replace(/<div key=\{'pass-'\+i\} className="glass rounded-\[16px\] p-6 border-l-4/g, '<div key={\'pass-\'+i} className="glass rounded-[12px] md:rounded-[16px] p-4 md:p-6 border-l-4');

fs.writeFileSync('app/results/[id]/page.jsx', code);
console.log("RESULTS FIXED");
