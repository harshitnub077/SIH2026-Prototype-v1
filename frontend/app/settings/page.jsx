"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { triggerHaptic } from '@/utils/haptics';
import { LogOut, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const RULES_VERSION = 'v1.4 — LM(PC) Rules 2011, Amendment 2022';
const APP_VERSION   = '2.5.0';
const BUILD_DATE    = '2026-09-04';

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted]       = useState(false);
  const [showAbout, setShowAbout]   = useState(false);
  const [email, setEmail]           = useState('');
  const [role, setRole]             = useState('');

  // Admin Provisioning State
  const [provisionName, setProvisionName] = useState('');
  const [provisionEmail, setProvisionEmail] = useState('');
  const [provisionPassword, setProvisionPassword] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = sessionStorage.getItem('token');
    if (!t) { router.push('/login'); return; }
    setEmail(sessionStorage.getItem('email') || '');
    setRole(sessionStorage.getItem('role') || 'officer');
  }, [router]);

  const handleProvisionOfficer = async (e) => {
    e.preventDefault();
    setIsProvisioning(true);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/auth/provision-officer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        },
        body: JSON.stringify({
          name: provisionName,
          email: provisionEmail,
          password: provisionPassword,
          role: 'officer'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create officer account');
      toast.success(data.message || 'Officer account created successfully!');
      setProvisionName(''); setProvisionEmail(''); setProvisionPassword('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('email');
    sessionStorage.removeItem('role');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-text-primary pb-20">
      <NavBar />

      <main className="max-w-[700px] mx-auto px-3 sm:px-6 py-4 sm:py-8 md:py-12 animate-fade-in">
        <h1 className="text-[24px] sm:text-[28px] md:text-[32px] font-semibold tracking-tight leading-[1.1] mb-2">Settings</h1>
        <p className="text-xs sm:text-[15px] text-text-secondary mb-6 sm:mb-8">Manage your application preferences and account.</p>

        <div className="flex flex-col gap-4 sm:gap-6">

          {/* ── Logged-in User Card ───────────────────────────────── */}
          <div className="glass rounded-2xl sm:rounded-[24px] border border-border/50 p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-accent/80 to-blue-600 flex items-center justify-center text-white font-bold text-base sm:text-[18px] shadow-lg shrink-0">
              {email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-[15px] text-text-primary truncate">{email || 'Not signed in'}</p>
              <p className="text-[11px] sm:text-[12px] text-text-muted capitalize">{role} · MetroLens v{APP_VERSION}</p>
            </div>
          </div>

          {/* Admin: Officer Management */}
          {role === 'admin' && (
            <section className="flex flex-col gap-3">
              <h2 className="text-[12px] sm:text-[13px] font-bold tracking-widest uppercase text-text-muted px-2">Officer Management (Admin)</h2>
              <div className="glass rounded-2xl sm:rounded-[24px] border border-border/50 overflow-hidden shadow-sm p-4 sm:p-5">
                <p className="text-xs sm:text-[13px] text-text-secondary mb-4">Provision secure credentials for field officers. They will use this email and password to log in to their device.</p>
                <form onSubmit={handleProvisionOfficer} className="flex flex-col gap-3">
                  <input type="text" placeholder="Officer Full Name" value={provisionName} onChange={e => setProvisionName(e.target.value)} required className="w-full px-4 py-2.5 rounded-[12px] bg-background border border-border text-base sm:text-[15px] focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
                  <input type="email" placeholder="Official Email Address" value={provisionEmail} onChange={e => setProvisionEmail(e.target.value)} required className="w-full px-4 py-2.5 rounded-[12px] bg-background border border-border text-base sm:text-[15px] focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
                  <input type="text" placeholder="Temporary Password" value={provisionPassword} onChange={e => setProvisionPassword(e.target.value)} required className="w-full px-4 py-2.5 rounded-[12px] bg-background border border-border text-base sm:text-[15px] focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
                  <button type="submit" disabled={isProvisioning} className="mt-2 flex items-center justify-center gap-2 px-5 py-2.5 bg-accent text-white font-medium rounded-[12px] hover:opacity-90 transition-colors shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isProvisioning ? 'Creating...' : '+ Create Officer Account'}
                  </button>
                </form>
              </div>
            </section>
          )}

          

          {/* ── About / Version ──────────────────────────────────── */}
          <section className="flex flex-col gap-2 sm:gap-3">
            <h2 className="text-[12px] sm:text-[13px] font-bold tracking-widest uppercase text-text-muted px-2">About</h2>
            <div className="glass rounded-2xl sm:rounded-[24px] border border-border/50 overflow-hidden shadow-sm">
              <button
                onClick={() => { triggerHaptic('light'); router.push('/about'); }}
                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-2.5 bg-background rounded-xl border border-border shadow-sm text-text-secondary">
                    <Info size={18} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm sm:text-[15px]">About MetroLens</div>
                    <div className="text-[11px] sm:text-[12px] text-text-muted">Version {APP_VERSION} · SIH26034</div>
                  </div>
                </div>
                <div className="text-text-muted font-bold text-[14px]">›</div>
              </button>
            </div>
          </section>

          {/* ── Sign Out ─────────────────────────────────────────── */}
          <section className="mt-2">
            <div className="glass rounded-2xl sm:rounded-[24px] border border-red-500/20 overflow-hidden shadow-sm flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-red-500/5 gap-3">
              <div>
                <h2 className="text-sm sm:text-[15px] font-medium text-red-600 dark:text-red-400 mb-0.5 sm:mb-1">Sign Out</h2>
                <p className="text-xs sm:text-[13px] text-red-600/70 dark:text-red-400/70">Clear session and lock app.</p>
              </div>
              <button
                onClick={() => { triggerHaptic('medium'); handleLogout(); }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 w-full sm:w-auto text-xs sm:text-sm"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}


