// tests/metrology_engine.test.js
// =============================================================================
// Comprehensive Unit Test Suite for MetroLens Metrology & Legal Engine
// =============================================================================

const assert = require('assert');
const {
  calculatePdpArea,
  getMinimumRequiredHeight,
  calculateUncertaintyBudget,
  evaluateConformityILAC,
  checkRule8FreeSpace,
  checkLuminanceContrast,
  checkVegNonVegDot,
  evaluateUnitSalePrice,
  runFullMetrologyAnalysis,
  DEFAULT_REFERENCE_STANDARD
} = require('../backend/services/metrology_engine');

const {
  checkSection48Compoundability,
  generateSection48Notice,
  STATUTORY_JURISDICTION
} = require('../backend/services/section48_service');

console.log('─────────────────────────────────────────────────────────────────');
console.log('🧪 RUNNING METROLENS METROLOGY & LEGAL COMPLIANCE TEST SUITE');
console.log('─────────────────────────────────────────────────────────────────\n');

let passedTests = 0;
let totalTests = 0;

const it = (typeof global.test === 'function') ? global.test : function customIt(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(`    ${err.message}\n`);
    throw err;
  }
};

// ─── TEST SUITE 1: RULE 7(2) TABLES I & II STATUTORY LOOKUP ─────────────────
console.log('[Suite 1: Rule 7(2) Tables I & II Height Slabs]');

it('Table I: Net Qty <= 200g requires 1.0mm (printed) and 2.0mm (embossed)', () => {
  const printed = getMinimumRequiredHeight({ net_quantity: '85 g', is_embossed: false });
  const embossed = getMinimumRequiredHeight({ net_quantity: '85 g', is_embossed: true });
  assert.strictEqual(printed.requiredHeightMm, 1.0);
  assert.strictEqual(embossed.requiredHeightMm, 2.0);
});

it('Table I: Net Qty 200g-500g requires 2.0mm (printed) and 4.0mm (embossed)', () => {
  const printed = getMinimumRequiredHeight({ net_quantity: '250 g', is_embossed: false });
  const embossed = getMinimumRequiredHeight({ net_quantity: '400 ml', is_embossed: true });
  assert.strictEqual(printed.requiredHeightMm, 2.0);
  assert.strictEqual(embossed.requiredHeightMm, 4.0);
});

it('Table I: Net Qty > 500g requires 4.0mm (printed) and 6.0mm (embossed)', () => {
  const printed = getMinimumRequiredHeight({ net_quantity: '1 kg', is_embossed: false });
  const embossed = getMinimumRequiredHeight({ net_quantity: '1.5 L', is_embossed: true });
  assert.strictEqual(printed.requiredHeightMm, 4.0);
  assert.strictEqual(embossed.requiredHeightMm, 6.0);
});

it('Table II: Fallback by PDP Area for count/number goods', () => {
  const tier1 = getMinimumRequiredHeight({ net_quantity: '10 nos', pdp_area_cm2: 80, is_embossed: false });
  const tier2 = getMinimumRequiredHeight({ net_quantity: '10 nos', pdp_area_cm2: 350, is_embossed: false });
  const tier3 = getMinimumRequiredHeight({ net_quantity: '10 nos', pdp_area_cm2: 1200, is_embossed: false });
  const tier4 = getMinimumRequiredHeight({ net_quantity: '10 nos', pdp_area_cm2: 3000, is_embossed: false });

  assert.strictEqual(tier1.requiredHeightMm, 1.0);
  assert.strictEqual(tier2.requiredHeightMm, 2.0);
  assert.strictEqual(tier3.requiredHeightMm, 4.0);
  assert.strictEqual(tier4.requiredHeightMm, 6.0);
});

// ─── TEST SUITE 2: PDP AREA COMPUTATION PER RULE 7(4) ────────────────────────
console.log('\n[Suite 2: Principal Display Panel Area Calculation]');

it('Rule 7(4)(a) Rectangular: Height x Width of principal face', () => {
  const res = calculatePdpArea({ shape: 'rectangular', width_cm: 15, height_cm: 20 });
  assert.strictEqual(res.pdpAreaCm2, 300);
});

it('Rule 7(4)(b) Cylindrical: 40% of (Height x Circumference)', () => {
  const res = calculatePdpArea({ shape: 'cylindrical', width_cm: 10, height_cm: 20, circumference_cm: 31.4 });
  assert.strictEqual(res.pdpAreaCm2, 251.2);
});

// ─── TEST SUITE 3: 5-COMPONENT UNCERTAINTY BUDGET (ISO/IEC 17025) ────────────
console.log('\n[Suite 3: 5-Component Uncertainty Budget]');

