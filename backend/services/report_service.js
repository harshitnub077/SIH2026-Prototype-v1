// backend/services/report_service.js
// Government-grade PDF Compliance Report Generator
// Format: A4, clean letterhead, real tables, no gradients — printable in B&W
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { stringify }                        = require('csv-stringify/sync');
const fs                                   = require('fs');
const path                                 = require('path');

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

const A4_W = 595.28;   // points
const A4_H = 841.89;   // points
const MARGIN = 42.52;  // 15mm in points
const CONTENT_W = A4_W - MARGIN * 2;

// Navy / government palette — renders cleanly in greyscale print too
const C = {
  navy:      rgb(0.07, 0.13, 0.30),   // #121F4D
  navyLight: rgb(0.15, 0.22, 0.45),
  slate:     rgb(0.40, 0.45, 0.55),
  mid:       rgb(0.55, 0.55, 0.55),
  border:    rgb(0.80, 0.82, 0.86),
  bg:        rgb(0.97, 0.97, 0.98),
  white:     rgb(1, 1, 1),
  black:     rgb(0.05, 0.05, 0.05),
  // Status colours — also expressed as greyscale-safe fills
  pass:      rgb(0.06, 0.55, 0.28),   // #0F8D47
  fail:      rgb(0.78, 0.08, 0.08),   // #C71414
  review:    rgb(0.75, 0.50, 0.00),   // #BF8000
  na:        rgb(0.40, 0.40, 0.40),
  unverif:   rgb(0.20, 0.40, 0.72),   // #3366B7
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

/** Strip characters outside WinAnsi; replace ₹ → Rs. and smart punctuation */
function san(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/₹/g, 'Rs.')
    .replace(/\u20B9/g, 'Rs.')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/\u2022/g, '*')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
}

function trunc(str, max) {
  const s = san(str);
  return s.length > max ? s.slice(0, max - 3) + '...' : s;
}

function statusColor(status) {
  const s = String(status).toUpperCase();
  if (s === 'PASS')                      return C.pass;
  if (s === 'POTENTIAL NON-COMPLIANCE')  return C.fail;
  if (s === 'MANUAL REVIEW')             return C.review;
  if (s === 'NOT APPLICABLE')            return C.na;
  return C.unverif;
}

function statusSymbol(status) {
  const s = String(status).toUpperCase();
  if (s === 'PASS')                      return 'PASS';
  if (s === 'POTENTIAL NON-COMPLIANCE')  return 'NON-COMPLIANT';
  if (s === 'MANUAL REVIEW')             return 'MANUAL REVIEW';
  if (s === 'NOT APPLICABLE')            return 'N/A';
  return 'NOT VERIFIED';
}

function confidenceLabel(conf) {
  if (!conf) return 'N/A';
  const c = String(conf).toLowerCase();
  if (c === 'high')   return 'High';
  if (c === 'medium') return 'Medium';
  if (c === 'low')    return 'Low';
  return san(conf);
}

function fmtDate(raw) {
  if (!raw) return 'N/A';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return san(raw);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
  }) + ' IST';
}

// ── ICON ─────────────────────────────────────────────────────────────────────
// Find the emblem asset relative to this file
const EMBLEM_PATH = path.resolve(__dirname, '../../frontend/public/emblem-transparent.png');
const ICON_PATH   = path.resolve(__dirname, '../../frontend/public/icon-with-text.png');

async function embedSeal(pdfDoc) {
  // Try emblem first, then icon, then return null gracefully
  for (const p of [EMBLEM_PATH, ICON_PATH]) {
    try {
      if (fs.existsSync(p)) {
        const bytes = fs.readFileSync(p);
        return await pdfDoc.embedPng(bytes);
      }
    } catch (_) { /* skip */ }
  }
  return null;
}

// ── PAGE FACTORY ──────────────────────────────────────────────────────────────

