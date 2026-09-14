const fs = require('fs');
const path = 'app/results/[id]/page.jsx';
let code = fs.readFileSync(path, 'utf8');

// Fix the case sensitivity in the Violations section filter
code = code.replace(/v\.status !== 'PASS'/g, "v.status.toUpperCase() !== 'PASS'");
code = code.replace(/v\.status !== 'NOT APPLICABLE'/g, "v.status.toUpperCase() !== 'NOT APPLICABLE'");

// Fix the case sensitivity in the Passes section filter
code = code.replace(/v\.status === 'PASS'/g, "v.status.toUpperCase() === 'PASS'");
code = code.replace(/v\.status === 'NOT APPLICABLE'/g, "v.status.toUpperCase() === 'NOT APPLICABLE'");

// Also in the CSV export
// It currently has: if(v.status !== 'PASS' && v.status !== 'NOT APPLICABLE')
// The above regexes will fix this too.

fs.writeFileSync(path, code);
console.log("FIXED STATUS FILTERS IN RESULTS PAGE");
