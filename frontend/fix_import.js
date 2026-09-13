const fs = require('fs');
let code = fs.readFileSync('app/layout.jsx', 'utf8');

code = code.replace("import './globals.css'", "import './globals.css'\nimport ClientThemeSync from '../components/ClientThemeSync'");

fs.writeFileSync('app/layout.jsx', code);
console.log("IMPORT ADDED");
