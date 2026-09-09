// backend/routes/rules.js
// ============================================================
// GET /api/v1/rules
// Spec 05: Returns the full rule-set as implemented.
// Lets judges cross-check the system's logic against the
// actual gazette text in real-time.
//
// Rules are drawn directly from:
//   Legal Metrology (Packaged Commodities) Rules, 2011
//   (as amended — GSR 629(E) dated 23.6.2017)
// ============================================================

const express = require('express');
const router = express.Router();
const { VERSIONED_RULES_REGISTRY } = require('../services/metrology_engine');

const ok = (res, data) => res.json({ data });

// ─── GET /api/v1/rules/versioned-registry ─────────────────────────────────────
router.get('/versioned-registry', (req, res) => {
  ok(res, VERSIONED_RULES_REGISTRY);
});

// ─── RULE CATALOGUE ───────────────────────────────────────────────────────────
// Source of truth for all rules implemented in rules_engine.js.
// Judges can compare these descriptions against the gazette PDF at:
//   consumeraffairs.gov.in/pages/legal-metrology-act

const RULES = [

  // ── RULE SET 1: Mandatory Presence Checks ─────────────────────────────────

  {
    rule_id: 'Rule 6(1)(a)',
    rule_title: 'Manufacturer / Packer / Importer Name and Address',
    rule_set: 1,
    severity: 'high',
    confidence: 'high',
    description:
      'Every package shall bear the name and address of the manufacturer, packer, or importer. ' +
      'Address must include at minimum: city/district name OR a 6-digit PIN code. ' +
      'A name without an address is insufficient.',
    check_method: 'Regex extraction of "Manufactured by", "Packed by", "Imported by" block. ' +
      'Presence of 6-digit PIN or recognised city/district name validated.',
    gazette_ref: 'Rule 6(1)(a), LM(PC) Rules 2011',
  },

  {
    rule_id: 'Rule 6(1)(b)',
    rule_title: 'Common or Generic Name of the Commodity',
    rule_set: 1,
    severity: 'high',
    confidence: 'high',
    description:
      'Every package shall bear the common or generic name of the commodity contained therein. ' +
      'Brand names or trademarks are NOT a substitute for the generic/common name.',
    check_method: 'Field presence check on product_name (extracted by OCR/Gemini).',
    gazette_ref: 'Rule 6(1)(b), LM(PC) Rules 2011',
  },

  {
    rule_id: 'Rule 6(1)(c)',
    rule_title: 'Net Quantity — Presence, Unit, and Metric Compliance',
    rule_set: 1,
    severity: 'high',
    confidence: 'high',
    description:
      'Net quantity must be declared. Unit must be from the legal standard set: ' +
      'g, kg, mg, ml, L (for weight/volume goods). Non-metric units (oz, lb, fl oz) are violations. ' +
      'Vague terms like "Family Size" or "Large Pack" without a numeric quantity are violations. ' +
      'A bare number without a unit is a violation.',
    check_method:
      'Regex extraction of net quantity. Unit validated against LEGAL_UNITS allowlist. ' +
      'Non-metric units detected via ILLEGAL_UNITS denylist.',
    gazette_ref: 'Rule 6(1)(c), LM(PC) Rules 2011',
  },

  {
    rule_id: 'Rule 6(1)(d)',
    rule_title: 'Month and Year of Manufacture / Packing',
    rule_set: 1,
    severity: 'medium',
    confidence: 'high',
    description:
      'Month and year of manufacture or packing must be declared. ' +
      'A year-only or day-only declaration is insufficient. ' +
      'Date must not be in the future (OCR misread detection).',
    check_method:
      'Regex extraction of mfg_date. Format validated as MM/YYYY or Month YYYY. ' +
      'Future dates flagged as OCR errors.',
    gazette_ref: 'Rule 6(1)(d), LM(PC) Rules 2011',
  },

  {
    rule_id: 'Rule 6(1)(f)',
    rule_title: 'Maximum Retail Price (MRP) — Presence and Symbol',
    rule_set: 1,
    severity: 'high',
    confidence: 'high',
    description:
      'MRP must be declared inclusive of all taxes. Must include the ₹ or "Rs." symbol. ' +
      '"Inclusive of all taxes" phrase (or equivalent) is required. ' +
      'Two different MRP values on the same label is a separate violation (contradictory declarations).',
    check_method:
      'Regex extraction of MRP. Symbol ₹/Rs. validated. ' +
      '"inclusive of all taxes" phrase checked in raw OCR text.',
    gazette_ref: 'Rule 6(1)(f), LM(PC) Rules 2011; amended GSR 629(E) 23.6.2017',
  },

  {
    rule_id: 'Rule 6(1)(g)',
    rule_title: 'Consumer Care Details (Name, Address, Phone / Email)',
    rule_set: 1,
    severity: 'medium',
    confidence: 'high',
    description:
      'Consumer care details (address, phone number, or email) must be declared. ' +
      'Keyword context required: "Consumer Helpline", "Customer Care", "Toll Free", "Helpline" ' +
      'near the number/email. A bare number without context is flagged with low confidence.',
    check_method:
      'Regex with keyword context detection. Both phone and email patterns checked. ' +
      'Indian mobile number (6-9XXXXXXXXX) as fallback with low confidence.',
    gazette_ref: 'Rule 6(1)(g), LM(PC) Rules 2011',
  },

  // ── RULE SET 2: Estimated / Image-Based Checks ─────────────────────────────
  // These require physical measurement — estimates only from image analysis.

  {
    rule_id: 'Rule 7(3)',
    rule_title: 'Minimum Letter Height (1mm minimum for < 200g/ml)',
    rule_set: 2,
    severity: 'low',
    confidence: 'estimated',
    description:
      'Declarations must be in a readable size. Minimum letter height: ' +
      '≥1mm for packages ≤200g/ml, ≥2mm for 200g–1kg/L, ≥4mm for 1–5kg/L, ≥6mm for >5kg/L. ' +
      'IMPORTANT: This check is ESTIMATED from pixel bounding boxes. ' +
      'Physical measurement required for enforcement action.',
    check_method:
      'Tesseract word bounding boxes → heightPx. ' +
      'mm = heightPx ÷ DPI × 25.4 (assumes 96 DPI for phone cameras). ' +
      'Minimum looked up from net quantity via numeral height table. ' +
      'ALWAYS returns confidence="estimated". Never a hard fail.',
    gazette_ref: 'Rule 7(3), LM(PC) Rules 2011; Schedule II numeral height table',
  },

  {
    rule_id: 'Rule 7 (PDP)',
    rule_title: 'Principal Display Panel — Declaration Placement',
    rule_set: 2,
    severity: 'low',
    confidence: 'estimated',
    description:
      'Mandatory declarations must appear on the Principal Display Panel (PDP). ' +
      'PDP is the portion of the label most likely displayed/examined under customary conditions of purchase. ' +
      'This cannot be determined from a single flat image — requires officer physical inspection.',
    check_method:
      'Manual officer toggle only. Returns estimated_fail pending confirmation. ' +
      'Clears to pass when officer explicitly marks PDP as compliant.',
    gazette_ref: 'Rule 7, LM(PC) Rules 2011',
  },

  // ── RULE SET 3: Consistency Checks ────────────────────────────────────────

  {
    rule_id: 'Rule 6 (Contradictory Declarations)',
    rule_title: 'Contradictory Declarations — MRP and Net Quantity',
    rule_set: 3,
    severity: 'high',
    confidence: 'high',
    description:
      'A label must not carry contradictory declarations. ' +
      'Two different MRP values or two different net quantity values on the same label ' +
      'constitute a violation.',
    check_method:
      'All MRP values extracted and deduplicated. If >1 distinct value found → violation. ' +
      'Same check applied to net quantity values.',
    gazette_ref: 'Rule 6, LM(PC) Rules 2011 (general prohibition on misleading declarations)',
  },

  // ── E-Commerce Rule ────────────────────────────────────────────────────────

  {
    rule_id: 'Rule 6(10)',
    rule_title: 'E-Commerce Listing — Mandatory Pre-Purchase Display',
    rule_set: 1,
    severity: 'medium',
    confidence: 'high',
    description:
      'For goods sold via e-commerce platforms, mandatory declarations must be displayed ' +
      'on the product listing page before the consumer completes the purchase. ' +
      'Required fields: MRP, net quantity, manufacturer name, country of origin (if imported). ' +
      'Only applies when source_type = "ecommerce_listing".',
    check_method:
      'Only fires when source_type = "ecommerce_listing". ' +
      'Checks for presence of MRP, net_quantity, manufacturer_name in extracted fields.',
    gazette_ref: 'Rule 6(10), LM(PC) Rules 2011; inserted by GSR 1002(E) 26.8.2019',
  },
];