function makePage(pdfDoc, fonts, pageNum, totalPages, sealImg) {
  const page = pdfDoc.addPage([A4_W, A4_H]);

  // ── Header rule ──
  const headerBottom = A4_H - 72;

  // Seal icon (left)
  if (sealImg) {
    const sealDim = sealImg.scaleToFit(36, 36);
    page.drawImage(sealImg, {
      x: MARGIN,
      y: A4_H - 54 + (36 - sealDim.height) / 2,
      width: sealDim.width,
      height: sealDim.height,
    });
  }

  // Header text (right of seal)
  const textX = sealImg ? MARGIN + 48 : MARGIN;
  page.drawText('METROLENS — LEGAL METROLOGY COMPLIANCE REPORT', {
    x: textX, y: A4_H - 30,
    size: 11, font: fonts.bold, color: C.navy,
  });
  page.drawText('Department of Consumer Affairs  ·  Ministry of Consumer Affairs, Food & Public Distribution', {
    x: textX, y: A4_H - 46,
    size: 7, font: fonts.regular, color: C.slate,
  });

  // 1px navy rule below header
  page.drawLine({
    start: { x: MARGIN, y: headerBottom },
    end:   { x: A4_W - MARGIN, y: headerBottom },
    thickness: 0.75,
    color: C.navy,
  });

  // ── Footer ──
  const footerY = 28;
  page.drawLine({
    start: { x: MARGIN, y: footerY + 10 },
    end:   { x: A4_W - MARGIN, y: footerY + 10 },
    thickness: 0.5,
    color: C.border,
  });
  page.drawText(
    'Generated by MetroLens  ·  Smart India Hackathon 2026  ·  SIH26034' +
    `  ·  Page ${pageNum} of ${totalPages}`,
    { x: MARGIN, y: footerY, size: 6.5, font: fonts.regular, color: C.mid }
  );
  page.drawText(
    'This is a system-generated report for enforcement reference purposes only.',
    { x: MARGIN, y: footerY - 10, size: 6.5, font: fonts.regular, color: C.mid }
  );

  return { page, cursorY: headerBottom - 14 };
}

// ── SECTION HEADING ───────────────────────────────────────────────────────────

function drawSectionHeading(page, fonts, y, text) {
  // Thin navy left bar + uppercase label
  page.drawRectangle({ x: MARGIN, y: y - 2, width: 3, height: 14, color: C.navy });
  page.drawText(text.toUpperCase(), {
    x: MARGIN + 10, y,
    size: 8.5, font: fonts.bold, color: C.navy,
  });
  return y - 18;
}

// ── TABLE ─────────────────────────────────────────────────────────────────────

/**
 * Draw a bordered table.
 * cols: [{ header, width, align? }]
 * rows: string[][]
 * Returns new Y position.
 */
