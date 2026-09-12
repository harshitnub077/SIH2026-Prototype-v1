const fs = require('fs');
let code = fs.readFileSync('components/BottomNav.jsx', 'utf8');

// Remove the {role === 'admin' && ( ... )} wrapper
// Currently it is:
// {role === 'admin' && (
//   <Link ...>...</Link>
// )}
code = code.replace("{role === 'admin' && (", "");
code = code.replace(/<\/span>\s*<\/Link>\s*}\)/, "</span>\n        </Link>");

fs.writeFileSync('components/BottomNav.jsx', code);
console.log("RULES TAB UNLOCKED");
