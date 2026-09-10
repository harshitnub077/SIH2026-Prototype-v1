'use client';
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';
import DynamicLoader from '@/components/DynamicLoader';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Package, AlertTriangle } from 'lucide-react';

export default function BatchPage({ params }) {
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState(null);
  const router = useRouter();
  
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://metrolens-backend.onrender.com/api/v1';

  useEffect(() => {
    params.then(p => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;
    if (!sessionStorage.getItem('token')) return router.push('/login');
    
          // Fetch initial state
      let eventSource;
      const fetchBatch = async () => {
        try {
          const res = await fetch(`${API}/scans/batch/${resolvedParams.id}`, {
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
          });
          if (!res.ok) throw new Error('Failed to fetch batch');
          const json = await res.json();
          const data = json.data || json;
          
          setBatch(data);
          
          if (data.status === 'processing') {
            // Setup real-time SSE stream for updates instead of polling
            const token = sessionStorage.getItem('token');
            eventSource = new EventSource(`${API}/scans/batch/${resolvedParams.id}/stream?token=${token}`);
            
            eventSource.onmessage = (event) => {
              const streamData = JSON.parse(event.data);
              if (streamData.status !== 'processing') {
                eventSource.close();
                fetchBatch(); // Re-fetch to get the final complete data
              }
            };

            eventSource.onerror = () => {
              eventSource.close();
              // Fallback to polling if SSE fails
              setTimeout(fetchBatch, 3000);
            };
          } else if (data.status === 'complete' || data.status === 'completed') {
              if (data.scans && data.scans.length === 1) {
                router.push(`/results/${data.scans[0].id}`);
              } else {
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
        } catch(err) {
          setLoading(false);
          toast.error('Failed to load scan batch');
        }
      };

      fetchBatch();
      
      return () => { if (eventSource) eventSource.close(); };
  }, [resolvedParams, router]);

  if (!resolvedParams) return null;

  return (
    <div className="min-h-screen pb-20">
      <NavBar />
      <main className="max-w-3xl mx-auto px-3 sm:px-4 mt-6 sm:mt-8">
        
        {loading || batch?.status === 'processing' ? (
<div className="flex flex-col items-center justify-center min-h-[70vh] px-4 w-full">
              <DynamicLoader />
          </div>
          ) : batch?.status === 'failed' ? (
           <div className="flex flex-col items-center justify-center py-20 sm:py-32 text-center px-2">
              {batch?.error_message === 'SINGLE_IMAGE_MULTIPLE_PRODUCTS' ? (
                  <>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6 mx-auto border border-blue-500/20">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    </div>
                    <h2 className="text-lg sm:text-[22px] font-medium text-text-primary mb-2">Multiple Products Detected</h2>
                    <p className="text-xs sm:text-sm text-text-secondary mb-6 max-w-md mx-auto">More than one product was detected in this photo. To maintain an accurate legal chain of evidence, please scan only one product at a time.</p>
                  </>
                ) : batch?.error_message === 'MULTIPLE_IMAGES_MULTIPLE_PRODUCTS' ? (
                  <>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 mx-auto border border-amber-500/20">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                    </div>
                    <h2 className="text-lg sm:text-[22px] font-medium text-text-primary mb-2">Please Scan One Item At A Time</h2>
                    <p className="text-xs sm:text-sm text-text-secondary mb-6 max-w-md mx-auto">You uploaded photos of different products. The AI requires all photos in a single batch to be of the same item (e.g., front and back of the same bottle).</p>
                  </>
               ) : (
                 <>
                   <h2 className="text-lg sm:text-[22px] font-medium text-red-500 mb-2">Scan Failed</h2>
                   <p className="text-xs sm:text-sm text-text-secondary mb-6">{batch?.error_message || "We could not process this image. Please try again."}</p>
                 </>
               )}
             <button onClick={() => router.push('/upload')} className="mello-btn-secondary">Try Another Image</button>
           </div>
        ) : (
          <div className="animate-fade-in">
            <div className="mb-6 sm:mb-8 text-center">
              <h1 className="text-xl sm:text-[28px] font-medium tracking-tight text-text-primary mb-2">
                Products Detected: {batch?.scans?.length || 0}
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary">
                Select a product below to view its full compliance report and legal analysis.
              </p>
            </div>
            
            <div className="space-y-4">
              
              {batch?.scans?.length === 0 && batch?.status === 'completed' && (
                <div className="flex flex-col items-center justify-center py-16 bg-surface/30 rounded-2xl border border-border mt-8 p-4">
                  <Package className="w-12 h-12 sm:w-14 sm:h-14 text-text-muted/40 mb-4" />
                  <h3 className="text-lg sm:text-xl font-medium text-text-primary mb-2">No FMCG Products Detected</h3>
                  <p className="text-xs sm:text-sm text-text-secondary text-center max-w-sm">
                    The AI could not identify any valid consumer packaging in this image. Please ensure the label is clearly visible and try again.
                  </p>
                  <button onClick={() => router.push('/upload')} className="mello-btn-secondary mt-6">Scan New Image</button>
                </div>
              )}
              {batch?.scans?.map((scan, i) => (
                <div 
                  key={scan.id} 
                  onClick={() => router.push(`/results/${scan.id}`)}
                  className="bg-surface/50 border border-border rounded-xl p-4 sm:p-6 hover:border-accent/50 cursor-pointer transition-all flex flex-col gap-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                    <div>
                      <h3 className="text-base sm:text-[18px] font-medium text-text-primary mb-1 flex flex-wrap items-center gap-1.5">
                        <span>{scan.product_name || 'Unknown Product'}</span>
                        {(scan.extracted_fields?.is_wholesale_or_multipiece_package === 'true' || scan.extracted_fields?.is_wholesale_or_multipiece_package === true) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 align-middle uppercase tracking-wider">
                            Wholesale
                          </span>
                        )}
                        {scan.extracted_fields?._quality_warning && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 align-middle uppercase tracking-wider">
                            <AlertTriangle className="w-3 h-3 mr-1 inline" /> Poor Quality
                          </span>
                        )}
                      </h3>
                      <p className="text-xs sm:text-[14px] text-text-secondary">
                        {scan.brand_name || 'No Brand'}
                      </p>
                    </div>
                    <div className="self-start sm:self-center">
                      <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-[12px] font-medium border ${
                        scan.overallStatus === 'PASS' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        scan.overallStatus === 'POTENTIAL NON-COMPLIANCE' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        scan.overallStatus === 'MANUAL REVIEW' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-border text-text-secondary border-border'
                      }`}>
                        {scan.overallStatus}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-xs sm:text-[13px] text-text-muted">
                     <span>Score: {scan.compliance_score}%</span>
                     <span className="text-accent group-hover:underline">View Report &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
