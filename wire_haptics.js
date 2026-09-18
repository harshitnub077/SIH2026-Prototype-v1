const fs = require('fs');

// BottomNav
let nav = fs.readFileSync('frontend/components/BottomNav.jsx', 'utf8');
nav = nav.replace("import { useEffect, useState } from 'react';", "import { useEffect, useState } from 'react';\nimport { triggerHaptic } from '@/utils/haptics';");
nav = nav.replace(/<Link /g, '<Link onClick={() => triggerHaptic(\'light\')} ');
fs.writeFileSync('frontend/components/BottomNav.jsx', nav);

// Upload Page
let up = fs.readFileSync('frontend/app/upload/page.jsx', 'utf8');
up = up.replace("import { toast } from 'sonner';", "import { toast } from 'sonner';\nimport { triggerHaptic } from '@/utils/haptics';");
up = up.replace("const handleFile = (e) => {", "const handleFile = (e) => {\n    triggerHaptic('medium');");
up = up.replace("if (!res.ok) throw new Error(json.error || 'Scan failed');", "if (!res.ok) { triggerHaptic('error'); throw new Error(json.error || 'Scan failed'); }");
up = up.replace("router.push(`/results/${json.scan_id || json.id}`);", "triggerHaptic('success');\n      router.push(`/results/${json.scan_id || json.id}`);");
fs.writeFileSync('frontend/app/upload/page.jsx', up);

console.log("HAPTICS WIRED");
