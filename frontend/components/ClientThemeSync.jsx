
"use client";
import { useTheme } from 'next-themes';
import { useEffect } from 'react';

export default function ClientThemeSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    
    // The theme-color meta tag is now handled statically by Next.js in layout.jsx 
    // to prevent PWA flashing on initial load.
    
    // Sync the root HTML layer background to match the body background.
    // This fixes the BOTTOM overscroll seam so you don't see a weird color when pulling up.
    document.documentElement.style.backgroundColor = resolvedTheme === 'dark' ? '#000000' : '#ffffff';
    document.body.style.backgroundColor = resolvedTheme === 'dark' ? '#000000' : '#ffffff';
    
    // Enable iOS Safari :active pseudo-class tactile feedback
    if (typeof window !== 'undefined') {
      document.body.ontouchstart = () => {};
    }

  }, [resolvedTheme]);

  return null;
}

