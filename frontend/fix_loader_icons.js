const fs = require('fs');
let code = fs.readFileSync('components/DynamicLoader.jsx', 'utf8');

// The new icons array string
const newIconsBlock = `const icons = [
  // Pair 1: 3D Shield & 3D Document Stack
  [
    <svg key="shield" width="70" height="70" viewBox="0 0 100 100" fill="none" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="shieldBase" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1E3A8A"/><stop offset="100%" stopColor="#172554"/></linearGradient>
        <linearGradient id="shieldFront" x1="20%" y1="0%" x2="80%" y2="100%"><stop offset="0%" stopColor="#3B82F6"/><stop offset="100%" stopColor="#1D4ED8"/></linearGradient>
        <linearGradient id="shieldGloss" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="rgba(255,255,255,0.6)"/><stop offset="50%" stopColor="rgba(255,255,255,0)"/></linearGradient>
      </defs>
      <path d="M50 95s35-15 35-45V20L50 5L15 20v30c0 30 35 45 35 45z" fill="url(#shieldBase)" transform="translate(4, 6)"/>
      <path d="M50 95s35-15 35-45V20L50 5L15 20v30c0 30 35 45 35 45z" fill="url(#shieldFront)"/>
      <path d="M50 95c0 0-35-15-35-45V20L50 5v90z" fill="url(#shieldGloss)" opacity="0.6"/>
    </svg>,
    <svg key="doc" width="62" height="62" viewBox="0 0 100 100" fill="none" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="docBase" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#B45309"/><stop offset="100%" stopColor="#78350F"/></linearGradient>
        <linearGradient id="docFront" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FBBF24"/><stop offset="100%" stopColor="#D97706"/></linearGradient>
      </defs>
      <path d="M30 15h40a8 8 0 0 1 8 8v60a8 8 0 0 1-8 8H30a8 8 0 0 1-8-8V23a8 8 0 0 1 8-8z" fill="url(#docBase)" transform="translate(6, 6)"/>
      <path d="M26 11h40a8 8 0 0 1 8 8v60a8 8 0 0 1-8 8H26a8 8 0 0 1-8-8V19a8 8 0 0 1 8-8z" fill="#FDE68A" transform="translate(3, 3)"/>
      <path d="M22 7h40a8 8 0 0 1 8 8v60a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8V15a8 8 0 0 1 8-8z" fill="url(#docFront)"/>
      <rect x="35" y="30" width="30" height="6" rx="3" fill="#FFF" opacity="0.9"/>
      <rect x="35" y="45" width="30" height="6" rx="3" fill="#FFF" opacity="0.9"/>
      <rect x="35" y="60" width="20" height="6" rx="3" fill="#FFF" opacity="0.9"/>
    </svg>
  ],
  // Pair 2: 3D Magnifying Glass & 3D Box
  [
    <svg key="mag" width="66" height="66" viewBox="0 0 100 100" fill="none" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="lens" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#67E8F9"/><stop offset="100%" stopColor="#06B6D4"/></linearGradient>
        <linearGradient id="rim" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F8FAFC"/><stop offset="100%" stopColor="#94A3B8"/></linearGradient>
        <linearGradient id="handle" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#8B5CF6"/><stop offset="100%" stopColor="#4C1D95"/></linearGradient>
      </defs>
      <rect x="58" y="58" width="16" height="36" rx="8" transform="rotate(-45 58 58)" fill="#312E81" />
      <rect x="54" y="54" width="16" height="36" rx="8" transform="rotate(-45 54 54)" fill="url(#handle)" />
      <circle cx="46" cy="46" r="30" fill="#475569" />
      <circle cx="42" cy="42" r="30" fill="url(#rim)" />
      <circle cx="42" cy="42" r="22" fill="url(#lens)" opacity="0.8" />
      <path d="M42 20a22 22 0 0 0-22 22 22 22 0 0 1 22-22z" fill="#FFF" opacity="0.8"/>
    </svg>,
    <svg key="box" width="66" height="66" viewBox="0 0 100 100" fill="none" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="boxTop" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#34D399"/><stop offset="100%" stopColor="#059669"/></linearGradient>
        <linearGradient id="boxLeft" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10B981"/><stop offset="100%" stopColor="#047857"/></linearGradient>
        <linearGradient id="boxRight" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#059669"/><stop offset="100%" stopColor="#064E3B"/></linearGradient>
      </defs>
      <path d="M50 15 L85 30 L50 45 L15 30 Z" fill="url(#boxTop)" />
      <path d="M15 30 L50 45 L50 85 L15 70 Z" fill="url(#boxLeft)" />
      <path d="M85 30 L50 45 L50 85 L85 70 Z" fill="url(#boxRight)" />
      <path d="M15 30 L50 45 L85 30" stroke="#6EE7B7" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M50 45 L50 85" stroke="#34D399" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ],
  // Pair 3: 3D Clipboard & AI Core
  [
    <svg key="clip" width="66" height="66" viewBox="0 0 100 100" fill="none" className="drop-shadow-2xl">
       <rect x="25" y="20" width="50" height="65" rx="4" fill="#78350F" transform="translate(4,4)"/>
       <rect x="25" y="20" width="50" height="65" rx="4" fill="#D97706"/>
       <rect x="30" y="25" width="40" height="55" rx="2" fill="#F8FAFC"/>
       <rect x="40" y="10" width="20" height="15" rx="2" fill="#475569" transform="translate(3,3)"/>
       <rect x="40" y="10" width="20" height="15" rx="2" fill="#94A3B8"/>
       <rect x="42" y="40" width="20" height="4" rx="2" fill="#CBD5E1"/>
       <rect x="42" y="55" width="15" height="4" rx="2" fill="#CBD5E1"/>
       <path d="M35 38 L38 42 L45 33" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
       <path d="M35 53 L38 57 L45 48" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>,
    <svg key="ai" width="66" height="66" viewBox="0 0 100 100" fill="none" className="drop-shadow-2xl">
       <path d="M50 20 L80 35 L50 50 L20 35 Z" fill="rgba(56, 189, 248, 0.2)" stroke="#38BDF8" strokeWidth="1"/>
       <path d="M20 35 L50 50 L50 80 L20 65 Z" fill="rgba(14, 165, 233, 0.2)" stroke="#0EA5E9" strokeWidth="1"/>
       <path d="M80 35 L50 50 L50 80 L80 65 Z" fill="rgba(2, 132, 199, 0.2)" stroke="#0284C7" strokeWidth="1"/>
       <path d="M50 35 L65 42 L50 50 L35 42 Z" fill="#E0F2FE"/>
       <path d="M35 42 L50 50 L50 65 L35 57 Z" fill="#7DD3FC"/>
       <path d="M65 42 L50 50 L50 65 L65 57 Z" fill="#38BDF8"/>
       <circle cx="50" cy="20" r="4" fill="#FFF" filter="drop-shadow(0 0 5px #38BDF8)"/>
       <circle cx="20" cy="35" r="4" fill="#FFF" filter="drop-shadow(0 0 5px #38BDF8)"/>
       <circle cx="80" cy="35" r="4" fill="#FFF" filter="drop-shadow(0 0 5px #38BDF8)"/>
    </svg>
  ],
  // Pair 4: 3D Lock & Gold Coin (Compliance Value)
  [
    <svg key="lock" width="66" height="66" viewBox="0 0 100 100" fill="none" className="drop-shadow-2xl">
       <path d="M35 40 V30 C35 15 65 15 65 30 V40" fill="none" stroke="#64748B" strokeWidth="12" strokeLinecap="round" transform="translate(3,3)"/>
       <path d="M35 40 V30 C35 15 65 15 65 30 V40" fill="none" stroke="#CBD5E1" strokeWidth="12" strokeLinecap="round"/>
       <rect x="25" y="40" width="50" height="45" rx="8" fill="#B45309" transform="translate(4,4)"/>
       <rect x="25" y="40" width="50" height="45" rx="8" fill="#FBBF24"/>
       <circle cx="50" cy="55" r="6" fill="#78350F"/>
       <path d="M47 58 L53 58 L55 68 L45 68 Z" fill="#78350F"/>
       <rect x="30" y="40" width="10" height="45" fill="#FFF" opacity="0.4"/>
    </svg>,
    <svg key="coin" width="66" height="66" viewBox="0 0 100 100" fill="none" className="drop-shadow-2xl">
       <circle cx="53" cy="53" r="30" fill="#B45309"/>
       <circle cx="50" cy="50" r="30" fill="#D97706"/>
       <circle cx="50" cy="50" r="24" fill="#FBBF24"/>
       <path d="M38 50 L46 58 L62 42" stroke="#B45309" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
       <path d="M50 20 A30 30 0 0 0 20 50 A30 30 0 0 1 50 20 Z" fill="#FFF" opacity="0.5"/>
    </svg>
  ]
];`;

const startIndex = code.indexOf('const icons = [');
const endIndex = code.indexOf('];', startIndex) + 2;

code = code.substring(0, startIndex) + newIconsBlock + code.substring(endIndex);

// Replace the `bounceFloat` class with `wobble3D` class for the 3D twist effect
code = code.replace(/animate-\[bounceFloat_1\.5s_ease-in-out_infinite_alternate\]/g, 'animate-[wobble3D_3s_ease-in-out_infinite]');
code = code.replace(/animate-\[bounceFloat_1\.5s_ease-in-out_infinite_alternate-reverse\]/g, 'animate-[wobble3D_3.5s_ease-in-out_infinite]');

fs.writeFileSync('components/DynamicLoader.jsx', code);
console.log("LOADER PAIRS ADDED AND ROTATION FIXED");
