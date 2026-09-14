const fs = require('fs');

// 1. Restore static viewport to layout.jsx
let layoutCode = fs.readFileSync('app/layout.jsx', 'utf8');
const viewportExport = `\nexport const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};\n\n`;
layoutCode = layoutCode.replace('export const metadata = {', viewportExport + 'export const metadata = {');
fs.writeFileSync('app/layout.jsx', layoutCode);

// 2. Remove dynamic viewport injection from ClientThemeSync.jsx to avoid conflicts
let themeCode = fs.readFileSync('components/ClientThemeSync.jsx', 'utf8');
themeCode = themeCode.replace(/let viewportMeta[\s\S]*?viewport-fit=cover';/m, '');
fs.writeFileSync('components/ClientThemeSync.jsx', themeCode);

// 3. Revert manifest.js to Navy Blue
let manifestCode = fs.readFileSync('app/manifest.js', 'utf8');
manifestCode = manifestCode.replace(/background_color: '#000000'/g, "background_color: '#1E3A8A'");
manifestCode = manifestCode.replace(/theme_color: '#000000'/g, "theme_color: '#1E3A8A'");
fs.writeFileSync('app/manifest.js', manifestCode);

// 4. Revert SplashScreen to Navy Blue
let splashCode = fs.readFileSync('components/SplashScreen.jsx', 'utf8');
splashCode = splashCode.replace('bg-black', 'bg-[#1E3A8A]');
fs.writeFileSync('components/SplashScreen.jsx', splashCode);

console.log("MOBILE GLITCHES FIXED NATIVELY");
