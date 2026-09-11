"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Shield, ArrowRight, LogOut, UserCheck } from 'lucide-react';

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const storedEmail = sessionStorage.getItem('email') || localStorage.getItem('email');
    const storedRole = sessionStorage.getItem('role') || localStorage.getItem('role');

    if (token) {
      setIsAuthenticated(true);
      setEmail(storedEmail || 'officer@doca.gov.in');
      setRole(storedRole || 'officer');
    } else {
      setIsAuthenticated(false);
      setEmail('');
      setRole('');
    }
  }, [pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('email');
    sessionStorage.removeItem('role');
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
    setMobileMenuOpen(false);
    router.push('/login');
  };

  const authLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'New Inspection', path: '/upload' },
    { name: 'Inspection Ledger', path: '/history' },
    { name: 'Statutory Rules', path: '/rules' },
    { name: 'Settings', path: '/settings' }
  ];

  const publicLinks = [
    { name: 'Portal Home', path: '/' },
    { name: 'Statutory Rules (2011)', path: '/rules' },
    { name: 'About System', path: '/about' }
  ];

  const links = isAuthenticated ? authLinks : publicLinks;

  if (pathname === '/login') return null;

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Official Government Tricolor Ribbon */}
      <div className="w-full h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808] shrink-0" />

      <nav className="w-full h-[calc(60px+env(safe-area-inset-top))] sm:h-[calc(64px+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] flex items-center justify-between px-3 sm:px-6 md:px-8 bg-[#0B1F3A] shadow-[0_4px_20px_rgba(11,31,58,0.35)] border-b border-blue-950 transition-colors">
        
        {/* Brand & National Identity */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
          <div className="flex items-center justify-center shrink-0">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
              alt="State Emblem of India" 
              className="h-7 sm:h-9 w-auto object-contain brightness-0 invert opacity-95 group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="flex flex-col justify-center text-left min-w-0">
            <span className="text-[9px] sm:text-[10px] font-sans tracking-[0.04em] sm:tracking-[0.05em] text-amber-300 uppercase leading-none mb-0.5 sm:mb-1 font-semibold truncate hidden xs:block">
              उपभोक्ता मामले विभाग • Dept. of Consumer Affairs
            </span>
            <span className="font-bold tracking-tight text-[15px] sm:text-[17px] text-white leading-none truncate">
              MetroLens <span className="font-normal text-slate-300 text-[12px] sm:text-[14px]">Legal Metrology</span>
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-5 lg:gap-6">
          {links.map(l => (
            <Link 
              key={l.name} 
              href={l.path} 
              className={`text-[13px] font-medium transition-colors ${
                pathname === l.path 
                  ? 'text-amber-400 font-semibold' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {l.name}
            </Link>
          ))}
        </div>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-mono text-slate-300 bg-white/5 px-2.5 py-1 rounded-md border border-white/10 max-w-[180px] truncate">
                {email}
              </span>
              <button 
                onClick={handleLogout} 
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 py-1.5 px-3.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link 
                href="/login" 
                className="bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/20 py-1.5 px-3.5 text-xs font-semibold rounded-lg transition-colors"
              >
                Officer Sign In
              </Link>
              <Link 
                href="/login" 
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 px-3.5 text-xs rounded-lg shadow-sm transition-all"
              >
                Start Inspection
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Right Bar: Fast Action + Hamburger Menu */}
        <div className="flex md:hidden items-center gap-2">
          {!isAuthenticated ? (
            <Link 
              href="/login" 
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1 px-2.5 text-[11px] rounded-md shadow-xs transition-all"
            >
              Sign In
            </Link>
          ) : (
            <Link 
              href="/upload" 
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1 px-2.5 text-[11px] rounded-md shadow-xs transition-all"
            >
              Scan
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 focus:outline-none transition-colors"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

      </nav>

      {/* ── Mobile Navigation Drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed top-0 right-0 bottom-0 w-[82vw] max-w-sm bg-[#0B1F3A] border-l border-blue-900/60 shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-right duration-200">
            
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-blue-900/60">
                <div className="flex items-center gap-2.5">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
                    alt="State Emblem of India" 
                    className="h-8 w-auto brightness-0 invert opacity-90"
                  />
                  <div>
                    <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">DOCA &middot; SIH26034</div>
                    <div className="text-sm font-bold text-white">MetroLens Portal</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Identity Chip if Authenticated */}
              {isAuthenticated && (
                <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <UserCheck size={14} className="text-amber-400" />
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">
                      {role === 'admin' ? 'System Administrator' : 'Enforcement Officer'}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-white truncate font-medium">{email}</div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase mb-2 px-2">
                  Navigation
                </span>
                {links.map(l => {
                  const isActive = pathname === l.path;
                  return (
                    <Link
                      key={l.name}
                      href={l.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive 
                          ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30' 
                          : 'text-slate-200 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>{l.name}</span>
                      <ArrowRight size={14} className={isActive ? 'text-amber-300' : 'text-slate-500'} />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-5 border-t border-blue-900/60 mt-6 flex flex-col gap-2.5">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out Session</span>
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all"
                  >
                    Officer Sign In
                  </Link>
                  <Link
                    href="/rules"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 px-4 rounded-xl text-xs font-medium text-slate-300 hover:text-white border border-white/10 transition-all"
                  >
                    View Statutory Provisions
                  </Link>
                </div>
              )}
              <div className="text-center text-[10px] text-slate-500 font-mono mt-1">
                Legal Metrology (PC) Rules, 2011
              </div>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}