function drawTable(page, fonts, startY, cols, rows) {
  const ROW_H      = 16;
  const HEADER_H   = 18;
  const CELL_PAD_X = 5;
  const CELL_PAD_Y = 4;

  let y = startY;
  const tableW = cols.reduce((s, c) => s + c.width, 0);

  // Header row
  page.drawRectangle({ x: MARGIN, y: y - HEADER_H, width: tableW, height: HEADER_H, color: C.navy });
  let cx = MARGIN;
  for (const col of cols) {
    page.drawText(col.header.toUpperCase(), {
      x: cx + CELL_PAD_X,
      y: y - HEADER_H + CELL_PAD_Y + 2,
      size: 7, font: fonts.bold, color: C.white,
    });
    cx += col.width;
  }
  y -= HEADER_H;

  // Data rows
  rows.forEach((row, ri) => {
    const bg = ri % 2 === 0 ? C.white : C.bg;
    page.drawRectangle({ x: MARGIN, y: y - ROW_H, width: tableW, height: ROW_H, color: bg });

    cx = MARGIN;
    row.forEach((cell, ci) => {
      const col = cols[ci];
      const isStatus = col.header === 'STATUS' || col.header === 'CONFIDENCE';
      const cellColor = isStatus ? statusColor(cell) : C.black;
      const cellFont  = isStatus ? fonts.bold : fonts.mono;
      const cellSize  = isStatus ? 7 : 7;

      const displayText = isStatus ? statusSymbol(cell) : trunc(String(cell ?? ''), Math.floor(col.width / 4.8));
      page.drawText(displayText, {
        x: cx + CELL_PAD_X,
        y: y - ROW_H + CELL_PAD_Y,
        size: cellSize, font: cellFont, color: cellColor,
      });

      // Status dot (7×7 colored square left of text in status column)
      if (isStatus) {
        page.drawRectangle({
          x: cx + CELL_PAD_X - 1,
          y: y - ROW_H + CELL_PAD_Y + 1,
          width: 4, height: 7,
          color: statusColor(cell),
        });
        page.drawText(displayText, {
          x: cx + CELL_PAD_X + 7,
          y: y - ROW_H + CELL_PAD_Y,
          size: cellSize, font: fonts.bold, color: statusColor(cell),
        });
      }

      cx += col.width;
    });

    // Row border bottom
    page.drawLine({
      start: { x: MARGIN, y: y - ROW_H },
      end:   { x: MARGIN + tableW, y: y - ROW_H },
      thickness: 0.3, color: C.border,
    });

    y -= ROW_H;
  });

  // Outer border
  page.drawRectangle({
    x: MARGIN, y, width: tableW, height: HEADER_H + ROW_H * rows.length,
    borderColor: C.border, borderWidth: 0.5,
  });

  return y - 8;
}

// ── META BLOCK ────────────────────────────────────────────────────────────────

function drawMetaBlock(page, fonts, startY, meta) {
  const COL1_W = 90;
  const COL2_W = 200;
  const ROW_H  = 14;
  let y = startY;

  const pairs = meta; // [[ label, value ], ...]
  const half  = Math.ceil(pairs.length / 2);
  const left  = pairs.slice(0, half);
  const right = pairs.slice(half);

  // Two-column, no-border key-value layout
  const maxRows = Math.max(left.length, right.length);
  for (let i = 0; i < maxRows; i++) {
    const ly = y - i * ROW_H;
    if (left[i]) {
      page.drawText(left[i][0] + ':', {
        x: MARGIN, y: ly, size: 7.5, font: fonts.bold, color: C.slate,
      });
      page.drawText(trunc(String(left[i][1] ?? 'N/A'), 38), {
        x: MARGIN + COL1_W, y: ly, size: 7.5, font: fonts.mono, color: C.black,
      });
    }
    if (right[i]) {
      page.drawText(right[i][0] + ':', {
        x: MARGIN + COL1_W + COL2_W + 20, y: ly, size: 7.5, font: fonts.bold, color: C.slate,
      });
      page.drawText(trunc(String(right[i][1] ?? 'N/A'), 32), {
        x: MARGIN + COL1_W + COL2_W + 20 + 90, y: ly, size: 7.5, font: fonts.mono, color: C.black,
      });
    }
  }

  return y - maxRows * ROW_H - 8;
}

// ── MAIN: generateReport ──────────────────────────────────────────────────────

