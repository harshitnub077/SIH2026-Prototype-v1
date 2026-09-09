// backend/routes/dashboard.js
// Dashboard stats + aggregations for the enforcement officer UI
// Updated for spec 03: Product table, overallCompliance, JSONB fields
// SIH26034 — Legal Metrology Compliance Checker

const express = require('express');
const router = express.Router();
const { sequelize, Scan, Product, Violation } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { QueryTypes } = require('sequelize');

const ok   = (res, data) => res.json({ data });
const fail = (res, status, code, msg) => res.status(status).json({ error: { code, message: msg } });

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
router.get('/stats', requireAuth, async (req, res) => {
  try {
    // ── Overview counts ──────────────────────────────────────────────────────
    const overview = await sequelize.query(`
      SELECT
        COUNT(*)                                                                         AS "totalScans",
        COUNT(*) FILTER (WHERE overall_compliance IN ('PASS', 'compliant'))              AS "compliant",
        COUNT(*) FILTER (WHERE overall_compliance IN ('POTENTIAL NON-COMPLIANCE', 'non_compliant')) AS "nonCompliant",
        COUNT(*) FILTER (WHERE overall_compliance IN ('MANUAL REVIEW', 'needs_review')) AS "needsReview",
        COUNT(*) FILTER (WHERE overall_compliance = 'NOT VERIFIED')                     AS "notVerified",
        COUNT(*) FILTER (WHERE overall_compliance = 'NOT APPLICABLE')                   AS "notApplicable",
        COALESCE(SUM(total_violations), 0)                                              AS "totalViolations",
        COALESCE(SUM(high_violations), 0)                                               AS "highViolations",
        COALESCE(ROUND(AVG(compliance_score)::NUMERIC, 1), 0)                           AS "avgComplianceScore"
      FROM scans
      WHERE status = 'complete'
      ${req.user && req.user.id && req.user.role !== 'admin' ? ` AND uploaded_by = '${req.user.id}'` : ''}
    `, { type: QueryTypes.SELECT });

    // ── Top violated rules (most common, across all scans) ───────────────────
    const topViolations = await sequelize.query(`
      SELECT
        rule_id       AS "ruleId",
        rule_title    AS "ruleTitle",
        severity,
        COUNT(*)      AS count
      FROM violations
      WHERE status IN ('POTENTIAL NON-COMPLIANCE', 'MANUAL REVIEW', 'fail', 'estimated_fail')
      GROUP BY rule_id, rule_title, severity
      ORDER BY count DESC
      LIMIT 8
    `, { type: QueryTypes.SELECT });

    // ── Daily scan counts (last 7 days) ──────────────────────────────────────
    const dailyScans = await sequelize.query(`
      SELECT
        DATE(created_at)            AS date,
        COUNT(*)                    AS count,
        COUNT(*) FILTER (WHERE overall_compliance IN ('PASS', 'compliant'))              AS compliant,
        COUNT(*) FILTER (WHERE overall_compliance IN ('POTENTIAL NON-COMPLIANCE', 'non_compliant')) AS non_compliant,
        COUNT(*) FILTER (WHERE overall_compliance IN ('MANUAL REVIEW', 'needs_review')) AS needs_review,
        COUNT(*) FILTER (WHERE overall_compliance = 'NOT VERIFIED')                     AS not_verified
      FROM scans
      WHERE status = 'complete'
        AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, { type: QueryTypes.SELECT });

    // ── Recent scans (last 10, with product info) ────────────────────────────
    const recentScans = await Scan.findAll({
      where: { status: 'complete' },
      include: [{ model: Product, as: 'product' }],
      order: [['created_at', 'DESC']],
      limit: 10,
    });

    // ── Most non-compliant products (products scanned multiple times) ─────────
    const topNonCompliant = await sequelize.query(`
      SELECT
        p.product_name   AS "productName",
        p.brand_name     AS "brandName",
        COUNT(s.id)      AS "totalScans",
        COUNT(s.id) FILTER (WHERE s.overall_compliance IN ('POTENTIAL NON-COMPLIANCE', 'non_compliant')) AS "failScans"
      FROM scans s
      JOIN products p ON p.id = s.product_id
      WHERE s.status = 'complete'
      GROUP BY p.id, p.product_name, p.brand_name
      HAVING COUNT(s.id) FILTER (WHERE s.overall_compliance IN ('POTENTIAL NON-COMPLIANCE', 'non_compliant')) > 0
      ORDER BY "failScans" DESC
      LIMIT 5
    `, { type: QueryTypes.SELECT });

    ok(res, {
      // Spec 05 field names
      total_scans:          Number(overview[0].totalScans)  || 0,
      compliant_count:      Number(overview[0].compliant)   || 0,
      non_compliant_count:  Number(overview[0].nonCompliant) || 0,
      needs_review_count:   Number(overview[0].needsReview) || 0,
      not_verified_count:   Number(overview[0].notVerified) || 0,
      not_applicable_count: Number(overview[0].notApplicable) || 0,
      total_violations:     Number(overview[0].totalViolations) || 0,
      high_violations:      Number(overview[0].highViolations) || 0,
      avg_compliance_score: Number(overview[0].avgComplianceScore) || 0,
      top_violated_rules:   topViolations,
      daily_scans:          dailyScans,
      recent_scans:         recentScans.map(s => ({
        id:                 s.id,
        product_name:       s.product?.productName || (s.extractedData ? s.extractedData.product_name : null) || 'Unknown',
        brand_name:         s.product?.brandName || null,
        overall_compliance: s.overallCompliance,
        overallStatus:      s.overallCompliance,  // compat alias
        compliance_score:   s.complianceScore,
        total_violations:   s.totalViolations,
        high_violations:    s.highViolations,
        criticalViolations: s.highViolations,     // compat alias
        ocr_engine_used:    s.ocrEngineUsed,
        source_type:        s.sourceType,
        created_at:         s.created_at,
      })),
      top_non_compliant:    topNonCompliant,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/dashboard/products ─────────────────────────────────────────────
// All distinct products with scan history
router.get('/products', requireAuth, async (req, res) => {
  try {
    const products = await sequelize.query(`
      SELECT
        p.id,
        p.product_name    AS "productName",
        p.brand_name      AS "brandName",
        p.category,
        COUNT(s.id)       AS "totalScans",
        MAX(s.created_at) AS "lastScanned",
        ROUND(AVG(s.compliance_score)::NUMERIC, 1) AS "avgScore",
        COUNT(s.id) FILTER (WHERE s.overall_compliance IN ('non_compliant', 'POTENTIAL NON-COMPLIANCE')) AS "failScans"
      FROM products p
      LEFT JOIN scans s ON s.product_id = p.id AND s.status = 'complete'
      GROUP BY p.id, p.product_name, p.brand_name, p.category
      ORDER BY "lastScanned" DESC NULLS LAST
      LIMIT 50
    `, { type: QueryTypes.SELECT });

    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
