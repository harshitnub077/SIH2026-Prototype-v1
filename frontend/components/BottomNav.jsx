"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ScanLine, Clock, Settings, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { triggerHaptic } from '@/utils/haptics';

export default function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || pathname === '/login' || pathname === '/') return null;

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-[9990] bg-white/95 dark:bg-[#070D18]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-[max(6px,env(safe-area-inset-bottom))] transition-colors"
    >
      <div className="flex items-center justify-around px-1 h-[64px]">
        
        {/* Dashboard */}
        <Link 
          onClick={() => triggerHaptic('light')} 
          href="/dashboard" 
          className="flex flex-col items-center justify-center flex-1 h-full min-h-[48px] gap-1 active:scale-95 transition-transform"
        >
          <LayoutDashboard size={20} className={pathname.includes('/dashboard') ? 'text-blue-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'} />
          <span className={`text-[10px] font-semibold tracking-wide ${pathname.includes('/dashboard') ? 'text-blue-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>Dashboard</span>
        </Link>
        
        {/* History */}
        <Link 
          onClick={() => triggerHaptic('light')} 
          href="/history" 
          className="flex flex-col items-center justify-center flex-1 h-full min-h-[48px] gap-1 active:scale-95 transition-transform"
        >
          <Clock size={20} className={pathname.includes('/history') ? 'text-blue-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'} />
          <span className={`text-[10px] font-semibold tracking-wide ${pathname.includes('/history') ? 'text-blue-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>History</span>
        </Link>

        {/* Floating Scan Button */}
        <Link 
          onClick={() => triggerHaptic('medium')} 
          href="/upload" 
          aria-label="New Inspection Scan"
          className="flex flex-col items-center justify-end flex-1 h-full min-h-[48px] relative pb-1 active:scale-95 transition-transform"
        >
          <div className="absolute -top-4 bg-[#0B1F3A] dark:bg-amber-500 text-white dark:text-slate-950 w-[50px] h-[50px] rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-[#070D18] z-10 transition-colors">
            <ScanLine size={24} />
          </div>
          <span className={`text-[10px] font-bold tracking-wide mt-auto ${pathname.includes('/upload') ? 'text-blue-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
            Scan
          </span>
        </Link>
        
        {/* Rules */}
        <Link 
          onClick={() => triggerHaptic('light')} 
          href="/rules" 
          className="flex flex-col items-center justify-center flex-1 h-full min-h-[48px] gap-1 active:scale-95 transition-transform"
        >
          <ShieldAlert size={20} className={pathname.includes('/rules') ? 'text-blue-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'} />
          <span className={`text-[10px] font-semibold tracking-wide ${pathname.includes('/rules') ? 'text-blue-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>Rules</span>
        </Link>
        
        {/* Settings */}
        <Link 
          onClick={() => triggerHaptic('light')} 
          href="/settings" 
          className="flex flex-col items-center justify-center flex-1 h-full min-h-[48px] gap-1 active:scale-95 transition-transform"
        >
          <Settings size={20} className={pathname.includes('/settings') ? 'text-blue-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'} />
          <span className={`text-[10px] font-semibold tracking-wide ${pathname.includes('/settings') ? 'text-blue-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>Settings</span>
        </Link>
        
      </div>
    </nav>
  );
}
