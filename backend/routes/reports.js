// backend/routes/reports.js
// ============================================================
// Reports routes — Spec 05 API
//
// POST /api/v1/scans/:id/report  → generate / return report record
// GET  /api/v1/reports/:id/download → stream PDF by report ID
// GET  /api/v1/reports           → list all reports (admin)
//
// NOTE: The POST route is mounted under /scans in server.js as:
//   app.use('/api/v1/scans', scansRouter)  → scansRouter mounts the sub-router
// But for clarity and testability, the report generator lives here and
// is imported by the scans router via a sub-route mount.
// ============================================================

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');
const { Scan, Report, Product, Violation } = require('../models');
const { generateReport } = require('../services/report_service');

const ok   = (res, data, status = 200) => res.status(status).json({ data });
const fail = (res, status, code, msg)  => res.status(status).json({ error: { code, message: msg } });

// ─── POST /api/v1/scans/:scanId/report ───────────────────────────────────────
// Spec 05: generate PDF for a completed scan
// Returns: { report_id, file_url }
router.post('/scans/:scanId/report', requireAuth, async (req, res) => {
  try {
    const scan = await Scan.findByPk(req.params.scanId, {
      include: [
        { model: Product,   as: 'product' },
        { model: Violation, as: 'violations' },
        { model: Report,    as: 'reports', order: [['created_at', 'DESC']], limit: 1 },
      ],
    });

    if (!scan) return fail(res, 404, 'SCAN_NOT_FOUND', `Scan ${req.params.scanId} not found`);

    if (scan.status !== 'complete') {
      return fail(res, 400, 'SCAN_NOT_COMPLETE',
        `Cannot generate report — scan status is "${scan.status}". Wait until status is "complete".`);
    }

    // Check if report already exists and file is present
    const existingReport = scan.reports?.[0];
    if (existingReport && fs.existsSync(existingReport.filePath)) {
      return ok(res, {
        report_id: existingReport.id,
        file_url:  `/api/v1/reports/${existingReport.id}/download`,
        created_at: existingReport.created_at,
      });
    }

    // Generate PDF
    const reportDir = './reports';
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

    const reportPath = await generateReport({
      scan:            scan.toJSON(),
      product:         scan.product?.toJSON() || null,
      extractedFields: scan.extractedFields || {},
      violations:      scan.violations || [],
      stats: {
        totalRulesChecked:  scan.totalRulesChecked,
        totalViolations:    scan.totalViolations,
        highViolations:     scan.highViolations,
        complianceScore:    scan.complianceScore,
        overallCompliance:  scan.overallCompliance,
      },
    }, reportDir);

    // Update existing or create new report record
    let report;
    if (existingReport) {
      await existingReport.update({ filePath: reportPath });
      report = existingReport;
    } else {
      report = await Report.create({
        scanId:      scan.id,
        filePath:    reportPath,
        generatedBy: req.user?.id || null,
      });
    }

    ok(res, {
      report_id:  report.id,
      file_url:   `/api/v1/reports/${report.id}/download`,
      created_at: report.created_at,
    }, 201);

  } catch (err) {
    console.error('[POST /scans/:id/report]', err.message);
    fail(res, 500, 'REPORT_GENERATION_FAILED', err.message);
  }
});

// ─── GET /api/v1/reports/:id/download ────────────────────────────────────────
// Spec 05: download PDF by report ID
router.get('/:id/download', requireAuth, async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id, {
      include: [{ model: Scan, as: 'scan' }],
    });

    if (!report) return fail(res, 404, 'REPORT_NOT_FOUND', `Report ${req.params.id} not found`);

    // If file missing, regenerate
    if (!fs.existsSync(report.filePath)) {
      const scan = report.scan;
      if (!scan || scan.status !== 'complete') {
        return fail(res, 410, 'REPORT_FILE_GONE',
          'Report file no longer exists and cannot be regenerated for this scan state.');
      }

      // Fetch full scan data for regeneration
      const fullScan = await Scan.findByPk(scan.id, {
        include: [
          { model: Product,   as: 'product' },
          { model: Violation, as: 'violations' },
        ],
      });

      const reportDir = './reports';
      if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

      const newPath = await generateReport({
        scan:            fullScan.toJSON(),
        product:         fullScan.product?.toJSON() || null,
        extractedFields: fullScan.extractedFields || {},
        violations:      fullScan.violations || [],
        stats: {
          totalRulesChecked: fullScan.totalRulesChecked,
          totalViolations:   fullScan.totalViolations,
          highViolations:    fullScan.highViolations,
          complianceScore:   fullScan.complianceScore,
          overallCompliance: fullScan.overallCompliance,
        },
      }, reportDir);

      await report.update({ filePath: newPath });
      report.filePath = newPath;
    }

    // Stream PDF
    const scanId = report.scanId;
    const filename = `compliance_report_${scanId.slice(0, 8)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const stream = fs.createReadStream(report.filePath);
    stream.on('error', (e) => {
      console.error('[Report download] Stream error:', e.message);
      if (!res.headersSent) {
        fail(res, 500, 'STREAM_ERROR', 'Failed to read report file.');
      }
    });
    stream.pipe(res);

  } catch (err) {
    console.error('[GET /reports/:id/download]', err.message);
    fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

// ─── LEGACY: GET /api/v1/reports/:scanId ─────────────────────────────────────
// Old endpoint (scan ID, not report ID) — kept for backward compat
// Redirects to the /download route of the latest report for this scan
router.get('/:scanId', requireAuth, async (req, res) => {
  // Skip if it matches the /download sub-path (handled above)
  if (req.params.scanId === 'download') return;

  try {
    const scan = await Scan.findByPk(req.params.scanId, {
      include: [{ model: Report, as: 'reports', order: [['created_at', 'DESC']], limit: 1 }],
    });

    if (!scan) return fail(res, 404, 'SCAN_NOT_FOUND', `Scan ${req.params.scanId} not found`);

    const report = scan.reports?.[0];
    if (!report) {
      return fail(res, 404, 'REPORT_NOT_FOUND',
        'No report found for this scan. POST /api/v1/scans/:id/report to generate one.');
    }

    // Redirect to the canonical report download URL
    res.redirect(302, `/api/v1/reports/${report.id}/download`);

  } catch (err) {
    fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

// ─── GET /api/v1/reports (list, admin) ───────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const reports = await Report.findAll({
      include: [{
        model: Scan,
        as: 'scan',
        include: [{ model: Product, as: 'product' }],
      }],
      order: [['created_at', 'DESC']],
      limit: 50,
    });

    ok(res, { reports: reports.map(r => ({
      id:         r.id,
      scan_id:    r.scanId,
      file_url:   `/api/v1/reports/${r.id}/download`,
      created_at: r.created_at,
      product_name: r.scan?.product?.productName || null,
    }))});

  } catch (err) {
    fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

module.exports = router;
