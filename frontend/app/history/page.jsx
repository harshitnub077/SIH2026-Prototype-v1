"use client";
import { useEffect, useState, useCallback } from 'react';
import NavBar from '@/components/NavBar';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://metrolens-backend.onrender.com/api/v1';

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 transition-all">
      <div className="bg-[var(--color-surface)] rounded-[24px] p-6 max-w-sm w-full border border-[var(--color-border)] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Red accent bar at the top for destructive action */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
        
        <h3 className="text-[18px] font-bold text-[var(--color-text-primary)] mt-1 mb-2">Delete Scan Record?</h3>
        <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)] mb-8">
          This action cannot be undone. The scan data, identified violations, and associated reports will be permanently erased.
        </p>
        
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] text-[14px] font-semibold hover:bg-[var(--color-background)] active:scale-95 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-[14px] font-bold hover:bg-red-600 shadow-[0_4px_14px_rgba(239,68,68,0.4)] active:scale-95 transition-all">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = String(status || '').toUpperCase();
  let cls = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  let label = s || 'UNKNOWN';
  if (s === 'PASS' || s === 'COMPLIANT')                         { cls = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'; label = 'PASS'; }
  else if (s === 'POTENTIAL NON-COMPLIANCE' || s === 'FAIL')     { cls = 'bg-red-500/10 text-red-500 border-red-500/20'; label = 'NON-COMPLIANT'; }
  else if (s === 'MANUAL REVIEW' || s === 'NEEDS_REVIEW')        { cls = 'bg-amber-500/10 text-amber-500 border-amber-500/20'; label = 'REVIEW'; }
  else if (s === 'PROCESSING')                                    { cls = 'bg-blue-500/10 text-blue-500 border-blue-500/20'; label = 'PROCESSING'; }
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border shadow-sm ${cls}`}>{label}</span>;
}

// ─── Status filter options ────────────────────────────────────────────────────
const FILTERS = [
  { label: 'All',          value: '' },
  { label: 'Non-Compliant', value: 'POTENTIAL NON-COMPLIANCE' },
  { label: 'Review',       value: 'MANUAL REVIEW' },
  { label: 'Passed',       value: 'PASS' },
];

export default function HistoryPage() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState(null); // ID pending delete confirmation
  const router = useRouter();

  // Debounce search
  useEffect(() => {
    const h = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(1); }, 500);
    return () => clearTimeout(h);
  }, [searchQuery]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [statusFilter]);

  // CSV Export
  const exportToCSV = () => {
    if (scans.length === 0) return toast.error('No data to export');
    const headers = ['Scan ID', 'Product Name', 'Brand', 'Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...scans.map(s => {
        const name = (s.product_name || s.product?.product_name || 'Unknown').replace(/,/g, '');
        const brand = (s.brand_name || s.product?.brand_name || '').replace(/,/g, '');
        const date = new Date(s.createdAt || s.created_at).toLocaleDateString();
        const status = s.overall_compliance || s.status || 'UNKNOWN';
        return `${s.id},${name},${brand},${date},${status}`;
      })
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MetroLens_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  // Confirm delete
  const confirmDelete = async () => {
    const id = deleteId;
    setDeleteId(null);
    try {
      const res = await fetch(`${API}/scans/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      if (res.ok) {
        setScans(prev => prev.filter(s => s.id !== id));
        toast.success('Scan deleted.');
      } else {
        toast.error('Failed to delete scan.');
      }
    } catch {
      toast.error('Error deleting scan.');
    }
  };

  // Fetch scans with pagination + filter
  const fetchScans = useCallback(async () => {
    if (!sessionStorage.getItem('token') && !localStorage.getItem('token')) {
      sessionStorage.setItem('token', 'demo-officer-token');
      sessionStorage.setItem('email', 'officer@doca.gov.in');
      sessionStorage.setItem('role', 'officer');
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${API}/scans?${params}`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('API Error');
      const json = await res.json();
      const d = json.data || json;
      setScans(Array.isArray(d) ? d : (d.scans || []));
      setTotalPages(d.total_pages || 1);
    } catch {
      setScans([]);
    } finally {
      setLoading(false);
    }
  }, [router, debouncedSearch, statusFilter, page]);

  useEffect(() => { fetchScans(); }, [fetchScans]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {deleteId && <DeleteModal onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />}
      <NavBar />
      <div className="max-w-[1000px] mx-auto px-3 sm:px-6 py-4 sm:py-8 md:py-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
          <div>
            <h1 className="text-[22px] sm:text-[26px] md:text-[32px] font-medium tracking-tight leading-[1.1] mb-2">Scan Repository</h1>
            <p className="text-xs sm:text-[15px] text-text-secondary">Historical record of all compliance checks.</p>
          </div>
          <button onClick={exportToCSV} className="mello-btn-secondary whitespace-nowrap flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl w-full sm:w-auto text-xs sm:text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export to CSV
          </button>
        </div>

        {/* Search */}
        <div className="mb-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-text-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <input
            type="text"
            placeholder="Search by product name, brand, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mello-input w-full pl-10 sm:pl-11 py-2.5 sm:py-3 border rounded-xl bg-transparent text-base sm:text-sm"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1.5 scrollbar-none touch-pan-x -mx-1 px-1">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`shrink-0 px-3.5 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase border transition-colors ${
                statusFilter === f.value
                  ? 'bg-accent text-white border-accent'
                  : 'border-border text-text-secondary hover:border-accent hover:text-accent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Scan Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[180px] rounded-[24px] bg-surface/50 animate-pulse border border-border" />
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <svg className="mx-auto mb-4 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <p className="text-[15px]">No scans found{debouncedSearch ? ` for "${debouncedSearch}"` : ''}.</p>
            <button onClick={() => router.push('/upload')} className="mt-4 mello-btn-primary px-6 py-2 text-[13px]">Start a Scan</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {scans.map((s) => {
              const statusStr = s.overall_compliance || s.overallStatus || s.status;
              const sUpper = String(statusStr || '').toUpperCase();
              const glowColor = sUpper === 'PASS' || sUpper === 'COMPLIANT' ? 'bg-emerald-500'
                : sUpper === 'MANUAL REVIEW' ? 'bg-amber-500'
                : sUpper === 'PROCESSING' ? 'bg-blue-500'
                : 'bg-red-500';

              return (
                <div
                  key={s.id}
                  className="group relative flex flex-col bg-surface/50 dark:bg-white/[0.02] border border-border rounded-2xl sm:rounded-[24px] p-4 sm:p-6 hover:border-accent hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                  onClick={() => s.id && router.push(`/results/${s.id}`)}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-[50px] opacity-20 transition-opacity group-hover:opacity-40 ${glowColor}`} />

                  <div className="flex items-start justify-between mb-5 sm:mb-8 relative z-10">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-[16px] bg-background border border-border flex items-center justify-center shadow-sm">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-secondary"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    </div>
                    <StatusBadge status={statusStr} />
                  </div>

                  <div className="relative z-10 flex-grow">
                    <h3 className="text-[18px] font-bold tracking-tight text-text-primary mb-1 line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                      {s.product_name || s.product?.product_name || 'Unknown Product'}
                    </h3>
                    <p className="text-[13px] text-text-muted font-medium mb-6">
                      {s.brand_name || s.product?.brand_name || `ID: ${s.id?.substring(0, 8)}`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/50 relative z-10">
                    <div className="flex items-center gap-2 text-[12px] font-medium text-text-secondary">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      {new Date(s.createdAt || s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteId(s.id); }}
                      className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-text-muted hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-colors"
                      title="Delete Scan"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-border text-[13px] font-medium text-text-secondary hover:border-accent hover:text-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              ← Prev
            </button>
            <span className="text-[13px] text-text-muted font-mono">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-border text-[13px] font-medium text-text-secondary hover:border-accent hover:text-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              Next →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}