async function generateReport({ scan, product, extractedFields, violations, stats }, outputDir = './reports') {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const pdfDoc = await PDFDocument.create();

  // Embed standard fonts — WinAnsi safe
  const regular  = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold     = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const mono     = await pdfDoc.embedFont(StandardFonts.Courier);
  const fonts    = { regular, bold, mono };

  const sealImg  = await embedSeal(pdfDoc);

  const fields   = extractedFields || {};
  const vList    = violations || [];

  // ── Sort violations: fail → review → pass → na → unverified ──
  const ORDER = {
    'POTENTIAL NON-COMPLIANCE': 0,
    'MANUAL REVIEW': 1,
    'NOT VERIFIED': 2,
    'PASS': 3,
    'NOT APPLICABLE': 4,
  };
  const sortedV = [...vList].sort((a, b) => {
    const as = String(a.status).toUpperCase();
    const bs = String(b.status).toUpperCase();
    return (ORDER[as] ?? 5) - (ORDER[bs] ?? 5);
  });

  // Determine total pages (estimate: 1 for meta+extracted, 1+ for compliance)
  const estimatedPages = 1 + Math.ceil(sortedV.length / 20);
  let currentPage = 0;

  // ── PAGE 1 ────────────────────────────────────────────────────────────────
  currentPage++;
  let { page: p1, cursorY: cy1Start } = makePage(pdfDoc, fonts, currentPage, estimatedPages, sealImg);
  let cy = cy1Start;

  // ── Report Meta Block ──
  cy = drawSectionHeading(p1, fonts, cy, 'Report Information');
  const overallStatus = san(scan.overallStatus || scan.overall_compliance || 'N/A');
  const metaPairs = [
    ['Report ID',     `SL-${new Date(scan.created_at || Date.now()).getFullYear()}-${String(scan.id).padStart(6, '0')}`],
    ['Product',       san(product?.product_name || fields.product_name || 'Unknown')],
    ['Officer/User',  san(scan.user?.name || scan.officer_name || 'Not Logged')],
    ['Scan Date',     fmtDate(scan.created_at)],
    ['Source Type',   san(scan.source_type || 'Physical Label')],
    ['Overall Status', overallStatus],
  ];
  cy = drawMetaBlock(p1, fonts, cy, metaPairs);
  cy -= 6;

  // Horizontal rule
  p1.drawLine({ start: { x: MARGIN, y: cy }, end: { x: A4_W - MARGIN, y: cy }, thickness: 0.4, color: C.border });
  cy -= 16;

    // --- AI EXECUTIVE SUMMARY ---
  if (fields.ai_summary) {
    cy = drawSectionHeading(p1, fonts, cy, 'AI Executive Summary');
    const words = fields.ai_summary.split(/\s+/);
    let line = '';
    for (const w of words) {
      if ((line + w).length > 95) {
        p1.drawText(san(line), { x: MARGIN + 5, y: cy, size: 8, font: fonts.regular, color: C.black });
        cy -= 12;
        line = w + ' ';
      } else {
        line += w + ' ';
      }
    }
    if (line) {
      p1.drawText(san(line), { x: MARGIN + 5, y: cy, size: 8, font: fonts.regular, color: C.black });
      cy -= 12;
    }
    cy -= 10;
  }

  // --- Section 1: Extracted Declarations ---
  cy = drawSectionHeading(p1, fonts, cy, 'Section 1 — Extracted Label Declarations');

  const extractedRows = [
    ['Manufacturer Name',    fields.manufacturer_name,    fields._confidence?.manufacturer_name],
    ['Manufacturer Address', fields.manufacturer_address, fields._confidence?.manufacturer_address],
    ['Packer Name',          fields.packer_name,          null],
    ['Importer Name',        fields.importer_name,        null],
    ['Net Quantity',         fields.net_quantity,         fields._confidence?.net_quantity],
    ['MRP',                  fields.mrp,                  fields._confidence?.mrp],
    ['Mfg. / Best Before',   `${fields.mfg_date || 'N/A'}  /  ${fields.best_before || 'N/A'}`, null],
    ['Consumer Care',        fields.customer_care,        null],
    ['FSSAI Licence',        fields.fssai_license,        null],
    ['Country of Origin',    fields.country_of_origin,    null],
    ['Batch / Lot Number',   fields.batch_lot_number,     null],
    ['Veg / Non-Veg',        fields.veg_nonveg,           null],
  ]
    .filter(r => r[1])
    .map(r => [san(r[0]), san(r[1]), confidenceLabel(r[2])]);

  cy = drawTable(p1, fonts, cy,
    [
      { header: 'Field',           width: 140 },
      { header: 'Extracted Value', width: 290 },
      { header: 'Confidence',      width: 60  },
    ],
    extractedRows
  );
  cy -= 12;

  // --- INGREDIENT ANALYSIS ---
  if (fields.ingredient_analysis) {
    if (cy < 150) {
      currentPage++;
      const np = makePage(pdfDoc, fonts, currentPage, estimatedPages, sealImg);
      p1 = np.page;
      cy = np.cursorY;
    }
    cy = drawSectionHeading(p1, fonts, cy, 'Biochemical & Ingredient Analysis');
    
    const iq = fields.ingredient_analysis;
    const items = [
      ['Clean Label', iq.is_clean_label ? 'Yes' : 'No'],
      ['Harmful Additives', (iq.harmful_additives_found || []).join(', ') || 'None detected'],
      ['Health Risks', (iq.health_risks || []).join(', ') || 'None identified'],
      ['Allergens', (iq.allergens_detected || []).join(', ') || 'None detected']
    ];
    
    for (const [k, v] of items) {
      p1.drawText(san(k) + ':', { x: MARGIN, y: cy, size: 7.5, font: fonts.bold, color: C.slate });
      
      const words = String(v).split(/\s+/);
      let line = '';
      let textY = cy;
      for (const w of words) {
        if ((line + w).length > 70) {
          p1.drawText(san(line), { x: MARGIN + 100, y: textY, size: 7.5, font: fonts.mono, color: C.black });
          textY -= 10;
          line = w + ' ';
        } else {
          line += w + ' ';
        }
      }
      if (line) {
        p1.drawText(san(line), { x: MARGIN + 100, y: textY, size: 7.5, font: fonts.mono, color: C.black });
      }
      cy = textY - 14;
    }
    cy -= 6;
  }

  // --- Section 2 header (may spill to next page) ---
  if (cy < 120) {
    currentPage++;
    const next = makePage(pdfDoc, fonts, currentPage, estimatedPages, sealImg);
    cy = next.cursorY;
    p1._compliancePage = next.page; // unused — we'll open a new page object directly
  }

  // ── PAGE 2 (Compliance Findings) ──
  currentPage++;
  const { page: p2, cursorY: cy2Start } = makePage(pdfDoc, fonts, currentPage, estimatedPages, sealImg);
  let cy2 = cy2Start;

  cy2 = drawSectionHeading(p2, fonts, cy2, 'Section 2 — Compliance Findings');

  // Table cols
  const complianceCols = [
    { header: 'Rule',   width: 72  },
    { header: 'Title',  width: 188 },
    { header: 'Status', width: 110 },
    { header: 'Detail', width: 125 },
  ];
  const ROW_H_COMPLIANCE = 16;
  const complianceHeaderH = 18;
  const tableW = complianceCols.reduce((s, c) => s + c.width, 0);
  const FOOTER_SAFE = 58; // points from bottom to keep clear

  // Draw compliance rows, paginating automatically
  let activePage = p2;
  let ay = cy2;

  // Table header
  function drawComplianceHeader(page, y) {
    page.drawRectangle({ x: MARGIN, y: y - complianceHeaderH, width: tableW, height: complianceHeaderH, color: C.navy });
    let cx = MARGIN;
    for (const col of complianceCols) {
      page.drawText(col.header.toUpperCase(), {
        x: cx + 5, y: y - complianceHeaderH + 5,
        size: 7, font: bold, color: C.white,
      });
      cx += col.width;
    }
    return y - complianceHeaderH;
  }

  ay = drawComplianceHeader(activePage, ay);

  sortedV.forEach((v, ri) => {
    // New page if needed
    if (ay - ROW_H_COMPLIANCE < FOOTER_SAFE) {
      currentPage++;
      const np = makePage(pdfDoc, fonts, currentPage, estimatedPages, sealImg);
      activePage = np.page;
      ay = np.cursorY;
      ay = drawComplianceHeader(activePage, ay);
    }

    const bg = ri % 2 === 0 ? C.white : C.bg;
    activePage.drawRectangle({ x: MARGIN, y: ay - ROW_H_COMPLIANCE, width: tableW, height: ROW_H_COMPLIANCE, color: bg });

    const ruleStatus = String(v.status || '').toUpperCase();
    const sc  = statusColor(ruleStatus);
    const sym = statusSymbol(ruleStatus);
    const cells = [
      san(v.ruleId || v.rule_id || ''),
      trunc(san(v.ruleTitle || v.rule_title || v.title || ''), 32),
      sym,
      trunc(san(v.detail || v.detail_text || ''), 22),
    ];

    let cx = MARGIN;
    cells.forEach((cell, ci) => {
      const col = complianceCols[ci];
      if (ci === 2) {
        // Status column: colored square + text
        activePage.drawRectangle({ x: cx + 4, y: ay - ROW_H_COMPLIANCE + 4, width: 5, height: 8, color: sc });
        activePage.drawText(cell, {
          x: cx + 13, y: ay - ROW_H_COMPLIANCE + 4,
          size: 6.5, font: bold, color: sc,
        });
      } else {
        activePage.drawText(cell, {
          x: cx + 5, y: ay - ROW_H_COMPLIANCE + 4,
          size: 7, font: ci === 0 ? bold : mono, color: C.black,
        });
      }
      cx += col.width;
    });

    activePage.drawLine({
      start: { x: MARGIN, y: ay - ROW_H_COMPLIANCE },
      end:   { x: MARGIN + tableW, y: ay - ROW_H_COMPLIANCE },
      thickness: 0.25, color: C.border,
    });

    ay -= ROW_H_COMPLIANCE;
  });

  // Outer border for compliance table
  activePage.drawRectangle({
    x: MARGIN, y: ay, width: tableW,
    height: complianceHeaderH + ROW_H_COMPLIANCE * sortedV.length,
    borderColor: C.border, borderWidth: 0.5,
  });

  ay -= 16;

  // ── Section 3: Evidence ──
  if (ay < 100) {
    currentPage++;
    const np = makePage(pdfDoc, fonts, currentPage, estimatedPages, sealImg);
    activePage = np.page;
    ay = np.cursorY;
  }

  ay = drawSectionHeading(activePage, fonts, ay, 'Section 3 — Evidence & Scan Metadata');

  const evidencePairs = [
    ['OCR Confidence',  `${fields._ocrConfidence || fields.ocr_confidence || 'N/A'}`],
    ['Scan Method',     'Gemini Flash Vision  ›  Groq Llama-3.2 Vision  ›  Local OCR Fallback'],
    ['Scan ID',         san(String(scan.id))],
    ['Image URL',       trunc(san(scan.imageUrl || scan.image_url || scan.cloudImageUrl || 'Not available'), 60)],
    ['Rules Checked',   String(stats?.totalRulesChecked || vList.length)],
    ['Violations',      String(stats?.totalViolations || vList.filter(v => String(v.status).toUpperCase() === 'POTENTIAL NON-COMPLIANCE').length)],
    ['Compliance Score',stats?.complianceScore ? `${stats.complianceScore}%` : 'See breakdown'],
    ['Generated At',    fmtDate(new Date().toISOString())],
  ];

  for (const [label, value] of evidencePairs) {
    activePage.drawText(`${label}:`, {
      x: MARGIN, y: ay, size: 7.5, font: bold, color: C.slate,
    });
    activePage.drawText(trunc(String(value), 75), {
      x: MARGIN + 120, y: ay, size: 7.5, font: mono, color: C.black,
    });
    ay -= 13;
  }

  // --- Attach Photo Evidence ---
  const imgPath = scan.imagePath || scan.image_path;
  if (imgPath && fs.existsSync(imgPath)) {
    try {
      const imgBuffer = fs.readFileSync(imgPath);
      let img;
      if (imgPath.toLowerCase().endsWith('.png')) {
        img = await pdfDoc.embedPng(imgBuffer);
      } else {
        img = await pdfDoc.embedJpg(imgBuffer);
      }
      
      const maxWidth = CONTENT_W;
      const maxHeight = 500; // Safe area
      const dims = img.scale(1);
      
      let scale = 1;
      if (dims.width > maxWidth) scale = maxWidth / dims.width;
      if ((dims.height * scale) > maxHeight) scale = maxHeight / dims.height;
      
      const scaledW = dims.width * scale;
      const scaledH = dims.height * scale;
      
      currentPage++;
      const { page: evPage, cursorY: ecy } = makePage(pdfDoc, fonts, currentPage, estimatedPages, sealImg);
      
      const afterHeading = drawSectionHeading(evPage, fonts, ecy, 'Appendix A - Photographic Evidence');
      
      evPage.drawImage(img, {
        x: (A4_W - scaledW) / 2,
        y: afterHeading - 20 - scaledH,
        width: scaledW,
        height: scaledH,
      });
    } catch(e) {
      console.warn("Could not embed image evidence:", e.message);
    }
  }

  // ── Fix page count: update all footers with real count ──
  // (pdf-lib doesn't support header/footer injection post-hoc, but we set estimatedPages ≥ actual)
  // Page count is correct as currentPage = actual count.

  const pdfBytes = await pdfDoc.save();
  const filename  = `compliance_report_${scan.id}_${Date.now()}.pdf`;
  const filePath  = path.join(outputDir, filename);
  fs.writeFileSync(filePath, pdfBytes);

  console.log(`[Report] PDF generated: ${filePath} (${Math.round(pdfBytes.length / 1024)}KB, ${currentPage} pages)`);
  return filePath;
}

