const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('frontend/app');
files.push('frontend/components/NavBar.jsx');
files.push('frontend/components/BottomNav.jsx');

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  if (code.includes('href="#"')) console.log(f + ': DEAD LINK (href="#")');
  if (code.match(/onClick=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/)) console.log(f + ': DEAD BUTTON (empty onClick)');
  if (code.includes('alert(')) console.log(f + ': ALERT USED');
  if (code.includes('TODO')) console.log(f + ': TODO FOUND');
});
