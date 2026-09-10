const fs = require('fs');

let content = fs.readFileSync('frontend/app/upload/page.jsx', 'utf8');

const oldFetchBlock = `      const res = await fetch(\`\${API}/scans\`, {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${sessionStorage.getItem('token')}\` },
        body: formData
      });
      if (!res.ok) throw new Error("API Error");
      const json = await res.json();
      const responseData = json.data || json;
      
      toast.success('Scan complete', { id: toastId });
      const scanId = responseData.scan_id || responseData.id || responseData.batch_id;
      if (scanId) {
        setTimeout(() => router.push(\`/results/\${scanId}\`), 1000);
      } else {
        toast.warning('Scan submitted. Check history for results.', { id: toastId });
        setTimeout(() => router.push('/history'), 1500);
      }
    } catch (err) {
      await saveToSyncQueue(files[0], metadata);
      toast.warning('Network Offline', { id: toastId, description: 'Scan queued locally.' });
      setTimeout(() => router.push('/dashboard'), 3000); 
    }
  };

  useEffect(() => {
    if (loading) {
      const msgs = ['Initializing Vision Engine...', 'Detecting bounding boxes...', 'Extracting textual tokens...', 'Applying Legal Metrology Act...', 'Computing compliance vectors...'];
      let i = 0;
      const interval = setInterval(() => {
        if (i < msgs.length) {
          setLogs(prev => [...prev, \`> \${msgs[i]}\`]);
          i++;
        }
      }, 800);
      return () => clearInterval(interval);
    }
  }, [loading]);`;

const newFetchBlock = `      const res = await fetch(\`\${API}/scans\`, {
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
  }, [loading]);`;

content = content.replace(oldFetchBlock, newFetchBlock);
fs.writeFileSync('frontend/app/upload/page.jsx', content);
console.log('Success');