it('Computes u_scale, u_pix, u_rect, u_edge, u_conv and combines at k=2', () => {
  const budget = calculateUncertaintyBudget({ measuredMm: 1.82, pixelsPerMm: 8.42 });
  assert.strictEqual(budget.components.length, 5);
  assert.strictEqual(budget.coverageFactor_k, 2.0);
  assert.ok(budget.combinedStandardUncertainty_uc > 0);
  assert.ok(budget.expandedUncertainty_U > 0);
  // Expanded uncertainty must be approximately 2 * combined standard uncertainty
  const diff = Math.abs(budget.expandedUncertainty_U - (2.0 * budget.combinedStandardUncertainty_uc));
  assert.ok(diff < 0.01);
});

// ─── TEST SUITE 4: ILAC G8:09/2019 GUARD-BANDED DECISION RULE ────────────────
console.log('\n[Suite 4: ILAC G8:09/2019 Guard-Banding]');

it('Conformity: Guard-banded COMPLIANT when measured well above tolerance floor', () => {
  const budget = { expandedUncertainty_U: 0.20, coverageFactor_k: 2 };
  const res = evaluateConformityILAC({ measuredMm: 2.50, requiredMm: 2.00, uncertaintyBudget: budget });
  assert.strictEqual(res.verdict, 'COMPLIANT');
  assert.strictEqual(res.conformityStatus, 'PASS');
});

it('Conformity: Guard-banded NON-COMPLIANT when measured + U is below floor', () => {
  const budget = { expandedUncertainty_U: 0.10, coverageFactor_k: 2 };
  const res = evaluateConformityILAC({ measuredMm: 1.70, requiredMm: 2.00, uncertaintyBudget: budget });
  assert.strictEqual(res.verdict, 'NON-COMPLIANT');
  assert.strictEqual(res.conformityStatus, 'POTENTIAL NON-COMPLIANCE');
});

it('Conformity: Formats canonical citation string correctly', () => {
  const budget = { expandedUncertainty_U: 0.21, coverageFactor_k: 2 };
  const res = evaluateConformityILAC({ measuredMm: 1.82, requiredMm: 2.00, uncertaintyBudget: budget });
  assert.ok(res.canonicalString.includes('Measured 1.82 mm ± 0.21 mm (k=2)'));
  assert.ok(res.canonicalString.includes('requires 2.00 mm'));
  assert.ok(res.canonicalString.includes('ILAC G8:09/2019'));
});

// ─── TEST SUITE 5: RULE 8 FREE-SPACE PLACEMENT ───────────────────────────────
console.log('\n[Suite 5: Rule 8 Free-Space Placement]');

it('Rule 8: Passes when clearance >= 1h vertical and >= 2h horizontal', () => {
  const box = {
    height_mm: 2.0,
    width_mm: 1.0,
    clearance_mm: { top: 2.5, bottom: 2.2, left: 4.5, right: 4.2 }
  };
  const res = checkRule8FreeSpace(box);
  assert.strictEqual(res.status, 'PASS');
});

it('Rule 8: Fails when horizontal clearance is less than 2h', () => {
  const box = {
    height_mm: 1.82,
    width_mm: 0.86,
    clearance_mm: { top: 2.8, bottom: 2.4, left: 1.2, right: 4.1 } // left 1.2 < 2*1.82 (3.64mm)
  };
  const res = checkRule8FreeSpace(box);
  assert.strictEqual(res.status, 'POTENTIAL NON-COMPLIANCE');
  assert.strictEqual(res.severity, 'medium');
});

// ─── TEST SUITE 6: RULE 9(1)(b) NUMERIC LUMINANCE CONTRAST ───────────────────
console.log('\n[Suite 6: Rule 9(1)(b) Numeric Contrast Ratio]');

it('Rule 9: Calculates luminance contrast and enforces 4.5:1 floor', () => {
  // High contrast: dark text on light background
  const highContrast = checkLuminanceContrast({ fgColorRgb: [10, 10, 10], bgColorRgb: [250, 250, 250] });
  assert.ok(highContrast.measured_contrast_ratio > 10.0);
  assert.strictEqual(highContrast.status, 'PASS');

  // Low contrast: gray text on beige background
  const lowContrast = checkLuminanceContrast({ fgColorRgb: [180, 180, 180], bgColorRgb: [195, 190, 185] });
  assert.ok(lowContrast.measured_contrast_ratio < 4.5);
  assert.strictEqual(lowContrast.status, 'POTENTIAL NON-COMPLIANCE');
});

// ─── TEST SUITE 7: ENGINE 1 UNIT SALE PRICE & RULE 26 EXEMPTION ───────────────
console.log('\n[Suite 7: Engine 1 Unit Sale Price]');

