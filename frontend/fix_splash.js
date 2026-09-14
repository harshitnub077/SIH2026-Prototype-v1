const fs = require('fs');
let code = fs.readFileSync('components/SplashScreen.jsx', 'utf8');

const newSplash = `"use client";
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (sessionStorage.getItem('splash_shown')) {
      setShow(false);
      return;
    }

    const isMobile = window.innerWidth < 768;
    if (pathname !== '/' && pathname !== '/dashboard' && !isMobile) {
      setShow(false);
      return;
    }

    const timer1 = setTimeout(() => {
      setFade(true);
    }, 1500);

    const timer2 = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem('splash_shown', 'true');
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [pathname]);

  if (!show) return null;

  return (
    <div 
      className={\`fixed inset-0 z-[9999] bg-[#1E3A8A] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out \${fade ? 'opacity-0 pointer-events-none' : 'opacity-100'}\`}
    >
      <div className="flex flex-col items-center justify-center -mt-10">
        <img 
          src="/icon-with-text.png" 
          alt="MetroLens Logo" 
          className="w-48 h-auto object-contain z-10"
        />
        <div className="flex items-center gap-2 mt-8 opacity-0 animate-[fadeIn_1s_ease-in-out_0.2s_forwards]">
          <div className="w-2.5 h-2.5 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2.5 h-2.5 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '0.15s' }}></div>
          <div className="w-2.5 h-2.5 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
        </div>
      </div>
    </div>
  );
}`;

fs.writeFileSync('components/SplashScreen.jsx', newSplash);
console.log("SPLASH FIXED");
