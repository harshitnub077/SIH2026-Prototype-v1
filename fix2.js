const fs = require('fs');
let s = fs.readFileSync('frontend/app/upload/page.jsx', 'utf8');

const fetchStartIdx = s.indexOf('      const res = await fetch(`${API}/scans`, {');
const clearIntervalIdx = s.indexOf('return () => clearInterval(interval);');
const fetchEndIdx = s.indexOf('  }, [loading]);', clearIntervalIdx);

if (fetchStartIdx === -1 || fetchEndIdx === -1) {
   console.log('Failed to find indices!', fetchStartIdx, fetchEndIdx);
   process.exit(1);
}

const before = s.slice(0, fetchStartIdx);
const after = s.slice(fetchEndIdx);

const replacement = `      const res = await fetch(\`\${API}/scans\`, {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${sessionStorage.getItem('token')}\` },
        body: formData
      });
      if (!res.ok) throw new Error("API Error");
      const json = await res.json();
      const responseData = json.data || json;
      
      const batchId = responseData.batch_id || responseData.id || responseData.scan_id;
      if (!batchId) {
        toast.warning('Scan submitted. Check history for results.', { id: toastId });
        setTimeout(() => router.push('/history'), 1500);
        return;
      }

      // Connect to true SSE stream
      const sseUrl = \`\${API}/scans/batch/\${batchId}/stream?token=\${sessionStorage.getItem('token')}\`;
      const sse = new EventSource(sseUrl);
      
      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'progress') {
            setLogs(prev => [...prev, \`> \${data.message}\`]);
          } else if (data.status === 'complete' || data.status === 'completed') {
            sse.close();
            toast.success('Scan complete', { id: toastId });
            router.push(\`/results/\${data.scanId || batchId}\`);
          } else if (data.status === 'failed') {
            sse.close();
            setLogs(prev => [...prev, \`> ERROR: \${data.errorMessage || 'Scan failed'}\`]);
            toast.error('Scan failed', { id: toastId });
            setLoading(false);
          }
        } catch (e) {
          // ignore
        }
      };
      
      sse.onerror = () => {
        sse.close();
        setTimeout(() => router.push(\`/results/\${batchId}\`), 2000);
      };

    } catch (err) {
      await saveToSyncQueue(files[0], metadata);
      toast.warning('Network Offline', { id: toastId, description: 'Scan queued locally.' });
      setTimeout(() => router.push('/dashboard'), 3000); 
    }
  };

  useEffect(() => {
    // Real SSE telemetry handles this now.
`;

fs.writeFileSync('frontend/app/upload/page.jsx', before + replacement + after);
console.log('Successfully injected SSE upload telemetry!');