it('USP: Recomputes per gram when net qty < 1kg', () => {
  const res = evaluateUnitSalePrice({ mrp: 85.00, netQuantity: '250 g' });
  assert.strictEqual(res.recomputedUsp, 0.34);
  assert.strictEqual(res.targetUnit, '₹ / g');
});

it('USP: Recomputes per kg when net qty > 1kg', () => {
  const res = evaluateUnitSalePrice({ mrp: 300.00, netQuantity: '2 kg' });
  assert.strictEqual(res.recomputedUsp, 150.00);
  assert.strictEqual(res.targetUnit, '₹ / kg');
});

it('USP: Exempt under Rule 26 for packs <= 10g or <= 10ml', () => {
  const res = evaluateUnitSalePrice({ mrp: 5.00, netQuantity: '8 g' });
  assert.strictEqual(res.status, 'NOT APPLICABLE');
  assert.strictEqual(res.exempt, true);
  assert.strictEqual(res.exemptionRule, 'Rule 26');
});

it('USP: Flags exact 1kg / 1L boundary as ambiguous per blueprint', () => {
  const res = evaluateUnitSalePrice({ mrp: 120.00, netQuantity: '1 kg' });
  assert.strictEqual(res.isExactBoundary, true);
  assert.ok(res.boundaryWarning !== null);
});

it('Fourth Schedule Item 11: Edible oil mandatory dual declaration check', () => {
  const res = evaluateUnitSalePrice({ mrp: 165.00, netQuantity: '1 L', category: 'Edible Oil' });
  assert.ok(res.edibleOilDualCheck !== null);
  assert.strictEqual(res.edibleOilDualCheck.status, 'POTENTIAL NON-COMPLIANCE');
});

// ─── TEST SUITE 8: SECTION 48(4) THREE-YEAR BAR & JURISDICTION ───────────────
console.log('\n[Suite 8: Section 48 Notice & Evidentiary Service]');

it('Section 48(4): Triggers statutory bar for prior offence within 3 years', () => {
  const check = checkSection48Compoundability({
    offenderName: 'Apex Confectioneries & Foods Ltd.',
    cinGstin: '27AABCA1234F1Z8'
  });
  assert.strictEqual(check.is_compoundable, false);
  assert.strictEqual(check.status, 'STATUTORY_BAR_ACTIVE');
  assert.ok(check.rationale.includes('Section 48(4)'));
});

it('Section 48(4): Permits compounding for first-time offender', () => {
  const check = checkSection48Compoundability({
    offenderName: 'Brand New Clean Manufacturer Ltd.',
    cinGstin: '07AABCD9999Z9Z9'
  });
  assert.strictEqual(check.is_compoundable, true);
  assert.strictEqual(check.status, 'COMPOUNDABLE');
});

it('Section 48(2)/(3): Non-nesting statutory lists for Director vs Controller', () => {
  const dir = STATUTORY_JURISDICTION.director;
  const ctrl = STATUTORY_JURISDICTION.controller;
  // Director covers Section 38, 39 exclusively
  assert.ok(dir.sections.includes('Section 38'));
  assert.ok(dir.sections.includes('Section 39'));
  assert.ok(!ctrl.sections.includes('Section 38'));
  // Controller covers Section 45, 46, 47 exclusively
  assert.ok(ctrl.sections.includes('Section 45'));
  assert.ok(ctrl.sections.includes('Section 46'));
  assert.ok(!dir.sections.includes('Section 45'));
});

it('Generates Section 48 Notice with Section 50 Appeal Evidentiary Chain', () => {
  const inspection = runFullMetrologyAnalysis({
    netQuantity: '250 g',
    mrp: 85.00
  });

  const notice = generateSection48Notice({
    inspectionData: inspection,
    offenderDetails: { firm_name: 'Test Confectioneries Ltd.', gstin: '07TEST1234F1Z8' },
    officerDetails: { name: 'P. K. Sharma', rank: 'Controller' }
  });

  assert.ok(notice.notice_number.startsWith('ML/SEC48/'));
  assert.ok(notice.evidence_chain_of_custody.original_image_sha256);
  assert.ok(notice.statutory_action.appeal_provision_section_50.includes('Section 50'));
});

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
if (typeof global.describe === 'undefined') {
  console.log('\n─────────────────────────────────────────────────────────────────');
  console.log(`🏁 TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('─────────────────────────────────────────────────────────────────');
  if (passedTests === totalTests) {
    console.log('🎉 ALL METROLENS METROLOGY & LEGAL COMPLIANCE TESTS PASSED!\n');
  } else {
    process.exit(1);
  }
}
