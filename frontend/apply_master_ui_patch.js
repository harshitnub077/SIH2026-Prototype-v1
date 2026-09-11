const fs = require('fs');

// --- 1. LOGIN PAGE ---
let loginCode = fs.readFileSync('app/login/page.jsx', 'utf8');
const newLoginCode = `"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Authenticating...');

    try {
      const res = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'https://metrolens-backend.onrender.com/api/v1'}/auth/login\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("API Error");
      const data = await res.json();
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('email', email);
        localStorage.setItem('role', email.includes('admin') ? 'admin' : 'officer');
        toast.success('Login Successful', { id: toastId });
        router.push('/dashboard');
      }
    } catch (err) {
      localStorage.setItem('token', 'demo-token');
      localStorage.setItem('email', email);
      localStorage.setItem('role', email.includes('admin') ? 'admin' : 'officer');
      toast.warning('Network Offline', { id: toastId, description: 'Entering Demo Mode.' });
      router.push('/dashboard');
    }
  };

  const handleQuickLogin = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex items-center justify-center p-6 text-text-primary font-sans selection:bg-accent/30">
      {/* Ambient Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
      
      {/* Glass Panel */}
      <div className="w-full max-w-[440px] glass backdrop-blur-3xl border border-border/50 shadow-2xl rounded-[32px] p-8 sm:p-12 z-10 animate-fade-in relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-[32px] pointer-events-none"></div>
        
        <div className="flex items-center gap-4 mb-10 relative z-10">
          <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-accent to-blue-700 flex items-center justify-center shadow-lg shadow-accent/20 border border-white/20">
            <svg className="w-6 h-6 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-bold tracking-tight text-[22px]">MetroLens</span>
        </div>
        
        <h1 className="text-[32px] font-semibold tracking-tight leading-[1.1] mb-2 relative z-10">Sign in</h1>
        <p className="text-[15px] text-text-secondary mb-8 relative z-10">Enter your credentials to access the compliance dashboard.</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 mb-8 relative z-10">
          <input 
            type="email" 
            placeholder="Email address" 
            className="w-full bg-black/10 dark:bg-white/5 border border-border/50 rounded-[16px] px-5 py-4 text-[15px] focus:outline-none focus:border-accent transition-colors backdrop-blur-sm" 
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full bg-black/10 dark:bg-white/5 border border-border/50 rounded-[16px] px-5 py-4 text-[15px] focus:outline-none focus:border-accent transition-colors backdrop-blur-sm" 
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-text-primary text-background hover:scale-[1.02] active:scale-[0.98] transition-transform rounded-[16px] px-5 py-4 font-semibold text-[15px] mt-4 shadow-xl" disabled={loading}>
            {loading ? 'Authenticating...' : 'Continue'}
          </button>
        </form>

        <div className="border-t border-border/50 pt-8 relative z-10">
          <p className="text-[12px] font-semibold tracking-widest uppercase text-text-muted mb-4 text-center">Quick Demo Access</p>
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => handleQuickLogin('officer@gov.in')} className="glass border border-border/50 rounded-[12px] py-3 text-[13px] font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors shadow-sm">Field Officer</button>
            <button type="button" onClick={() => handleQuickLogin('admin@gov.in')} className="glass border border-border/50 rounded-[12px] py-3 text-[13px] font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors shadow-sm">System Admin</button>
          </div>
        </div>
      </div>
    </div>
  );
}`;
fs.writeFileSync('app/login/page.jsx', newLoginCode);
console.log('LOGIN PATCHED');

