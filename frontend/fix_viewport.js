const fs = require('fs');
let code = fs.readFileSync('components/ClientThemeSync.jsx', 'utf8');

code = code.replace("document.head.appendChild(appleMeta);", `document.head.appendChild(appleMeta);
    }
    appleMeta.content = resolvedTheme === 'dark' ? 'black-translucent' : 'default';

    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover';`);

fs.writeFileSync('components/ClientThemeSync.jsx', code);
console.log("VIEWPORT ADDED");
