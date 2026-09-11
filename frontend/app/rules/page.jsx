"use client";
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';
import { useRouter } from 'next/navigation';

const FULL_2011_RULES = [
  { id: 'Rule 1', name: 'Short title and commencement', desc: 'Establishes the Legal Metrology (Packaged Commodities) Rules, 2011.' },
  { id: 'Rule 2', name: 'Definitions', desc: 'Defines terms like pre-packaged commodity, principal display panel, MRP, etc.' },
  { id: 'Rule 3', name: 'Applicability', desc: 'Exempts packages > 25kg/25L or those meant for institutional/industrial consumers.' },
  { id: 'Rule 4', name: 'Regulation for pre-packing', desc: 'No person shall pre-pack or sell unless the package complies with these rules.' },
  { id: 'Rule 5', name: 'Specific commodities to be packed in standard quantities', desc: 'Schedule II prescribes standard quantities for specific goods.' },
  { id: 'Rule 6(1)(a)', name: 'Name and address of Manufacturer/Packer/Importer', desc: 'Must be explicitly declared on the package.' },
  { id: 'Rule 6(1)(b)', name: 'Common/Generic name', desc: 'Brand names are not a substitute for the generic name.' },
  { id: 'Rule 6(1)(c)', name: 'Net Quantity', desc: 'Must be in standard SI units (g, kg, ml, L).' },
  { id: 'Rule 6(1)(d)', name: 'Month and Year of Manufacture', desc: 'Must declare when the commodity was manufactured/packed.' },
  { id: 'Rule 6(1)(e)', name: 'Retail Sale Price (MRP)', desc: 'Must include "Inclusive of all taxes" and currency symbol.' },
  { id: 'Rule 6(1)(f)', name: 'Consumer Care Details', desc: 'Name, address, telephone, and email for consumer complaints.' },
  { id: 'Rule 6(10)', name: 'E-Commerce Declarations', desc: 'E-commerce entities must display mandatory declarations on the digital listing.' },
  { id: 'Rule 7', name: 'Principal Display Panel (PDP)', desc: 'Declarations must be grouped together on the PDP.' },
  { id: 'Rule 8', name: 'Declaration of Size', desc: 'Letters and numerals must meet minimum height requirements based on net quantity.' },
  { id: 'Rule 9', name: 'Manner of declaration', desc: 'Declarations must be legible, prominent, and in English or Hindi.' },
  { id: 'Rule 10', name: 'Declaration of name and address', desc: 'Detailed requirements for qualifying the manufacturer/packer address.' },
  { id: 'Rule 11', name: 'General provisions for Net Quantity', desc: 'Rules for declaring weight vs volume vs length vs number.' },
  { id: 'Rule 12', name: 'Declaration of quantity by weight', desc: 'Specifics on using kg, g, or mg.' },
  { id: 'Rule 13', name: 'Declaration of quantity by volume', desc: 'Specifics on using L, ml.' },
  { id: 'Rule 14', name: 'Declaration of quantity by length', desc: 'Specifics on using m, cm, mm.' },
  { id: 'Rule 15', name: 'Declaration of quantity by area', desc: 'Specifics on using sq. m, sq. cm.' },
  { id: 'Rule 16', name: 'Declaration of quantity by number', desc: 'Must use words "N" or "U".' },
  { id: 'Rule 17', name: 'Fractions of units', desc: 'Rules for rounding off non-integer quantities.' },
  { id: 'Rule 18', name: 'Declarations with respect to MRP', desc: 'Rounding off price and tax calculations.' },
  { id: 'Rule 19', name: 'Sale of commodities at lower price', desc: 'Promotional pricing must not obscure original MRP.' },
  { id: 'Rule 20', name: 'Wholesale Packages', desc: 'Different declaration requirements for wholesale vs retail packages.' },
  { id: 'Rule 21', name: 'Export Packages', desc: 'Exemptions and requirements for goods intended strictly for export.' },
  { id: 'Rule 22', name: 'Registration of Manufacturers/Packers', desc: 'Mandatory registration with the Director of Legal Metrology.' },
  { id: 'Rule 23', name: 'Registration of Importers', desc: 'Importers must register before packing/selling.' },
  { id: 'Rule 24', name: 'Objection to Registration', desc: 'Process for revoking or rejecting registration.' },
  { id: 'Rule 25', name: 'Maintenance of Records', desc: 'Registered entities must maintain packing/sales records.' },
  { id: 'Rule 26', name: 'Exemption in respect of certain packages', desc: 'Exempts very small packages (<10g/10ml) from certain declarations.' },
  { id: 'Rule 27', name: 'Registration of shorter address', desc: 'Approval required to use an abbreviated address.' },
  { id: 'Rule 28', name: 'Registration of shorter name', desc: 'Approval required to use an abbreviated name.' },
  { id: 'Rule 29', name: 'Penalty for contravention', desc: 'Fines and prosecution for violating the rules.' },
  { id: 'Rule 30', name: 'Compounding of offences', desc: 'Procedure for paying compounding fees in lieu of prosecution.' },
  { id: 'Rule 31', name: 'Power to remove difficulties', desc: 'Central Government authority to resolve ambiguities.' },
  { id: 'Rule 32', name: 'Repeal and savings', desc: 'Repeals the older Standards of Weights and Measures Rules, 1977.' },
];


