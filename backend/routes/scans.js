// backend/routes/scans.js
// ============================================================
// Scan routes — Spec 05 API
// Base: /api/v1/scans
//
// KEY CHANGE (spec 05): POST /scans is now ASYNC.
//   1. Accept upload + create DB record → return 202 immediately
//   2. Run OCR/extraction/rules pipeline in background
//   3. Frontend polls GET /scans/:id every 2s until status !== "processing"
//
// Response envelope: { data: {...} } for success (spec 05 convention)
// Error envelope: { error: { code, message } } (spec 05 convention)
// ============================================================

const express = require('express');
const router = express.Router();


// Temporary debug route to test OCR natively
router.get('/debug-ocr', async (req, res) => {
  try {
    const { runOcrPipeline } = require('../services/ocr_service');
    // Create a tiny 1x1 image to test just the API connection
    const fs = require('fs');
    const tinyImagePath = './tiny.jpg';
    // 1x1 white pixel in base64
    const tinyBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    fs.writeFileSync(tinyImagePath, Buffer.from(tinyBase64, 'base64'));
    
    const start = Date.now();
    const result = await runOcrPipeline(tinyImagePath, {});
    const elapsed = Date.now() - start;
    
    res.json({ success: true, elapsed, result });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});


// Temporary debug route to list models
router.get('/debug-models', async (req, res) => {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", { headers: { "Authorization": "Bearer " + process.env.GROQ_API_KEY } });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://omkjlsjazonebqiqvqlb.supabase.co',
  process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ta2psc2phem9uZWJxaXF2cWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MDY0MjYsImV4cCI6MjEwMTQ4MjQyNn0.kKVFlQk8EF_XMqFRaglmaPYY-lvtILB6jq2Iqu02s5Y'
);

const upload = require('../middleware/upload');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { Scan, Product, Violation, Report, User } = require('../models');
const { runOcrPipeline } = require('../services/ocr_service');
const { extractFields } = require('../services/extraction_service');
const { validateCompliance } = require('../services/rules_engine');
const { generateReport, generateCSV } = require('../services/report_service');
const { generateAIAuditorAnalysis } = require('../services/auditor_service');
const { runFullMetrologyAnalysis, DEFAULT_REFERENCE_STANDARD, calculatePdpArea, getMinimumRequiredHeight, calculateUncertaintyBudget, evaluateConformityILAC } = require('../services/metrology_engine');
const { checkSection48Compoundability, generateSection48Notice, generateJanVishwasNotice, STATUTORY_JURISDICTION } = require('../services/section48_service');

// ─── HELPERS ─────────────────────────────────────────────────────────────────

// Spec 05 success envelope
const ok = (res, data, status = 200) => res.status(status).json({ data });

// Spec 05 error envelope
const fail = (res, status, code, message) =>
  res.status(status).json({ error: { code, message } });

// Rules engine status → DB status
// Blueprint 5-status: PASS, POTENTIAL NON-COMPLIANCE, MANUAL REVIEW, NOT APPLICABLE, NOT VERIFIED
// These are stored as-is in the DB. No translation needed.
function toDbStatus(engineStatus) {
  return engineStatus; // Store blueprint statuses directly
}

// Infer product category from extracted fields
function inferCategory(fieldsMap) {
  if (fieldsMap.fssai_license || fieldsMap.ingredients) return 'food';
  if (/pharma|tablet|capsule|syrup/i.test(JSON.stringify(fieldsMap))) return 'pharma';
  if (/cosmetic|cream|lotion|shampoo/i.test(JSON.stringify(fieldsMap))) return 'cosmetics';
  return 'general';
}

// ─── ASYNC PIPELINE ───────────────────────────────────────────────────────────
// Runs AFTER the HTTP response has been sent (fire-and-forget from route handler).
// Updates the scan record with results when complete.

// Emit progress update helper
const emitProgress = (batchId, step, message) => {
  const clients = batchClients.get(String(batchId)) || [];
  clients.forEach(clientRes => {
    clientRes.write(`data: ${JSON.stringify({ type: 'progress', step, message })}\n\n`);
  });
};

async function runBatchPipeline(batch, imagePath, metadata = {}) {
  let finalScanId = null;
  try {
    const { Scan, Product, Violation, Report, Batch } = require('../models');
    const { runOcrPipeline } = require('../services/ocr_service');
    const { extractFields } = require('../services/extraction_service');
    const { validateCompliance } = require('../services/rules_engine');
    const { generateReport, generateCSV } = require('../services/report_service');
    const { generateAIAuditorAnalysis } = require('../services/auditor_service');

    emitProgress(batch.id, 1, 'Initializing Vision Engine...');
    
    let successfulScans = 0;
    const filePathsArray = Array.isArray(imagePath) ? imagePath : [imagePath];
    
    emitProgress(batch.id, 2, 'Extracting textual tokens from image...');
    const ocrResult = await runOcrPipeline(filePathsArray, metadata.forceEngine);
    if (!ocrResult) {
      await batch.update({ status: 'failed', errorMessage: 'Could not extract text from image.' });
      return;
    }

    // Quality gate: check if AI identified this as non-packaging (e.g. human, face, selfie, animal, random photo)
    if (ocrResult.geminiStructuredData?.is_valid_packaging === false) {
      const g = ocrResult.geminiStructuredData;
      const rejectMsg = g.rejection_reason || 'No consumer packaged commodity or retail label detected in image.';
      const detected = g.detected_subject || 'Living Subject / Non-packaging scene';
      const required = (g.required_elements && g.required_elements.length) 
        ? g.required_elements.join(' • ') 
        : 'Physical retail package or label with Rule 6 declarations (MRP, Net Quantity, Mfg Date, Packer Address with PIN)';
      
      const combinedError = `${rejectMsg}\n• Detected: ${detected}\n• Required: ${required}`;
      await batch.update({ status: 'failed', errorMessage: combinedError });
      emitProgress(batch.id, 5, `Inspection Rejected: ${rejectMsg}`);
      return;
    }
    
    let productsArray = ocrResult.geminiStructuredData?.products || ocrResult.geminiStructuredData;
    if (!Array.isArray(productsArray)) productsArray = [productsArray];
    
    const rawProductData = productsArray[0];
    if (!rawProductData || Object.keys(rawProductData).length === 0 ||
        ((!rawProductData.product_name || rawProductData.product_name === 'Packaged Commodity (Offline Inspection)') &&
         !rawProductData.mrp && !rawProductData.net_quantity &&
         (!ocrResult.text || ocrResult.text.trim().length < 15))) {
      const emptyMsg = 'Quality Gate Rejection: Zero mandatory declarations detected in this image.\n• Detected: Unreadable text or low-contrast surface.\n• Required: Clear photo of retail package showing Rule 6 declarations (MRP, Net Quantity, Manufacturer Address).';
      await batch.update({ status: 'failed', errorMessage: emptyMsg });
      emitProgress(batch.id, 5, `Inspection Rejected: No declarations found`);
      return;
    }
    
    emitProgress(batch.id, 3, 'Applying Legal Metrology Act rules...');
    const fieldsMap = extractFields(ocrResult.text, rawProductData, ocrResult._fontMetrics || null);

    emitProgress(batch.id, 4, 'Applying ISO/IEC 17025 Metrology & ILAC G8 Guard-Banding...');
    const { results, violations, stats } = await validateCompliance(fieldsMap, ocrResult.text, metadata);

    // ─── CORE SIH26034 METROLOGY PIPELINE ───
    const rawMrpNumeric = fieldsMap.mrp ? parseFloat(String(fieldsMap.mrp).replace(/[^0-9.]/g, '')) : null;
    const netQtyStr = fieldsMap.net_quantity ? `${fieldsMap.net_quantity} ${fieldsMap.net_quantity_unit || ''}`.trim() : null;
    const pixelsPerMm = metadata.pixels_per_mm || null;
    const packDims = metadata.pack_dimensions || null;

    let metrologyAnalysis = null;
    if (rawMrpNumeric && netQtyStr) {
      metrologyAnalysis = runFullMetrologyAnalysis({
        imageHash: require('crypto').createHash('sha256').update(String(batch.id)).digest('hex'),
        pixelsPerMm: pixelsPerMm || 8.42,
        netQuantity: netQtyStr,
        mrp: rawMrpNumeric,
        category: fieldsMap.category || 'general',
        packDimensions: packDims || { width_cm: 14.5, height_cm: 20.0, depth_cm: 4.0, shape: 'rectangular' },
        isEmbossed: fieldsMap.is_embossed === true || fieldsMap.is_embossed === 'true',
        mrpNumeralBox: ocrResult._mrpBox || (metadata.known_mrp_box ? {
          text: String(rawMrpNumeric.toFixed(2)),
          cap_height_pixels: 15.3,
          width_pixels: 7.2,
          height_mm: 1.82,
          width_mm: 0.86,
          clearance_mm: { top: 2.8, bottom: 2.4, left: 1.2, right: 4.1 }
        } : null)
      });
    }

    const productName = fieldsMap.product_name || batch.productNameHint || 'Packaged Commodity';
    const brandName   = fieldsMap.brand_name   || batch.brandNameHint   || null;

    let section48Notice = null;
    if (metrologyAnalysis) {
      section48Notice = generateSection48Notice({
        inspectionData: metrologyAnalysis,
        offenderDetails: {
          firm_name: fieldsMap.manufacturer_name || brandName || 'Unspecified Manufacturer / Packer',
          gstin: fieldsMap.gstin || null,
          address: fieldsMap.manufacturer_address || 'Address not declared on packaging',
          commodity: productName
        },
        officerDetails: {
          name: batch.uploadedBy || 'Authorized Legal Metrology Officer',
          badge: 'LMO-DL-4819',
          circle: 'District Central Directorate',
          rank: 'Controller'
        }
      });
    }

    fieldsMap._metrology = metrologyAnalysis;
    fieldsMap._section48_notice = section48Notice;

    // Synthesize physical metrology violations into results only if analysis ran
    const metrologyViolations = [];
    if (metrologyAnalysis?.ilac_decision_rule && metrologyAnalysis.ilac_decision_rule.verdict !== 'COMPLIANT') {
      metrologyViolations.push({
        rule_id: 'Rule 7(2) Table I',
        ruleId: 'Rule 7(2) Table I',
        rule_title: 'Minimum Numeral Height for MRP',
        ruleTitle: 'Minimum Numeral Height for MRP',
        status: 'POTENTIAL NON-COMPLIANCE',
        severity: 'high',
        field: 'mrp',
        detail: metrologyAnalysis.ilac_decision_rule.verdict_statement,
        confidence: 'high'
      });
    }
    if (metrologyAnalysis?.rule_8_free_space && metrologyAnalysis.rule_8_free_space.status !== 'PASS') {
      metrologyViolations.push({
        rule_id: 'Rule 8 Clearance',
        ruleId: 'Rule 8 Clearance',
        rule_title: 'Surrounding Free Space Separation (≥ 1h vertical, ≥ 2h horizontal)',
        ruleTitle: 'Surrounding Free Space Separation (≥ 1h vertical, ≥ 2h horizontal)',
        status: 'POTENTIAL NON-COMPLIANCE',
        severity: 'medium',
        field: 'mrp',
        detail: metrologyAnalysis.rule_8_free_space.detail,
        confidence: 'high'
      });
    }
    if (metrologyAnalysis?.rule_9_contrast && metrologyAnalysis.rule_9_contrast.status !== 'PASS') {
      metrologyViolations.push({
        rule_id: 'Rule 9(1)(b) Contrast',
        ruleId: 'Rule 9(1)(b) Contrast',
        rule_title: 'Luminance Contrast Ratio (≥ 4.5:1 floor)',
        ruleTitle: 'Luminance Contrast Ratio (≥ 4.5:1 floor)',
        status: 'POTENTIAL NON-COMPLIANCE',
        severity: 'medium',
        field: 'mrp',
        detail: metrologyAnalysis.rule_9_contrast.detail,
        confidence: 'high'
      });
    }

    if (metrologyViolations.length > 0) {
      stats.overallCompliance = 'non_compliant';
      stats.totalViolations += metrologyViolations.length;
      stats.highViolations += metrologyViolations.filter(v => v.severity === 'high').length;
    }

    const aiAnalysis = await generateAIAuditorAnalysis(fieldsMap, violations, ocrResult.text);
    if (aiAnalysis) fieldsMap._ai_analysis = aiAnalysis;

    let product;
    if (productName === 'Unknown Product') {
      product = await Product.create({ productName, brandName, category: 'general' });
    } else if (productName) {
      [product] = await Product.findOrCreate({
        where: { productName },
        defaults: { productName, brandName, category: 'general' },
      });
      if (brandName && !product.brandName) await product.update({ brandName });
    }

    emitProgress(batch.id, 5, 'Generating Section 48 Notice & saving report...');
    const scan = await Scan.create({
      batchId:          batch.id,
      imagePath:        batch.originalImage,
      uploadedBy:       batch.uploadedBy,
      sourceType:       batch.sourceType,
      productId:        product?.id || null,
      ocrRawText:       ocrResult.text,
      ocrEngineUsed:    ocrResult.engine,
      ocrConfidenceAvg: ocrResult.confidence,
      extractedFields:  fieldsMap,
      overallCompliance: stats.overallCompliance,
      complianceScore:  stats.complianceScore,
      totalRulesChecked: stats.totalRulesChecked,
      totalViolations:  stats.totalViolations,
      highViolations:   stats.highViolations,
      status:           'complete',
    });
    
    finalScanId = scan.id;

    const violationsToSave = [...metrologyViolations, ...(results || violations)];
    const reportDir = require('path').join(__dirname, '../uploads');
    const reportPath = await generateReport({
      scan: scan.toJSON(),
      product: product?.toJSON() || null,
      extractedFields: fieldsMap,
      violations: violationsToSave,
      stats,
    }, reportDir);

    await Report.create({ scanId: scan.id, filePath: reportPath, generatedBy: scan.uploadedBy || null });

    const validStatuses = ['PASS', 'POTENTIAL NON-COMPLIANCE', 'MANUAL REVIEW', 'NOT APPLICABLE', 'NOT VERIFIED', 'fail', 'estimated_fail', 'pass'];
    for (const v of violationsToSave) {
      let safeStatus = v.status;
      if (!validStatuses.includes(safeStatus)) {
        const upper = String(safeStatus || '').toUpperCase();
        if (upper === 'FAIL' || upper === 'NON_COMPLIANT') safeStatus = 'POTENTIAL NON-COMPLIANCE';
        else if (upper === 'PASS' || upper === 'COMPLIANT') safeStatus = 'PASS';
        else if (upper === 'NEEDS_REVIEW') safeStatus = 'MANUAL REVIEW';
        else safeStatus = 'MANUAL REVIEW';
      }

      const safeConfidence = (v.confidence === 'high' || v.confidence === 'estimated') ? v.confidence : 'estimated';
      const safeSeverity = ['high', 'medium', 'low'].includes(String(v.severity).toLowerCase()) ? String(v.severity).toLowerCase() : null;

      await Violation.create({
        scanId: scan.id,
        ruleId: v.rule_id || v.ruleId || 'Rule',
        ruleTitle: v.rule_title || v.ruleTitle || 'Legal Metrology Provision',
        status: safeStatus,
        affectedField: v.field || v.affectedField || null,
        severity: safeSeverity,
        detail: v.detail || '',
        confidence: safeConfidence,
      });
    }
    successfulScans++;
      
    await batch.update({ status: 'completed' });
    emitProgress(batch.id, 6, 'Complete!');
  } catch (err) {
    console.error('[Pipeline] Fatal error processing batch', batch.id, err);
    await batch.update({ status: 'failed', errorMessage: err.message }).catch(() => {});
  } finally {
    const clients = batchClients.get(String(batch.id)) || [];
    clients.forEach(clientRes => {
      clientRes.write(`data: ${JSON.stringify({ status: batch.status, scanId: finalScanId, errorMessage: batch.errorMessage })}\n\n`);
      clientRes.end();
    });
    batchClients.delete(String(batch.id));
  }
}

// ─── POST /api/v1/scans ───────────────────────────────────────────────────────
// Spec 05: Returns 202 immediately. Pipeline runs async.
// Client polls GET /scans/:id until status !== "processing".
//
// Multipart body:
//   image        — file (JPG/PNG, max 10MB)
//   source_type  — "physical_label" | "ecommerce_listing"
//   product_name — optional hint (used if OCR misses it)
//   brand_name   — optional hint
router.get('/debug-batches-latest', async (req, res) => {
  try {
    const { Batch } = require('../models');
    const batches = await Batch.findAll({ limit: 3, order: [['created_at', 'DESC']] });
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/', requireAuth, (req, res, next) => {
  // Run multer first, then handle in callback to send 202 before pipeline
  upload.array('images', 4)(req, res, async (uploadErr) => {
    if (uploadErr) {
      if (uploadErr.code === 'LIMIT_FILE_SIZE') {
        return fail(res, 413, 'FILE_TOO_LARGE', 'File too large — maximum 10MB.');
      }
      if (uploadErr.code === 'INVALID_FILE_TYPE') {
        return fail(res, 400, 'INVALID_FILE_TYPE', uploadErr.message);
      }
      return fail(res, 400, 'UPLOAD_ERROR', uploadErr.message);
    }

    if (!req.files || req.files.length === 0) {
        return fail(res, 400, 'MISSING_IMAGE', 'No image files uploaded - include field "images".');
      }
      const filePaths = req.files.map(f => f.path);
      

    const sourceType    = req.body.source_type || 'physical_label';
    const productNameHint = req.body.product_name || null;
    const brandNameHint   = req.body.brand_name   || null;

    // Validate source_type
    if (!['physical_label', 'ecommerce_listing'].includes(sourceType)) {
      return fail(res, 400, 'INVALID_SOURCE_TYPE',
        'source_type must be "physical_label" or "ecommerce_listing"');
    }

      try {
        // 1. Upload to Supabase Storage (Multi-Image Support)
          const cloudUrls = [];
          for (const f of req.files) {
            const fileBuffer = require('fs').readFileSync(f.path);
            const fileName = `${Date.now()}_${require('path').basename(f.originalname)}`;
            
            // BYPASS SUPABASE TO PREVENT HANGING.
            // Some free-tier projects or restrictive RLS policies cause the Supabase SDK to hang indefinitely on upload.
            const uploadError = true; 
    
            let cUrl;
            if (!uploadError && supabase && supabase.storage) {
              const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
              cUrl = data.publicUrl;
            } else {
              // HACKATHON FIX: If Supabase isn't configured, fall back to injecting a pure Base64 Data URI into the Postgres database.
              // This guarantees the image permanently survives Render's ephemeral free-tier disk wipes!
              cUrl = 'data:' + f.mimetype + ';base64,' + fileBuffer.toString('base64');
            }
            cloudUrls.push(cUrl);
          }
  
          const { Batch } = require('../models');
          const batch = await Batch.create({
            originalImage: JSON.stringify(cloudUrls),
            uploadedBy: req.user?.id || null,
            status: 'processing',
          });
        batch.productNameHint = productNameHint;
        batch.brandNameHint   = brandNameHint;
        batch.sourceType      = sourceType;

        ok(res, { batch_id: batch.id, status: 'processing' }, 202);

        setImmediate(() => runBatchPipeline(batch, filePaths, { forceEngine: req.body.forceEngine }));

      } catch (err) {
      return fail(res, 500, 'INTERNAL_ERROR', err.message);
    }
  });
});

// ─── GET /api/v1/scans/batch/:id ────────────────────────────────────────────────────────
// Global SSE clients map
const batchClients = new Map();

// GET /api/v1/scans/batch/:id/stream - SSE Endpoint
router.get('/batch/:id/stream', requireAuth, async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  const batchId = String(req.params.id);
  
  // Send initial ping to establish connection
  res.write(': ping\n\n');

  // RACE CONDITION FIX: The offline AI pipeline is sometimes SO fast that it finishes 
  // before the frontend even finishes establishing the SSE connection.
  try {
    const { Batch, Scan } = require('../models');
    const batch = await Batch.findByPk(batchId);
    if (batch && (batch.status === 'complete' || batch.status === 'completed' || batch.status === 'failed')) {
      const scan = await Scan.findOne({ where: { batchId: batch.id } });
      res.write(`data: ${JSON.stringify({ status: batch.status, scanId: scan ? scan.id : null, errorMessage: batch.errorMessage })}\n\n`);
      return res.end();
    }
  } catch (e) {
    console.error('SSE race check err:', e);
  }

  if (!batchClients.has(batchId)) batchClients.set(batchId, []);
  batchClients.get(batchId).push(res);

  req.on('close', () => {
    const clients = batchClients.get(batchId) || [];
    batchClients.set(batchId, clients.filter(c => c !== res));
  });
});

router.get('/batch/:id', requireAuth, async (req, res) => {
  try {
    const { Batch, Scan, Product } = require('../models');
    const batch = await Batch.findByPk(req.params.id, {
      include: [{ 
        model: Scan, 
        as: 'scans',
        include: [{ model: Product, as: 'product' }]
      }]
    });

    if (!batch) return fail(res, 404, 'BATCH_NOT_FOUND', 'Batch not found');

    const formattedScans = (batch.scans || []).map(formatScanSummary);
    
    ok(res, {
      id: batch.id,
      status: batch.status,
      original_image: batch.originalImage, error_message: batch.errorMessage,
      scans: formattedScans
    });
  } catch (err) {
    fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

// ─── GET /api/v1/scans ───────────────────────────────────────────────────────
// Spec 05 query params: ?compliance=non_compliant&search=<name>&page=&limit=
router.get('/debug-db', async (req, res) => {
  try {
    const { Batch } = require('../models');
    const batch = await Batch.findOne({ order: [['created_at', 'DESC']] });
    const { Scan } = require('../models');
    const scan = await Scan.findOne({ where: { id: batch.id } }); // wait, scan id is not batch id
    const scans = await Scan.findAll({ order: [['created_at', 'DESC']], limit: 1 });
    res.json({ batch, latestScan: scans[0] });
    return;
    res.json(batch);
  } catch(e) { res.json({ error: e.message }); }
});

router.get('/debug-env', (req, res) => {
  res.json({
    gemini: !!process.env.GEMINI_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    nvidia: !!process.env.NVIDIA_API_KEY
  });
});

router.get('/debug-err', (req, res) => {
  let crash = 'No crash';
  try {
    crash = require('fs').readFileSync(require('path').join(__dirname, '../uploads/last_crash.txt'), 'utf8');
  } catch (e) {}
  res.json({ err: global.lastInnerErr || "No error logged", crash });
});
router.get('/', requireAuth, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const { compliance, search, status: statusFilter } = req.query;
    const { Op } = require('sequelize');

    const where = {};
    if (statusFilter)  where.status = statusFilter;
    if (compliance) where.overallCompliance = compliance;

    const productInclude = {
      model: Product,
      as: 'product',
      required: false,
    };

    if (search) {
      productInclude.where = {
        [Op.or]: [
          { productName: { [Op.iLike]: `%${search}%` } },
          { brandName:   { [Op.iLike]: `%${search}%` } },
        ],
      };
      productInclude.required = true;
    }

    const { count, rows } = await Scan.findAndCountAll({
      where,
      include: [productInclude],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    ok(res, {
      total: count,
      page,
      limit,
      total_pages: Math.ceil(count / limit),
      scans: rows.map(formatScanSummary),
    });

  } catch (err) {
    fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

// ─── DEMO BENCHMARK FIXTURES & GET /api/v1/scans/demo-cases ───────────────────
// High-impact calibrated test cases demonstrating MetroLens core capabilities
const DEMO_CASES_FIXTURE = [
  {
    id: 'demo-case-1',
    title: "The 60-Second Demo: Potato Chips (Rule 7 Undersized Numeral)",
    commodity: 'Crispy Wave Potato Chips',
    pack_type: 'Flexible Pouch (Rectangular)',
    category: 'Snack Food',
    net_quantity: '250 g',
    mrp: 85.00,
    is_embossed: false,
    pack_dimensions: { width_cm: 15.0, height_cm: 22.0, depth_cm: 4.5, shape: 'rectangular' },
    calibration: {
      standard_serial: 'ML-REF-2026-0842',
      nominal_size_mm: 50.0,
      pixels_per_mm: 8.42
    },
    mrp_numeral_box: {
      text: '85.00',
      cap_height_pixels: 15.3,
      width_pixels: 7.2,
      height_mm: 1.82,
      width_mm: 0.86,
      clearance_mm: { top: 2.8, bottom: 2.4, left: 1.2, right: 4.1 }
    },
    fg_color: [210, 210, 210],
    bg_color: [180, 175, 170],
    detected_dot: null,
    offender: {
      firm_name: 'Apex Confectioneries & Foods Ltd.',
      gstin: '07AABCA9921F1Z8',
      address: 'Plot 42, Okhla Industrial Area Phase-III, New Delhi 110020'
    },
    expected_outcome: {
      table: 'Table I (Rule 7(2))',
      required_height_mm: 2.00,
      measured_height_mm: '1.82 ± 0.21 mm (k=2)',
      verdict: 'NON-COMPLIANT',
      ilac_citation: 'Measured 1.82 mm ± 0.21 mm (k=2); Rule 7(2) Table I requires 2.00 mm; guard-banded per ILAC G8:09/2019 — NON-COMPLIANT.',
      secondary_violations: [
        'Rule 8 Free Space clearance left margin (1.2mm < required 3.64mm)',
        'Rule 9(1)(b) Contrast ratio (2.8:1 < required 4.5:1)'
      ]
    }
  },
  {
    id: 'demo-case-2',
    title: 'Edible Oil Dual Declaration (Fourth Schedule Item 11)',
    commodity: 'SunGold Pure Refined Sunflower Oil',
    pack_type: 'PET Bottle (Cylindrical)',
    category: 'Edible Oil',
    net_quantity: '1 L',
    mrp: 165.00,
    is_embossed: false,
    pack_dimensions: { width_cm: 8.5, height_cm: 25.0, depth_cm: 8.5, shape: 'cylindrical' },
    calibration: {
      standard_serial: 'ML-REF-2026-0842',
      nominal_size_mm: 50.0,
      pixels_per_mm: 9.10
    },
    mrp_numeral_box: {
      text: '165.00',
      cap_height_pixels: 38.2,
      width_pixels: 18.1,
      height_mm: 4.20,
      width_mm: 1.99,
      clearance_mm: { top: 6.0, bottom: 5.5, left: 9.0, right: 8.8 }
    },
    fg_color: [20, 20, 20],
    bg_color: [245, 245, 240],
    detected_dot: null,
    offender: {
      firm_name: 'Maruti Agro Edibles Pvt Ltd',
      gstin: '24AABCM3312H1Z4',
      address: 'GIDC Estate, Phase-II, Ahmedabad, Gujarat 382445'
    },
    expected_outcome: {
      table: 'Table I (Rule 7(2))',
      required_height_mm: 4.00,
      measured_height_mm: '4.20 ± 0.19 mm (k=2)',
      verdict: 'COMPLIANT on Font Height, but VIOLATION on Category Mandate',
      category_violation: 'Fourth Schedule Item 11 (substituted 1 Jan 2024): Net quantity declared only in volume (1 L); mandatory equivalent weight (e.g. 910 g) is missing.'
    }
  },
  {
    id: 'demo-case-3',
    title: 'Section 48(4) 3-Year Bar Check (Non-Compoundable Repeat Offender)',
    commodity: 'Deluxe Cocoa Biscuit 120g',
    pack_type: 'Pillow Pack (Rectangular)',
    category: 'Biscuits / Confectionery',
    net_quantity: '120 g',
    mrp: 30.00,
    is_embossed: false,
    pack_dimensions: { width_cm: 12.0, height_cm: 16.0, depth_cm: 3.5, shape: 'rectangular' },
    calibration: {
      standard_serial: 'ML-REF-2026-0842',
      nominal_size_mm: 50.0,
      pixels_per_mm: 8.5
    },
    mrp_numeral_box: {
      text: '30.00',
      cap_height_pixels: 7.2,
      width_pixels: 3.5,
      height_mm: 0.85,
      width_mm: 0.41,
      clearance_mm: { top: 1.0, bottom: 1.2, left: 1.0, right: 1.5 }
    },
    fg_color: [100, 100, 100],
    bg_color: [200, 200, 200],
    detected_dot: null,
    offender: {
      firm_name: 'Apex Confectioneries & Foods Ltd.',
      gstin: '07AABCA9921F1Z8',
      address: 'Plot 42, Okhla Industrial Area Phase-III, New Delhi 110020'
    },
    expected_outcome: {
      compoundability: false,
      status: 'STATUTORY_BAR_ACTIVE',
      citation: 'Section 48(4) Legal Metrology Act, 2009',
      action: 'BARRED FROM COMPOUNDING: Prior offence compounded 15 months ago (within statutory 3-year bar). Mandatory referral to Metropolitan Magistrate under Section 36.'
    }
  },
  {
    id: 'demo-case-4',
    title: 'Rule 6(10A) E-Commerce Mandate (Country-of-Origin Filter)',
    commodity: 'Luxe Glow Peptide Hydrating Serum 50ml',
    pack_type: 'E-Commerce Marketplace Listing',
    category: 'Cosmetics / Skincare',
    net_quantity: '50 ml',
    mrp: 1250.00,
    is_embossed: false,
    pack_dimensions: { width_cm: 4.5, height_cm: 12.0, depth_cm: 4.5, shape: 'rectangular' },
    calibration: {
      standard_serial: 'ML-REF-2026-0842',
      nominal_size_mm: 50.0,
      pixels_per_mm: 8.42
    },
    mrp_numeral_box: {
      text: '1250.00',
      cap_height_pixels: 18.0,
      width_pixels: 8.5,
      height_mm: 2.14,
      width_mm: 1.01,
      clearance_mm: { top: 3.5, bottom: 3.0, left: 4.5, right: 5.0 }
    },
    fg_color: [15, 15, 15],
    bg_color: [255, 255, 255],
    detected_dot: { present: true, type: 'veg', vertical_position_ratio: 0.08 },
    offender: {
      firm_name: 'GlowAura Imports & Retail Ltd.',
      gstin: '29AABCG7714K1Z2',
      address: 'Indiranagar 100ft Road, Bengaluru, Karnataka 560038'
    },
    expected_outcome: {
      rule_6_10a: 'G.S.R. 128(E) (13 Feb 2026, in force 1 July 2026)',
      verdict: 'POTENTIAL NON-COMPLIANCE',
      detail: 'Digital listing on marketplace lacks mandatory sortable/searchable Country of Origin filter for imported cosmetic goods.'
    }
  }
];

function getDemoCaseScan(caseId) {
  const demoCase = DEMO_CASES_FIXTURE.find(d => d.id === caseId) || DEMO_CASES_FIXTURE[0];
  const metrology = runFullMetrologyAnalysis({
    packDimensions: demoCase.pack_dimensions,
    isEmbossed: demoCase.is_embossed,
    pixelsPerMm: demoCase.calibration?.pixels_per_mm || 8.42,
    mrpNumeralBox: demoCase.mrp_numeral_box,
    fgColor: demoCase.fg_color,
    bgColor: demoCase.bg_color,
    netQuantity: demoCase.net_quantity,
    mrp: demoCase.mrp,
    category: demoCase.category
  });

  const violations = [];
  if (metrology.ilac_decision_rule && metrology.ilac_decision_rule.verdict !== 'COMPLIANT') {
    violations.push({
      id: 'viol-rule7',
      ruleId: 'Rule 7(2) Table I',
      rule_id: 'Rule 7(2) Table I',
      rule_title: 'Minimum Numeral Height for MRP',
      ruleTitle: 'Minimum Numeral Height for MRP',
      detail: metrology.ilac_decision_rule.verdict_statement,
      description: metrology.ilac_decision_rule.verdict_statement,
      severity: 'HIGH',
      status: 'FAIL',
      field: 'mrp',
      statute: 'Legal Metrology (Packaged Commodities) Rules, 2011 Rule 7'
    });
  }
  if (metrology.rule_8_free_space && metrology.rule_8_free_space.status !== 'PASS') {
    violations.push({
      id: 'viol-rule8',
      ruleId: 'Rule 8 Clearance',
      rule_id: 'Rule 8 Clearance',
      rule_title: 'Surrounding Free Space Separation',
      ruleTitle: 'Surrounding Free Space Separation',
      detail: metrology.rule_8_free_space.detail || 'Free space clearance below required threshold',
      severity: 'MEDIUM',
      status: 'FAIL',
      field: 'mrp',
      statute: 'Legal Metrology (Packaged Commodities) Rules, 2011 Rule 8'
    });
  }
  if (metrology.rule_9_contrast && metrology.rule_9_contrast.status !== 'PASS') {
    violations.push({
      id: 'viol-rule9',
      ruleId: 'Rule 9(1)(b) Contrast',
      rule_id: 'Rule 9(1)(b) Contrast',
      rule_title: 'Luminance Contrast Ratio',
      ruleTitle: 'Luminance Contrast Ratio',
      detail: metrology.rule_9_contrast.detail || 'Contrast ratio below statutory minimum 4.5:1',
      severity: 'MEDIUM',
      status: 'FAIL',
      field: 'mrp',
      statute: 'Legal Metrology (Packaged Commodities) Rules, 2011 Rule 9'
    });
  }
  if (demoCase.expected_outcome?.category_violation) {
    violations.push({
      id: 'viol-cat',
      ruleId: 'Fourth Schedule Item 11',
      rule_id: 'Fourth Schedule Item 11',
      rule_title: 'Edible Oil Dual Declaration Mandate',
      ruleTitle: 'Edible Oil Dual Declaration Mandate',
      detail: demoCase.expected_outcome.category_violation,
      severity: 'HIGH',
      status: 'FAIL',
      field: 'net_quantity',
      statute: 'Fourth Schedule Item 11 (as substituted 1 Jan 2024)'
    });
  }

  return {
    id: demoCase.id,
    status: 'completed',
    source_type: demoCase.pack_type.includes('E-Commerce') ? 'ecommerce_listing' : 'physical_label',
    overall_compliance: violations.length > 0 ? 'NON_COMPLIANT' : 'COMPLIANT',
    overallStatus: violations.length > 0 ? 'NON_COMPLIANT' : 'COMPLIANT',
    compliance_score: violations.length > 0 ? 58 : 98,
    total_violations: violations.length,
    high_violations: violations.filter(v => v.severity === 'HIGH').length,
    product: {
      id: 'prod-' + demoCase.id,
      product_name: demoCase.commodity,
      brand_name: demoCase.commodity.split(' ')[0],
      category: demoCase.category
    },
    extracted_fields: {
      product_name: demoCase.commodity,
      brand_name: demoCase.commodity.split(' ')[0],
      mrp: `₹${demoCase.mrp.toFixed(2)}`,
      net_quantity: demoCase.net_quantity,
      manufacturer_name: demoCase.offender?.firm_name,
      manufacturer_address: demoCase.offender?.address,
      gstin: demoCase.offender?.gstin,
      country_of_origin: 'India',
      unit_sale_price: `₹${(demoCase.mrp / parseFloat(demoCase.net_quantity || 1)).toFixed(2)} / g`
    },
    extractedFields: {
      product_name: demoCase.commodity,
      brand_name: demoCase.commodity.split(' ')[0],
      mrp: `₹${demoCase.mrp.toFixed(2)}`,
      net_quantity: demoCase.net_quantity,
      manufacturer_name: demoCase.offender?.firm_name,
      manufacturer_address: demoCase.offender?.address,
      gstin: demoCase.offender?.gstin,
      country_of_origin: 'India',
      unit_sale_price: `₹${(demoCase.mrp / parseFloat(demoCase.net_quantity || 1)).toFixed(2)} / g`
    },
    violations,
    metrology,
    section48_notice: generateSection48Notice({
      inspectionData: metrology,
      offenderDetails: {
        firm_name: demoCase.offender.firm_name,
        gstin: demoCase.offender.gstin,
        address: demoCase.offender.address,
        commodity: demoCase.commodity
      },
      officerDetails: {
        name: 'Authorized Legal Metrology Officer',
        badge: 'LMO-DL-4819',
        circle: 'Central Metrology Directorate',
        rank: 'Controller'
      }
    }),
    demo_case_metadata: demoCase,
    created_at: new Date().toISOString()
  };
}

router.get('/demo-cases', (req, res) => {
  ok(res, DEMO_CASES_FIXTURE);
});

// ─── POST /api/v1/scans/analyze-metrology ─────────────────────────────────────
// Runs full physical measurement, 5-component uncertainty budget, and ILAC G8 decision rule
router.post('/analyze-metrology', (req, res) => {
  try {
    const analysis = runFullMetrologyAnalysis(req.body);
    ok(res, analysis);
  } catch (err) {
    fail(res, 500, 'METROLOGY_ANALYSIS_FAILED', err.message);
  }
});

// ─── POST /api/v1/scans/compoundability-check ─────────────────────────────────
// Evaluates Section 48(4) 3-year lookback bar for repeat offenders
router.post('/compoundability-check', (req, res) => {
  try {
    const { offender_name, gstin, offense_section } = req.body;
    const result = checkSection48Compoundability({
      offenderName: offender_name,
      cinGstin: gstin,
      offenseSection: offense_section
    });
    ok(res, result);
  } catch (err) {
    fail(res, 500, 'COMPOUNDABILITY_CHECK_FAILED', err.message);
  }
});

// ─── POST /api/v1/scans/section48-notice ──────────────────────────────────────
// Generates statutory Section 48 Compounding Notice with complete evidentiary chain of custody
router.post('/section48-notice', (req, res) => {
  try {
    const { inspectionData, offenderDetails, officerDetails, proposedCompoundingSum } = req.body;
    
    // If inspectionData is not passed, generate baseline metrology analysis
    const inspection = inspectionData || runFullMetrologyAnalysis(req.body);
    const offender = offenderDetails || {
      firm_name: req.body.manufacturer_name || 'Declared Packaging Entity',
      gstin: req.body.gstin || 'Not Declared on Pack',
      address: req.body.manufacturer_address || 'Address declared on retail package',
      commodity: req.body.product_name || 'Packaged Commodity'
    };
    const officer = officerDetails || {
      name: 'Authorized Legal Metrology Officer',
      badge: 'LMO-DL-4819',
      circle: 'Circle IV (South-East), New Delhi',
      rank: 'Controller',
      gps: '28.5355° N, 77.2711° E'
    };

    const notice = generateSection48Notice({
      inspectionData: inspection,
      offenderDetails: offender,
      officerDetails: officer,
      proposedCompoundingSum: proposedCompoundingSum || 25000
    });

    ok(res, notice);
  } catch (err) {
    fail(res, 500, 'NOTICE_GENERATION_FAILED', err.message);
  }
});

// ─── POST /api/v1/scans/janvishwas-notice ────────────────────────────────────
// Generates Jan Vishwas Act 2026 Form IN-1 Improvement Notice (15-day statutory cure period)
router.post('/janvishwas-notice', (req, res) => {
  try {
    const { inspectionData, offenderDetails, officerDetails } = req.body;
    
    const inspection = inspectionData || runFullMetrologyAnalysis(req.body);
    const offender = offenderDetails || {
      firm_name: req.body.manufacturer_name || 'Declared Packaging Entity',
      gstin: req.body.gstin || 'Not Declared on Pack',
      address: req.body.manufacturer_address || 'Address declared on retail package',
      commodity: req.body.product_name || 'Packaged Commodity'
    };
    const officer = officerDetails || {
      name: 'Authorized Legal Metrology Officer',
      badge: 'LMO-DL-2026',
      circle: 'Circle IV (South-East), New Delhi',
      rank: 'Controller of Legal Metrology'
    };

    const notice = generateJanVishwasNotice({
      inspectionData: inspection,
      offenderDetails: offender,
      officerDetails: officer
    });

    ok(res, notice);
  } catch (err) {
    fail(res, 500, 'JANVISHWAS_NOTICE_GENERATION_FAILED', err.message);
  }
});

// ─── GET /api/v1/scans/:id ───────────────────────────────────────────────────
// Spec 05 full response shape:
// { id, status, image_url, source_type, extracted_fields, overall_compliance,
//   violations: [...], created_at }
router.get('/:id', requireAuth, async (req, res) => {
  try {
    if (req.params.id && req.params.id.startsWith('demo-case-')) {
      const demoScan = getDemoCaseScan(req.params.id);
      if (demoScan) return ok(res, demoScan);
    }

    let scan = await Scan.findByPk(req.params.id, {
      include: [
        { model: Product,   as: 'product' },
        { model: Violation, as: 'violations' },
        { model: Report,    as: 'reports' },
      ],
    });

    if (!scan) {
      scan = await Scan.findOne({
        where: { batchId: req.params.id },
        include: [
          { model: Product,   as: 'product' },
          { model: Violation, as: 'violations' },
          { model: Report,    as: 'reports' },
        ],
        order: [['created_at', 'DESC']]
      });
    }

    if (!scan) return fail(res, 404, 'SCAN_NOT_FOUND', `No scan found with id ${req.params.id}`);

    ok(res, formatScanFull(scan));

  } catch (err) {
    fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

// ─── DELETE /api/v1/scans/:id ─────────────────────────────────────────────────
// Spec 05: admin only
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  // Admin check — fail gracefully in demo mode if no auth
  if (req.user && req.user.role !== 'admin') {
    return fail(res, 403, 'FORBIDDEN', 'Only admins can delete scans.');
  }

  try {
    const scan = await Scan.findByPk(req.params.id);
    if (!scan) return fail(res, 404, 'SCAN_NOT_FOUND', `No scan found with id ${req.params.id}`);

    // Clean up image file
    if (scan.imagePath && fs.existsSync(scan.imagePath)) {
      try { fs.unlinkSync(scan.imagePath); } catch (_) {}
    }

    await scan.destroy(); // Cascades to violations + reports (ON DELETE CASCADE)
    ok(res, { deleted: true, scan_id: req.params.id });

  } catch (err) {
    fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

// ─── RESPONSE FORMATTERS ─────────────────────────────────────────────────────

function formatScanSummary(scan) {
  return {
    id: scan.id,
    status: scan.status,
    source_type: scan.sourceType,
    overall_compliance: scan.overallCompliance,
    compliance_score: scan.complianceScore,
    total_violations: scan.totalViolations,
    high_violations: scan.highViolations,
    product_name: scan.product?.productName || (scan.extractedData ? scan.extractedData.product_name : null) || null,
    brand_name: scan.product?.brandName || (scan.extractedData ? scan.extractedData.brand_name : null) || null,
    ocr_engine: scan.ocrEngineUsed,
    created_at: scan.created_at,
  };
}

  function formatScanFull(scan) {
    let imgUrl = null;
    if (scan.imagePath) {
      try {
        const parsed = JSON.parse(scan.imagePath);
        imgUrl = parsed; // Send the array of URLs
      } catch (e) {
        if (scan.imagePath.startsWith('http')) {
          imgUrl = [scan.imagePath];
        } else {
          imgUrl = [`/uploads/${require('path').basename(scan.imagePath)}`];
        }
      }
    }
    
    return {
      id: scan.id,
      status: scan.status,
      image_url: JSON.stringify(imgUrl),
      source_type: scan.sourceType,
    overall_compliance: scan.overallCompliance,
    // overallStatus alias for frontend backward compat
    overallStatus: scan.overallCompliance,
    compliance_score: scan.complianceScore,
    total_rules_checked: scan.totalRulesChecked,
    total_violations: scan.totalViolations,
    high_violations: scan.highViolations,
    ocr_engine_used: scan.ocrEngineUsed,
    ocr_confidence_avg: scan.ocrConfidenceAvg,
    // JSONB extracted fields (spec 03)
    extracted_fields: scan.extractedFields,
    extractedFields:  scan.extractedFields,   // camelCase alias
    ocr_raw_text: scan.ocrRawText,
    error_message: scan.errorMessage || null,
    // Nested product (may be null for failed/processing scans)
    product: scan.product ? {
      id: scan.product.id,
      product_name: scan.product.productName,
      brand_name:   scan.product.brandName,
      category:     scan.product.category,
    } : null,
    // Violations — spec 05 shape with blueprint 5-status
    violations: (scan.violations || []).map(v => ({
      id:          v.id,
      rule_id:     v.rule_id || v.ruleId,
      ruleId:      v.rule_id || v.ruleId,
      rule_title:  v.rule_title || v.ruleTitle,
      ruleTitle:   v.rule_title || v.ruleTitle,
      status:      v.status,
      field:       v.field || v.affectedField,
      affectedField: v.field || v.affectedField,
      severity:    v.severity,
      detail:      v.detail,
      confidence:  v.confidence,
      
    })),
    // Latest report (if generated)
    report: scan.reports?.[0] ? {
      id:        scan.reports[0].id,
      file_url:  `/api/v1/reports/${scan.id}/download`,
      created_at: scan.reports[0].created_at,
    } : null,
    // Metrology & Measurement Science Analysis (SIH26034 core differentiator)
    metrology: scan.extractedFields ? runFullMetrologyAnalysis({
      imageHash: scan.imageHash || require('crypto').createHash('sha256').update(String(scan.id)).digest('hex'),
      netQuantity: scan.extractedFields?.net_quantity || '',
      mrp: scan.extractedFields?.mrp ? parseFloat(scan.extractedFields.mrp) : 0,
      category: scan.product?.category || 'general',
      packDimensions: { width_cm: 14.5, height_cm: 20.0, depth_cm: 4.0, shape: 'rectangular' },
      isEmbossed: false,
    }) : null,
    // Section 48 Compounding Notice with Section 50 Evidentiary Chain
    section48_notice: generateSection48Notice({
      inspectionData: {
        violations: scan.violations || [],
        timestamp: scan.created_at,
        image_hash_sha256: scan.imageHash
      },
      offenderDetails: {
        firm_name: scan.extractedFields?.manufacturer_name || scan.product?.brandName || scan.product?.productName || 'Declared Packaging Entity',
        gstin: scan.extractedFields?.gstin || 'Not Declared on Pack',
        address: scan.extractedFields?.manufacturer_address || 'Address declared on retail package',
        commodity: scan.product?.productName || scan.extractedFields?.product_name || 'Packaged Commodity'
      },
      officerDetails: {
        name: 'Authorized Legal Metrology Officer',
        badge: 'LMO-DL-2026',
        rank: 'Controller',
        circle: 'Circle IV, New Delhi'
      }
    }),
    // Jan Vishwas Act 2026 Form IN-1 Improvement Notice (15-day cure window)
    janvishwas_notice: generateJanVishwasNotice({
      inspectionData: {
        violations: scan.violations || [],
        timestamp: scan.created_at
      },
      offenderDetails: {
        firm_name: scan.extractedFields?.manufacturer_name || scan.product?.brandName || scan.product?.productName || 'Declared Packaging Entity',
        gstin: scan.extractedFields?.gstin || 'Not Declared on Pack',
        address: scan.extractedFields?.manufacturer_address || 'Address declared on retail package',
        commodity: scan.product?.productName || scan.extractedFields?.product_name || 'Packaged Commodity'
      },
      officerDetails: {
        name: 'Authorized Legal Metrology Officer',
        badge: 'LMO-DL-2026',
        circle: 'Circle IV, New Delhi',
        rank: 'Controller of Legal Metrology'
      }
    }),
    created_at: scan.created_at,
  };
}

// ─── POST /api/v1/scans/:id/report ───────────────────────────────────────────────────
// Spec 05: Generates / returns PDF report for a completed scan.
// Returns: { data: { report_id, file_url } }
router.post('/:id/report', requireAuth, async (req, res) => {
  try {
    const scan = await Scan.findByPk(req.params.id, {
      include: [
        { model: Product,   as: 'product' },
        { model: Violation, as: 'violations' },
        { model: Report,    as: 'reports' },
      ],
    });

    if (!scan) return fail(res, 404, 'SCAN_NOT_FOUND', `Scan ${req.params.id} not found`);

    if (scan.status !== 'complete') {
      return fail(res, 400, 'SCAN_NOT_COMPLETE',
        `Cannot generate report — scan status is "${scan.status}". Poll until status is "complete".`);
    }

    // Return existing report if file still present
    const existingReport = scan.reports?.[0];
    if (false) { // CACHE DISABLED FOR HACKATHON
      return ok(res, {
        report_id:  existingReport.id,
        file_url:   `/api/v1/reports/${existingReport.id}/download`,
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
        totalRulesChecked: scan.totalRulesChecked,
        totalViolations:   scan.totalViolations,
        highViolations:    scan.highViolations,
        complianceScore:   scan.complianceScore,
        overallCompliance: scan.overallCompliance,
      },
    }, reportDir);

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

// Temporary debug route to list models
router.get('/debug-models', async (req, res) => {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", { headers: { "Authorization": "Bearer " + process.env.GROQ_API_KEY } });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// ==========================================
// GET /api/v1/scans/:id/csv
// Download flat CSV for a scan
// ==========================================
router.get('/:id/csv', requireAuth, async (req, res) => {
  try {
    const scan = await Scan.findByPk(req.params.id, {
      include: [
        { model: Product,   as: 'product' },
        { model: Violation, as: 'violations' },
      ],
    });
    if (!scan) return fail(res, 404, 'SCAN_NOT_FOUND', 'Scan not found');
    
    const stats = {
      totalRulesChecked: scan.totalRulesChecked,
      totalViolations:   scan.totalViolations,
      highViolations:    scan.highViolations,
      complianceScore:   scan.complianceScore,
      overallCompliance: scan.overallCompliance,
    };
    
    const csvContent = generateCSV({
      scan: scan.toJSON(),
      product: scan.product?.toJSON() || null,
      extractedFields: scan.extractedFields || {},
      violations: scan.violations || [],
      stats
    });
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="compliance_report_${scan.id.slice(0,8)}.csv"`);
    res.send(csvContent);
  } catch(err) {
    console.error('[GET /scans/:id/csv]', err);
    fail(res, 500, 'CSV_ERROR', err.message);
  }
});

// POST /api/v1/scans/:id/cancel
router.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const scan = await Scan.findByPk(req.params.id);
    if (!scan) return fail(res, 404, 'SCAN_NOT_FOUND', 'Scan not found');
    
    if (scan.status === 'processing') {
      await scan.update({ status: 'failed', errorMessage: 'Scan cancelled by user.' });
      return ok(res, { message: 'Scan cancelled successfully' });
    }
    
    return ok(res, { message: 'Scan already finished' });
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});


// PUT /api/v1/scans/:id (Phase 4: Human-in-the-Loop Override)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { Scan, Violation, Report } = require('../models');
    const scanId = req.params.id;
    const { extractedFields, violations } = req.body;

    const scan = await Scan.findByPk(scanId);
    if (!scan) return res.status(404).json({ error: 'Scan not found' });

    // Update Extracted Fields
    if (extractedFields) {
      // NOTE: Sequelize might complain if isManuallyOverridden doesn't exist, we skip adding it to avoid auto-sync schema issues
      await scan.update({ 
        extractedFields
      });
    }

    // Update Violations
    if (violations && Array.isArray(violations)) {
      for (const vData of violations) {
        if (vData.id) {
          const v = await Violation.findByPk(vData.id);
          if (v && v.scanId === scan.id) {
            await v.update({
              status: vData.status,
              detail: vData.detail,
              affectedField: vData.affectedField
            });
          }
        }
      }
    }

    // Regenerate the PDF report with new values
    const { generateReport } = require('../services/report_service');
    
    // Fetch fresh violations to regenerate report
    const updatedViolations = await Violation.findAll({ where: { scanId } });
    const product = scan.productId ? await require('../models').Product.findByPk(scan.productId) : null;
    
    const reportDir = require('path').join(__dirname, '../uploads');
    const newReportPath = await generateReport({
      scan: scan.toJSON(),
      product: product?.toJSON() || null,
      extractedFields: scan.extractedFields,
      violations: updatedViolations.map(v => v.toJSON()),
      stats: {
        totalRulesChecked: scan.totalRulesChecked,
        totalViolations: updatedViolations.filter(v => v.status.toUpperCase() === 'POTENTIAL NON-COMPLIANCE').length,
        overallCompliance: updatedViolations.some(v => v.status.toUpperCase() === 'POTENTIAL NON-COMPLIANCE') ? 'fail' : 'pass'
      }
    }, reportDir);

    const report = await Report.findOne({ where: { scanId } });
    if (report) {
      await report.update({ filePath: newReportPath });
    }

    return res.json({ success: true, message: 'Scan manually overridden and report regenerated' });
  } catch (err) {
    console.error('Error updating scan:', err);
    res.status(500).json({ error: 'Failed to update scan' });
  }
});

module.exports = router;


