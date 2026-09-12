const fs = require('fs');

let code = fs.readFileSync('app/batch/[id]/page.jsx', 'utf8');

code = code.replace(
  '<DynamicLoader currentLog={batch?.liveLog || "Evaluating Rule 6 compliance parameters..."} />',
  '<DynamicLoader />'
);

fs.writeFileSync('app/batch/[id]/page.jsx', code);
console.log("REMOVED CURRENTLOG PROP");
