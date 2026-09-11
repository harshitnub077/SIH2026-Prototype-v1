"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { triggerHaptic } from '@/utils/haptics';
import { openDB } from 'idb';
import NavBar from '@/components/NavBar';
import DynamicLoader from '@/components/DynamicLoader';
import { X, AlertTriangle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://metrolens-backend.onrender.com/api/v1';

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState('');
  const [sourceType, setSourceType] = useState('physical_label');
  const [logs, setLogs] = useState([]);
  const [errorBanner, setErrorBanner] = useState(null);



  const saveToSyncQueue = async (fileBlob, metadata) => {
    try {
      const db = await openDB('MetroLensDB', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('sync-queue')) {
            db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
          }
        },
      });
      await db.add('sync-queue', { file: fileBlob, metadata, status: 'pending', timestamp: Date.now() });
    } catch (e) {
      console.error('IDB Error', e);
    }
  };

  const handleFile = (e) => {
    triggerHaptic('medium');
    const selected = e.target.files?.[0];
    if (selected && files.length < 3) {
      setFiles(prev => [...prev, selected]);
      setPreviews(prev => [...prev, URL.createObjectURL(selected)]);
    }
    // reset input so the same file can be selected again if needed
    e.target.value = null;
  };

  const removeFile = (index) => {
    URL.revokeObjectURL(previews[index]); // prevent memory leak
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const stitchImages = async (imageFiles) => {
    if (imageFiles.length === 0) return null;
    
    
    const loadImg = (f) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = URL.createObjectURL(f);
    });

    const imgs = await Promise.all(imageFiles.map(loadImg));
    
    // Calculate original sizes
    const origTotalWidth = imgs.reduce((sum, img) => sum + img.width, 0);
    const origMaxHeight = Math.max(...imgs.map(img => img.height));

    // Calculate scaling factor to prevent massive files (max 1500px height)
    const MAX_HEIGHT = 1500;
    const scale = origMaxHeight > MAX_HEIGHT ? MAX_HEIGHT / origMaxHeight : 1;
    
    const finalWidth = Math.floor(origTotalWidth * scale);
    const finalHeight = Math.floor(origMaxHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, finalWidth, finalHeight);

    let currentX = 0;
    imgs.forEach(img => {
      const drawWidth = Math.floor(img.width * scale);
      const drawHeight = Math.floor(img.height * scale);
      ctx.drawImage(img, currentX, 0, drawWidth, drawHeight);
      currentX += drawWidth;
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(new File([blob], "stitched_label.jpg", { type: "image/jpeg" }));
      }, 'image/jpeg', 0.7);
    });
  };

  const extractErrorMessage = (err) => {
    if (!err) return 'An unexpected error occurred';
    if (typeof err === 'string') return err;
    if (err instanceof Error) {
      return (typeof err.message === 'string' && err.message !== '[object Object]') ? err.message : 'Upload failed. Please check image format.';
    }
    if (typeof err === 'object') {
      if (typeof err.message === 'string') return err.message;
      if (typeof err.error === 'string') return err.error;
      if (typeof err.error === 'object' && err.error !== null) {
        return err.error.message || err.error.code || 'Encountered upload validation error';
      }
      return err.code || 'Upload request failed';
    }
    return String(err);
  };

  const loadSampleLabel = async () => {
    try {
      const toastId = toast.loading('Loading verified physical test label...');
      const res = await fetch('/test-label.jpg');
      if (!res.ok) throw new Error('Sample image not found on server');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'crispy_wave_potato_chips_label.jpg', { type: 'image/jpeg' });
      setFiles([sampleFile]);
      setPreviews([URL.createObjectURL(sampleFile)]);
      setProductName('Crispy Wave Potato Chips');
      setSourceType('physical_label');
      toast.success('Sample Regulatory Label loaded. Click "Run Compliance Check".', { id: toastId });
    } catch (e) {
      toast.error('Could not load sample label: ' + e.message);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) return toast.error('No image selected. Please take a photo or select an image.');
    
    setLoading(true);
    const toastId = toast.loading(files.length > 1 ? 'Processing multi-angle context...' : 'Initializing compliance scan...');
    const metadata = { productName: productName || 'Unknown', sourceType, timestamp: new Date().toISOString() };
    
    try {
      setLogs([
        '> Image payload registered in memory buffer',
        '> Sending to Legal Metrology Ingestion Gateway...'
      ]);

      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      formData.append('product_name', productName || '');
      formData.append('source_type', sourceType || 'physical_label');
      formData.append('metadata', JSON.stringify(metadata));

      const token = (typeof window !== 'undefined') 
        ? (sessionStorage.getItem('token') || localStorage.getItem('token')) 
        : null;
      const res = await fetch(`${API}/scans`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      
      const json = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        const errorMsg = extractErrorMessage(json.error || json.message || json);
        throw new Error(errorMsg);
      }
      
      const responseData = json.data || json;
      const batchId = responseData.batch_id || responseData.id || responseData.scan_id;
      
      if (!batchId) {
        toast.warning('Scan submitted. Check history for results.', { id: toastId });
        setTimeout(() => router.push('/history'), 1500);
        return;
      }

      setLogs(prev => [...prev, `> Batch assigned: ${batchId.slice(0, 8)}...`, '> Executing AI OCR & Legal Metrology extraction pipeline...']);

      let completed = false;

      // 1. Setup real-time SSE stream for high-speed live progress updates
      let sse = null;
      try {
        const sseUrl = `${API}/scans/batch/${batchId}/stream?token=${token || ''}`;
        sse = new EventSource(sseUrl);
        
        sse.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'progress') {
              setLogs(prev => [...prev, `> ${data.message}`]);
            } else if (data.status === 'complete' || data.status === 'completed') {
              if (completed) return;
              completed = true;
              sse.close();
              toast.success('Scan complete', { id: toastId });
              router.push(`/results/${data.scanId || batchId}`);
            } else if (data.status === 'failed') {
              if (completed) return;
              completed = true;
              sse.close();
              const failMsg = extractErrorMessage(data.errorMessage || 'Scan processing failed');
              setLogs(prev => [...prev, `> REJECTED: ${failMsg}`]);
              setErrorBanner(failMsg);
              toast.error('Scan rejected: ' + failMsg, { id: toastId });
              setLoading(false);
            }
          } catch (e) {
            // ignore JSON parse error in ping
          }
        };

        sse.onerror = () => {
          if (sse) sse.close();
        };
      } catch (e) {
        // SSE unsupported or blocked, fallback to polling
      }

      // 2. Setup parallel polling interval to guarantee completion detection
      let attempts = 0;
      const maxAttempts = 120; // 120 seconds max for free tier cold starts
      const progressSteps = [
        'Multimodal Vision & OCR token extraction running...',
        'Auditing declarations against Legal Metrology Rules, 2011...',
        'Verifying ISO/IEC 17025 guard-bands & Rule 7/8/9 geometry...',
        'Generating Section 48 compounding notice & statutory ledger...'
      ];

      const pollInterval = setInterval(async () => {
        if (completed) {
          clearInterval(pollInterval);
          return;
        }

        attempts++;
        if (attempts > maxAttempts) {
          clearInterval(pollInterval);
          if (sse) sse.close();
          setLoading(false);
          toast.error('Scan timed out. Please check your history.', { id: toastId });
          return;
        }

        try {
          const pollRes = await fetch(`${API}/scans/batch/${batchId}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });

          if (!pollRes.ok) return;
          const pollJson = await pollRes.json();
          const batchData = pollJson.data || pollJson;

          const firstScan = (batchData.scans && batchData.scans.length > 0) ? batchData.scans[0] : null;
          const isComplete = batchData.status === 'complete' || batchData.status === 'completed' || (firstScan && firstScan.status === 'complete');

          if (isComplete) {
            if (completed) return;
            completed = true;
            clearInterval(pollInterval);
            if (sse) sse.close();
            
            const targetId = (firstScan && firstScan.id) ? firstScan.id : batchId;
            
            setLogs(prev => [...prev, '> Compliance report generated successfully!']);
            toast.success('Scan complete', { id: toastId });
            router.push(`/results/${targetId}`);
          } else if (batchData.status === 'failed') {
            if (completed) return;
            completed = true;
            clearInterval(pollInterval);
            if (sse) sse.close();
            setLoading(false);
            const failMsg = extractErrorMessage(batchData.error_message || batchData.errorMessage || 'Scan processing failed');
            setLogs(prev => [...prev, `> REJECTED: ${failMsg}`]);
            setErrorBanner(failMsg);
            toast.error('Scan rejected: ' + failMsg, { id: toastId });
          } else {
            // Processing: show informative progressive steps every 4 seconds
            if (attempts % 4 === 0) {
              const stepIdx = Math.floor(attempts / 4) - 1;
              if (stepIdx < progressSteps.length) {
                const stepMsg = `> ${progressSteps[stepIdx]}`;
                setLogs(prev => prev.includes(stepMsg) ? prev : [...prev, stepMsg]);
              }
            }
          }
        } catch (err) {
          // network glitch, retry next tick
        }
      }, 1000);

    } catch (err) {
      const displayMsg = extractErrorMessage(err);
      toast.error(displayMsg, { id: toastId });
      setErrorBanner(displayMsg);
      setLoading(false);
      setLogs(prev => [...prev, `> REJECTED: ${displayMsg}`]);
      if (files[0]) {
        saveToSyncQueue(files[0], metadata).catch(console.error);
      }
    }
  };

  useEffect(() => {
    // Real SSE telemetry handles this now.
  }, [loading]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {loading && <div className="fixed inset-0 z-[99999] bg-background flex items-center justify-center"><DynamicLoader /></div>}
      <NavBar />
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-28 md:pb-12">
        <h1 className="text-2xl sm:text-[32px] font-bold tracking-tight leading-[1.15] mb-1.5">Initialize Scan</h1>
        <p className="text-xs sm:text-[15px] text-text-secondary mb-6 flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span> 
          <span>Inspection Pipeline Active &middot; Awaiting packaging payload</span>
        </p>

        {errorBanner && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-3.5 mb-6 animate-in fade-in slide-in-from-top-2">
            <AlertTriangle size={22} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="flex-1">
              <p className="font-bold text-[15px] tracking-tight">Inspection Quality Gate Rejection</p>
              <div className="text-xs mt-2 leading-relaxed whitespace-pre-line font-mono bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-rose-500/20">
                {errorBanner}
              </div>
              <p className="text-[11.5px] text-text-secondary mt-2.5 font-sans leading-normal">
                Statutory Mandate: Legal Metrology (Packaged Commodities) Rules, 2011 apply exclusively to physical packaged commodities. Uploading non-packaging subjects is halted at the quality gate to prevent false evaluations.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <form onSubmit={handleUpload} className="mello-card p-4 sm:p-6 md:p-8 col-span-1 md:col-span-3 flex flex-col gap-4 sm:gap-6 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs bg-white dark:bg-[#0D1A2D]">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono tracking-[0.2em] uppercase text-text-primary">Product Image</label>
              <div className="relative w-full flex-1 min-h-[200px] border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 flex flex-col items-center justify-center rounded-2xl transition-colors bg-slate-50/70 dark:bg-slate-900/40 p-4">
                {previews.length > 0 ? (
                  <div className="w-full flex flex-col gap-4">
                    <div className="text-[13px] text-text-secondary text-center">
                      Added {previews.length} of 3 photos. AI will synthesize all angles.
                    </div>
                    <div className="flex flex-wrap gap-3 sm:gap-4 justify-center items-center">
                      {previews.map((src, i) => (
                        <div key={i} className="relative w-[90px] sm:w-[100px] h-[130px] sm:h-[140px] border border-border rounded-lg overflow-hidden group/img shadow-sm">
                          <img src={src} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-90 sm:opacity-0 sm:group-hover/img:opacity-100 transition-opacity z-20 hover:scale-110 cursor-pointer">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      
                      {previews.length < 3 && (
                        <div className="flex flex-col gap-2.5 w-[90px] sm:w-[100px] h-[130px] sm:h-[140px]">
                          <div className="relative h-1/2 rounded-lg border border-border bg-background flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted mb-1"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            <span className="text-[10px] font-medium text-text-secondary">+ Camera</span>
                            <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          </div>
                          <div className="relative h-1/2 rounded-lg border border-border bg-background flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted mb-1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            <span className="text-[10px] font-medium text-text-secondary">+ Gallery</span>
                            <input type="file" accept="image/*" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 relative z-10 w-full py-4 sm:py-6 text-center">
                     <span className="text-xs sm:text-sm font-semibold text-slate-500 max-w-sm px-2">Capture product label clearly. Make sure all declarations are readable.</span>
                     <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full justify-center px-2">
                       
                       <div className="relative overflow-hidden mello-btn-secondary !bg-surface !border-border !px-4 !py-3 flex flex-col items-center gap-2 hover:!border-primary cursor-pointer flex-1 min-w-[120px] max-w-[160px] shadow-xs rounded-xl">
                         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                         <span className="text-xs font-semibold text-text-primary">Take Photo</span>
                         <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                       </div>

                       <div className="relative overflow-hidden mello-btn-secondary !bg-surface !border-border !px-4 !py-3 flex flex-col items-center gap-2 hover:!border-primary cursor-pointer flex-1 min-w-[120px] max-w-[160px] shadow-xs rounded-xl">
                         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                         <span className="text-xs font-semibold text-text-primary">Gallery</span>
                         <input type="file" accept="image/*" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                       </div>

                     </div>
                      
                      <div className="mt-2 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 w-full flex justify-center">
                        <button
                          type="button"
                          onClick={loadSampleLabel}
                          className="text-[11px] font-mono tracking-wider uppercase text-primary dark:text-blue-400 hover:underline flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-primary/5 dark:bg-blue-400/10 border border-primary/20 dark:border-blue-400/20 transition-all cursor-pointer text-center"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                          <span>Load Sample Test Label (Chips)</span>
                        </button>
                      </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono tracking-[0.2em] uppercase text-text-primary">Product Name (Optional)</label>
                <input type="text" className="mello-input text-base sm:text-sm" placeholder="e.g. Organic Honey" value={productName} onChange={e => setProductName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono tracking-[0.2em] uppercase text-text-primary">Source Type</label>
                <select className="mello-input appearance-none text-base sm:text-sm" value={sourceType} onChange={e => setSourceType(e.target.value)}>
                  <option value="physical_label">Physical Label (Package)</option>
                  <option value="ecommerce_listing">E-Commerce Listing</option>
                </select>
              </div>
            </div>

            <button type="submit" className="mello-btn-primary w-full h-[52px] sm:h-[48px] text-sm sm:text-base font-bold shadow-md active-press rounded-xl" disabled={loading}>
              {loading ? 'Processing scan...' : 'Run Compliance Check'}
            </button>
          </form>

          <div className="mello-card-flat p-4 sm:p-6 col-span-1 md:col-span-2 flex flex-col h-[260px] md:h-[480px] bg-white dark:bg-[#0D1A2D] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <h3 className="text-xs sm:text-sm font-bold tracking-tight mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-[#4ade80] animate-pulse' : 'bg-slate-400'}`}></div>
              Processing Steps
            </h3>
            <div className="flex-1 font-mono text-[11px] sm:text-[12px] allow-select cursor-text leading-relaxed text-text-muted flex flex-col gap-2 overflow-y-auto bg-slate-50 dark:bg-slate-950/60 rounded-xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-inner">
              {!loading && logs.length === 0 && <span>Awaiting input payload...</span>}
              {logs.map((log, i) => (
                <span key={i} className="text-slate-700 dark:text-slate-300 font-medium animate-in fade-in slide-in-from-bottom-2 duration-300">{log}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