export default function RulesPage() {
  const [rules, setRules] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('violated');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const API = process.env.NEXT_PUBLIC_API_URL || 'https://metrolens-backend.onrender.com/api/v1';
        const res = await fetch(`${API}/rules`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const statsRes = await fetch(`${API}/dashboard/stats`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (res.ok) {
          const json = await res.json();
          const d = json.data || json;
          setRules(Array.isArray(d) ? d : (d.rules || []));
        }
        if (statsRes.ok) {
          const sjson = await statsRes.json();
          setStats(sjson.data || sjson);
        }
      } catch {
        setRules([{ rule_id: 'C01', name: 'Product Name', description: 'Must have product name', severity: 'high', active: true }]);
      } finally { setLoading(false); }
    };
    fetchRules();
  }, [router]);

  if (loading) return <div className="min-h-screen bg-background text-text-primary animate-fade-in"><NavBar/><div className="p-10 text-text-secondary text-[14px]">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <NavBar />
      <div className="max-w-[1000px] mx-auto px-3 sm:px-6 py-4 sm:py-8 md:py-12">
        <h1 className="text-[22px] sm:text-[28px] md:text-[32px] font-medium tracking-tight leading-[1.1] mb-2">Rules Config</h1>
        <p className="text-xs sm:text-[15px] text-text-secondary mb-6 sm:mb-10">Manage Legal Metrology Act constraints.</p>

        <div className="flex gap-4 border-b border-border mb-6 sm:mb-8 overflow-x-auto scrollbar-none">
          <button 
            onClick={() => setActiveTab('violated')}
            className={`pb-3 text-xs sm:text-[14px] font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'violated' ? 'border-[#f87171] text-[#f87171]' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            System-Wide Violations
          </button>
          <button 
            onClick={() => setActiveTab('all')}
            className={`pb-3 text-xs sm:text-[14px] font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'all' ? 'border-blue-500 text-blue-500' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            All 2011 Act Rules
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeTab === 'violated' && rules
            .filter(r => {
              const isViolated = stats?.top_violated_rules?.some(tr => tr.rule_id === r.rule_id);
              return isViolated || r.severity === 'high';
            })
            .map((r, i) => {
              const violationStats = stats?.top_violated_rules?.find(tr => tr.rule_id === r.rule_id);
              return (
                <div key={i} className="glass border border-border/50 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 rounded-2xl sm:rounded-[24px] p-4 sm:p-6 flex flex-col group hover:border-mist transition-colors relative overflow-hidden">
                  {violationStats && (
                    <div className="absolute top-0 right-0 bg-[#f87171]/10 text-[#f87171] text-[10px] sm:text-[11px] font-bold px-2.5 sm:px-3 py-1 rounded-bl-lg">
                      Failed {violationStats.count} times
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-3 sm:mb-4 mt-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#4ade80]"></div>
                      <span className="font-mono text-xs sm:text-[13px] text-text-secondary">{r.rule_id}</span>
                    </div>
                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] sm:text-[10px] font-bold tracking-widest uppercase">AI Monitored</span>
                  </div>
                  <h3 className="font-medium text-[15px] sm:text-[16px] text-text-primary mb-1.5">{r.name}</h3>
                  <p className="text-xs sm:text-[14px] text-text-muted leading-relaxed mb-4 sm:mb-6 flex-1">{r.description}</p>
                  <div className="pt-3 sm:pt-4 border-t border-border flex justify-between items-center">
                    <span className={`text-[11px] sm:text-[12px] font-medium uppercase tracking-wider ${r.severity === 'high' ? 'text-[#f87171]' : 'text-text-secondary'}`}>{r.severity} severity</span>
                  </div>
                </div>
              );
          })}

          {activeTab === 'all' && FULL_2011_RULES.map((r, i) => {
            const isMonitored = rules.some(aiRule => aiRule.rule_id.includes(r.id) || r.id.includes(aiRule.rule_id));
            return (
              <div key={i} className="glass border border-border/50 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 rounded-2xl sm:rounded-[24px] p-4 sm:p-6 flex flex-col group hover:border-mist transition-colors">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-2 h-2 rounded-full ${isMonitored ? 'bg-[#4ade80]' : 'bg-text-muted'}`}></div>
                    <span className="font-mono text-xs sm:text-[13px] text-text-secondary">{r.id}</span>
                  </div>
                  <span className={isMonitored ? 'px-2.5 sm:px-3 py-0.5 sm:py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] sm:text-[10px] font-bold tracking-widest uppercase' : 'px-2.5 sm:px-3 py-0.5 sm:py-1 bg-text-muted/10 text-text-muted border border-border rounded-full text-[9px] sm:text-[10px] font-bold tracking-widest uppercase'}>{isMonitored ? 'AI Monitored' : 'Manual / Admin'}</span>
                </div>
                <h3 className="font-medium text-[15px] sm:text-[16px] text-text-primary mb-1.5">{r.name}</h3>
                <p className="text-xs sm:text-[14px] text-text-muted leading-relaxed mb-4 sm:mb-6 flex-1">{r.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