// --- 2. SETTINGS PAGE ---
let settingsCode = fs.readFileSync('app/settings/page.jsx', 'utf8');
const newSettingsCode = `"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import NavBar from '@/components/NavBar';
import { LogOut, Moon, Sun, Monitor, Bell, Shield, Info, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem('token')) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(40);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-text-primary pb-20">
      <NavBar />
      
      <main className="max-w-[700px] mx-auto px-4 md:px-6 py-6 md:py-12 animate-fade-in">
        <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight leading-[1.1] mb-2">Settings</h1>
        <p className="text-[15px] text-text-secondary mb-10">Manage your application preferences and account.</p>

        <div className="flex flex-col gap-8">
          
          <section className="flex flex-col gap-3">
            <h2 className="text-[13px] font-bold tracking-widest uppercase text-text-muted px-2">Appearance</h2>
            <div className="glass rounded-[24px] border border-border/50 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-5 border-b border-border/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => { triggerHaptic(); setTheme('light'); }}>
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-background rounded-xl border border-border shadow-sm text-text-secondary"><Sun size={18} /></div>
                  <span className="font-medium text-[15px]">Light Mode</span>
                </div>
                <div className={\`w-5 h-5 rounded-full border \${theme === 'light' ? 'border-accent border-[5px]' : 'border-border'}\`}></div>
              </div>
              <div className="flex items-center justify-between p-5 border-b border-border/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => { triggerHaptic(); setTheme('dark'); }}>
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-background rounded-xl border border-border shadow-sm text-text-secondary"><Moon size={18} /></div>
                  <span className="font-medium text-[15px]">Dark Mode</span>
                </div>
                <div className={\`w-5 h-5 rounded-full border \${theme === 'dark' ? 'border-accent border-[5px]' : 'border-border'}\`}></div>
              </div>
              <div className="flex items-center justify-between p-5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => { triggerHaptic(); setTheme('system'); }}>
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-background rounded-xl border border-border shadow-sm text-text-secondary"><Monitor size={18} /></div>
                  <span className="font-medium text-[15px]">System Match</span>
                </div>
                <div className={\`w-5 h-5 rounded-full border \${theme === 'system' ? 'border-accent border-[5px]' : 'border-border'}\`}></div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-[13px] font-bold tracking-widest uppercase text-text-muted px-2">System</h2>
            <div className="glass rounded-[24px] border border-border/50 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-background rounded-xl border border-border shadow-sm text-text-secondary"><Bell size={18} /></div>
                  <div>
                    <div className="font-medium text-[15px]">Push Notifications</div>
                    <div className="text-[12px] text-text-muted">Receive scan completion alerts</div>
                  </div>
                </div>
                <button 
                  onClick={() => { triggerHaptic(); setNotifications(!notifications); }}
                  className={\`w-12 h-6 rounded-full relative transition-colors \${notifications ? 'bg-emerald-500' : 'bg-border'}\`}
                >
                  <div className={\`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform \${notifications ? 'translate-x-6' : 'translate-x-0'}\`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-background rounded-xl border border-border shadow-sm text-text-secondary"><Info size={18} /></div>
                  <div>
                    <div className="font-medium text-[15px]">About MetroLens</div>
                    <div className="text-[12px] text-text-muted">Version 2.5.0 (Enterprise Build)</div>
                  </div>
                </div>
                <button onClick={() => toast.success('MetroLens Enterprise v2.5.0')} className="text-[13px] font-bold text-accent">View Details</button>
              </div>
            </div>
          </section>

          <section className="mt-4">
            <div className="glass rounded-[24px] border border-red-500/20 overflow-hidden shadow-sm flex items-center justify-between p-5 bg-red-500/5">
              <div>
                <h2 className="text-[15px] font-medium text-red-600 dark:text-red-400 mb-1">Sign Out</h2>
                <p className="text-[13px] text-red-600/70 dark:text-red-400/70">Clear session and lock app.</p>
              </div>
              <button 
                onClick={handleLogout}
                className="px-5 py-2.5 bg-red-500 text-white font-medium rounded-[12px] hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                Sign Out
              </button>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}`;
fs.writeFileSync('app/settings/page.jsx', newSettingsCode);
console.log('SETTINGS PATCHED');

// --- 3. FIXING RESULTS TAB (Replacing Hacker Terminal with Professional Enterprise Viewer) ---
let resultsCode = fs.readFileSync('app/results/[id]/page.jsx', 'utf8');

// We use string replacement to perfectly swap out the previous `fix_data_tab_properly.js` code.
const dataTabRegex = /\{\/\* TAB 3: DATA EXTRACTED \*\/\}.*?activeTab === 'data'.*?<\/div>\s*\}\)/s;
const proDataTab = `{/* TAB 3: DATA EXTRACTED */}
        {activeTab === 'data' && (
            <div className="animate-fade-in flex flex-col md:flex-row gap-6 items-start w-full">
               {/* Left Column: Professional Structured Data */}
               <div className="w-full md:w-7/12 flex flex-col gap-4">
                 <h3 className="text-[13px] font-bold tracking-widest uppercase text-text-muted px-1">Structured Telemetry</h3>
                 <div className="glass rounded-[24px] overflow-hidden border border-border/50 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border/40">
                    {Object.entries(fields).filter(([k, v]) => !k.startsWith('_') && v).map(([k, v], i) => (
                      <div key={k} className="bg-background/80 backdrop-blur-md p-5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <div className="text-[11px] font-bold tracking-widest uppercase text-text-muted mb-1.5">
                          {k.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[14px] text-text-primary font-medium break-words leading-relaxed">
                          {String(v)}
                        </div>
                      </div>
                    ))}
                    </div>
                    {Object.entries(fields).filter(([k, v]) => !k.startsWith('_') && v).length === 0 && (
                      <div className="p-8 text-sm text-text-muted text-center bg-background/50">No structured data extracted.</div>
                    )}
                 </div>
               </div>
               
               {/* Right Column: Clean Raw Logs */}
               <div className="w-full md:w-5/12 flex flex-col gap-4">
                 <h3 className="text-[13px] font-bold tracking-widest uppercase text-text-muted px-1">Raw OCR Output</h3>
                 <div className="glass rounded-[24px] overflow-hidden border border-border/50 shadow-sm bg-black/5 dark:bg-white/5 relative">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-[40px] pointer-events-none"></div>
                   <div className="p-5 font-mono text-[12px] md:text-[13px] text-text-secondary whitespace-pre-wrap h-[300px] md:h-[400px] overflow-y-auto custom-scrollbar allow-select leading-relaxed relative z-10">
                     {report.ocr_raw_text || report.ocrRawText || 'No raw data available.'}
                   </div>
                 </div>
               </div>
            </div>
        )}`;
        
if(resultsCode.match(dataTabRegex)) {
  resultsCode = resultsCode.replace(dataTabRegex, proDataTab);
  fs.writeFileSync('app/results/[id]/page.jsx', resultsCode);
  console.log('RESULTS PATCHED');
} else {
  console.log('RESULTS NOT PATCHED - REGEX FAILED');
}
