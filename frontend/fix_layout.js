const fs = require('fs');
let code = fs.readFileSync('app/layout.jsx', 'utf8');

code = code.replace("import './globals.css';", "import './globals.css';\nimport ClientThemeSync from '@/components/ClientThemeSync';");
code = code.replace("</ThemeProvider>", "<ClientThemeSync />\n        </ThemeProvider>");

// Remove the static viewport export since we do it dynamically now
code = code.replace(/export const viewport = \{[\s\S]*?\};/, '');

fs.writeFileSync('app/layout.jsx', code);
console.log("LAYOUT UPDATED");
