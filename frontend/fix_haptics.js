const fs = require('fs');
let code = fs.readFileSync('components/DynamicLoader.jsx', 'utf8');

// Helper to safely trigger haptics
const hapticFunc = `
  const triggerHaptic = (pattern) => {
    if (typeof window !== 'undefined' && navigator && navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch(e) {}
    }
  };
`;

// Insert helper after hooks
code = code.replace(
  'const [logIdx, setLogIdx] = useState(0);',
  'const [logIdx, setLogIdx] = useState(0);\n' + hapticFunc
);

// Trigger haptic on icon swap
code = code.replace(
  'setPairIdx((prev) => (prev + 1) % icons.length);',
  'setPairIdx((prev) => (prev + 1) % icons.length);\n        triggerHaptic([15, 30, 15]); // Satisfying physical swap click'
);

// Trigger haptic on log text update
code = code.replace(
  'if (prev < logTexts.length - 1) return prev + 1;',
  'if (prev < logTexts.length - 1) {\n          triggerHaptic(5); // Tiny tick for new log\n          return prev + 1;\n        }'
);

fs.writeFileSync('components/DynamicLoader.jsx', code);
console.log("HAPTICS ADDED TO LOADER");