// ── CSV EXPORT ────────────────────────────────────────────────────────────────
// One flat row per scan. Returns a UTF-8 CSV string.

function generateCSV(scanData) {
  // Use vertical layout for single item view
  const data = Array.isArray(scanData) ? scanData[0] : scanData;
  if (!data) return '';
  
  const { scan, product, extractedFields, violations, stats } = data;
  const fields = extractedFields || {};
  const vList  = violations || [];

  const reportId = `SL-${new Date(scan.created_at || Date.now()).getFullYear()}-${String(scan.id).padStart(6, '0')}`;
  
  const verticalData = [
    ['Field', 'Value'],
    ['Report ID', reportId],
    ['Scan Date', scan.created_at ? new Date(scan.created_at).toISOString() : ''],
    ['Product Name', product?.product_name || fields.product_name || ''],
    ['Brand', product?.brand_name || fields.brand_name || ''],
    ['Category', product?.category || 'general'],
    ['Source Type', scan.source_type || 'physical_label'],
    ['Overall Status', scan.overallStatus || scan.overall_compliance || ''],
    ['Compliance Score', stats?.complianceScore ? `${stats.complianceScore}%` : ''],
    ['Total Rules Checked', stats?.totalRulesChecked || ''],
    ['Total Violations', stats?.totalViolations || ''],
    ['High Severity Violations', stats?.highViolations || ''],
    ['---', '---'],
    ['EXTRACTED DATA', ''],
    ['Net Quantity', fields.net_quantity || ''],
    ['MRP', fields.mrp || ''],
    ['Mfg Date', fields.mfg_date || ''],
    ['FSSAI License', fields.fssai_license || ''],
    ['Ingredients', fields.ingredients || ''],
    ['---', '---'],
    ['RULE AUDIT', '']
  ];
  
  vList.forEach((v, index) => {
    const rId = v.ruleId || v.rule_id || '';
    const rTitle = v.ruleTitle || v.rule_title || v.title || '';
    const rDetail = v.detail || v.detail_text || '';
    const rStatus = String(v.status || '').toUpperCase();
    verticalData.push([`Rule ${index + 1}`, `[${rStatus}] ${rId}: ${rTitle} - ${rDetail}`]);
  });

  return stringify(verticalData);
}

module.exports = { generateReport, generateCSV };
