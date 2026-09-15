const fs = require('fs');
let code = fs.readFileSync('app/layout.jsx', 'utf8');

const target = `themeColor: '#1E3A8A',`;
const newText = `themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1E3A8A' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],`;

if (code.includes(target)) {
  code = code.replace(target, newText);
  fs.writeFileSync('app/layout.jsx', code);
  console.log("UPDATED THEME COLOR");
} else {
  console.log("NOT FOUND");
}