// ─── GET /api/v1/rules ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const { set, severity } = req.query;

  let rules = RULES;

  // Filter by rule set (1, 2, or 3)
  if (set) {
    const setNum = parseInt(set);
    rules = rules.filter(r => r.rule_set === setNum);
  }

  // Filter by severity
  if (severity) {
    rules = rules.filter(r => r.severity === severity);
  }

  ok(res, {
    total: rules.length,
    description:
      'Rules as implemented in the MetroLens compliance engine. ' +
      'Source: Legal Metrology (Packaged Commodities) Rules, 2011 (as amended). ' +
      'Cross-check against: consumeraffairs.gov.in/pages/legal-metrology-act',
    filters_applied: { set: set || null, severity: severity || null },
    rules,
  });
});

// ─── GET /api/v1/rules/:ruleId ─────────────────────────────────────────────
router.get('/:ruleId', (req, res) => {
  // URL decode (e.g. "Rule%206(1)(a)" → "Rule 6(1)(a)")
  const searchId = decodeURIComponent(req.params.ruleId);
  const rule = RULES.find(r =>
    r.rule_id.toLowerCase() === searchId.toLowerCase() ||
    r.rule_id.toLowerCase().includes(searchId.toLowerCase())
  );

  if (!rule) {
    return res.status(404).json({
      error: { code: 'RULE_NOT_FOUND', message: `No rule found matching "${searchId}"` },
    });
  }

  ok(res, rule);
});

module.exports = router;
