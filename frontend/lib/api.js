// frontend/lib/api.js
// ============================================================
// API client — MetroLens backend
// Updated for Spec 05:
//   - Base URL: /api/v1
//   - Response envelope: { data: {...} } unwrapped automatically
//   - Error envelope: { error: { code, message } }
//   - Async scan: upload returns scan_id immediately → poll until complete
//   - New: rules endpoint, report generation
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://metrolens-backend.onrender.com/api/v1';

// ─── AUTH TOKEN ──────────────────────────────────────────────────────────────
function getToken() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('token') || localStorage.getItem('token') || localStorage.getItem('metrolens_token');
}

// ─── BASE FETCH ───────────────────────────────────────────────────────────────
// Unwraps { data } envelope automatically.
// Throws structured { message, code } error on failure.
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  // Parse response body
  let body;
  try {
    body = await res.json();
  } catch {
    body = { error: { code: 'PARSE_ERROR', message: 'Invalid JSON response from server' } };
  }

  if (!res.ok) {
    // Spec 05 error envelope: { error: { code, message } }
    const errObj = body?.error || {};
    const err = Object.assign(
      new Error(errObj.message || body?.error || `Request failed: ${res.status}`),
      { code: errObj.code || 'HTTP_ERROR', status: res.status, response: { data: body } }
    );
    throw err;
  }

  // Unwrap { data: ... } envelope — return inner data directly
  return body?.data !== undefined ? body.data : body;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const auth = {
  login: (email, password) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name, email, password) =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
};

// ─── SCANS ────────────────────────────────────────────────────────────────────
export const scans = {
  /**
   * Upload image — returns immediately with { scan_id, status: "processing" }.
   * Use scans.pollUntilComplete(scanId) to wait for the pipeline to finish.
   *
   * @param {File} imageFile
   * @param {{ sourceType?, productName?, brandName? }} opts
   */
  upload: async (imageFile, opts = {}) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('source_type', opts.sourceType || 'physical_label');
    if (opts.productName) formData.append('product_name', opts.productName);
    if (opts.brandName)   formData.append('brand_name',   opts.brandName);

    return apiFetch('/scans', { method: 'POST', body: formData });
  },

  /**
   * Poll GET /scans/:id every intervalMs until status !== "processing".
   * Calls onProgress(scan) on each poll.
   * Rejects after maxWaitMs (default 3 minutes).
   */
  pollUntilComplete: (scanId, { onProgress, intervalMs = 2000, maxWaitMs = 180000 } = {}) => {
    return new Promise((resolve, reject) => {
      const start = Date.now();

      const poll = async () => {
        try {
          const scan = await apiFetch(`/scans/${scanId}`);
          onProgress?.(scan);

          if (scan.status !== 'processing') {
            resolve(scan);
          } else if (Date.now() - start > maxWaitMs) {
            reject(Object.assign(
              new Error('Scan processing timed out after 3 minutes. Please try again.'),
              { code: 'POLL_TIMEOUT' }
            ));
          } else {
            setTimeout(poll, intervalMs);
          }
        } catch (err) {
          reject(err);
        }
      };

      poll();
    });
  },

  list: ({ page = 1, limit = 20, status, compliance, search } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (status)     params.set('status',     status);
    if (compliance) params.set('compliance', compliance);
    if (search)     params.set('search',     search);
    return apiFetch(`/scans?${params}`);
  },

  get:    (id) => apiFetch(`/scans/${id}`),

  delete: (id) => apiFetch(`/scans/${id}`, { method: 'DELETE' }),

  /** Generate PDF report for a scan. Returns { report_id, file_url } */
  generateReport: (scanId) =>
    apiFetch(`/scans/${scanId}/report`, { method: 'POST' }),
};

// ─── REPORTS ─────────────────────────────────────────────────────────────────
export const reports = {
  /**
   * Download PDF report by report ID.
   * Triggers browser download.
   */
  downloadById: async (reportId, scanId) => {
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const url = `${BASE_URL}/reports/${reportId}/download`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Report download failed');

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `compliance_report_${(scanId || reportId).slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  },

  /**
   * Legacy: download by scan ID (redirects to latest report).
   * Kept for components that haven't been updated yet.
   */
  download: async (scanId) => {
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // First generate/get the report
    try {
      const reportData = await apiFetch(`/scans/${scanId}/report`, { method: 'POST' });
      // Then download by report ID
      await reports.downloadById(reportData.report_id, scanId);
    } catch (err) {
      // Fall back to legacy scan-ID URL
      const res = await fetch(`${BASE_URL}/reports/${scanId}`, { headers });
      if (!res.ok) throw new Error('Report download failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `compliance_report_${scanId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    }
  },
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export const dashboard = {
  getStats: () => apiFetch('/dashboard/stats'),
  getProducts: () => apiFetch('/dashboard/products'),
};

// ─── RULES ────────────────────────────────────────────────────────────────────
export const rules = {
  /** Get all implemented rules (for judge verification / transparency) */
  getAll: ({ set, severity } = {}) => {
    const params = new URLSearchParams();
    if (set)      params.set('set',      set);
    if (severity) params.set('severity', severity);
    const q = params.toString();
    return apiFetch(`/rules${q ? `?${q}` : ''}`);
  },

  getById: (ruleId) => apiFetch(`/rules/${encodeURIComponent(ruleId)}`),
};
