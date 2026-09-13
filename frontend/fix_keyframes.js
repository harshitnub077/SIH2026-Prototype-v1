const fs = require('fs');
let code = fs.readFileSync('app/globals.css', 'utf8');

if (!code.includes('bounceFloat')) {
  const keyframes = `
@keyframes bounceFloat {
  0% { transform: translateY(0); }
  100% { transform: translateY(-24px); }
}
@keyframes shadowScale {
  0% { transform: scale(1); opacity: 0.3; }
  100% { transform: scale(0.6); opacity: 0.05; }
}
`;
  code = code + keyframes;
  fs.writeFileSync('app/globals.css', code);
  console.log("KEYFRAMES ADDED");
} else {
  console.log("ALREADY ADDED");
}
