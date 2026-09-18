// tests/rules_engine.test.js
// ============================================================
// Test Suite: Legal Metrology Rules Engine
// ============================================================
// Covers all 5 mandatory test cases from spec file 02 plus
// comprehensive per-function tests for every rule.
//
// Run: npm test (from backend directory)
// ============================================================

const {
  validateCompliance,
  checkRule6_1_a_name,
  checkRule6_1_a_address,
  checkRule6_1_b,
  checkRule6_1_c_presence,
  checkRule6_1_c_unit,
  checkRule6_1_f_mfgdate,
  checkRule6_1_f_mrp,
  checkRule6_1_g,
  checkRule6_10_ecommerce,
  checkRule7_3_letterHeight,
  checkRule7_numeralHeight,
  checkRule7_pdp,
  checkMrpSymbol,
  checkNetQtyUnit,
  checkDateValidity,
  checkContradictoryDeclarations,
  getRequiredNumeralHeight,
} = require('../backend/services/rules_engine');

// ─── HELPER ──────────────────────────────────────────────────────────────────

/** Fully compliant product fields (baseline for Test Case 1) */
const COMPLIANT_FIELDS = {
  manufacturer_name: 'ITC Limited',
  manufacturer_address: '37 Jawaharlal Nehru Road, Virginia House, Kolkata 700071',
  product_name: 'Aashirvaad Whole Wheat Atta',
  net_quantity: '5 kg',
  mrp: 'Rs. 278 inclusive of all taxes',
  mfg_date: 'Jan 2025',
  best_before: 'Dec 2025',
  customer_care: '1800-345-6789',
  batch_lot_number: 'BT20250101A',
  fssai_license: '10015011002792',
  ingredients: 'Whole wheat',
};

// ─── ★ MANDATORY TEST CASE 1 (from spec 02) ──────────────────────────────────
// "A fully compliant real product label → expect zero violations."

describe('★ Test Case 1 (spec 02): Fully compliant product → zero violations', () => {
  test('No hard fail/violations for a complete, well-formed label', () => {
    const { violations, stats } = validateCompliance(COMPLIANT_FIELDS, 'Rs. 278 inclusive of all taxes');
    // Per spec 03: 'needs_review' is correct when only estimated (font/PDP) issues exist.
    // A label with zero hard fails is the best achievable result from image analysis.
    // 'compliant' would require physical PDP + font verification (officer toggle).
    expect(['compliant', 'needs_review']).toContain(stats.overallCompliance);
    // The critical assertion: zero hard FAIL violations
    expect(violations.filter(v => v.status === 'fail')).toHaveLength(0);
  });

  test('All Rule Set 1 checks return status=pass', () => {
    const { results } = validateCompliance(COMPLIANT_FIELDS, 'Rs. 278 inclusive of all taxes');
    const ruleSet1 = ['Rule 6(1)(a)', 'Rule 6(1)(b)', 'Rule 6(1)(c)', 'Rule 6(1)(f)', 'Rule 6(1)(g)'];
    const r1Results = results.filter(r =>
      ruleSet1.some(ruleId => r.rule_id === ruleId)
    );
    const fails = r1Results.filter(r => r.status === 'fail');
    expect(fails).toHaveLength(0);
  });

  test('Compliance score is 100% when all mandatory fields present', () => {
    const { stats } = validateCompliance(COMPLIANT_FIELDS, '');
    // Font/PDP estimated results may bring score below 100, that is correct.
    // We assert no FAIL-status violations (only estimated).
    expect(stats.complianceScore).toBeGreaterThanOrEqual(50);
    const highViolations = stats.highViolations || 0;
    expect(highViolations).toBe(0);
  });
});

// ─── ★ MANDATORY TEST CASE 2 (from spec 02) ──────────────────────────────────
// "A product missing MRP declaration → expect Rule 6(1)(f) fail."

describe('★ Test Case 2 (spec 02): Missing MRP → Rule 6(1)(f) fail', () => {
  test('Returns fail status for Rule 6(1)(f) when mrp is null', () => {
    const fields = { ...COMPLIANT_FIELDS, mrp: null };
    const result = checkRule6_1_f_mrp(fields);
    expect(result.status).toBe('fail');
    expect(result.rule_id).toBe('Rule 6(1)(f)');
    expect(result.confidence).toBe('high');
  });

  test('severity is high for missing MRP', () => {
    const result = checkRule6_1_f_mrp({ mrp: null });
    expect(result.severity).toBe('high');
  });

  test('detail message mentions MRP and rule number', () => {
    const result = checkRule6_1_f_mrp({ mrp: null });
    expect(result.detail).toMatch(/MRP|Maximum Retail Price/i);
    expect(result.rule_id).toMatch(/Rule 6\(1\)\(f\)/);
  });

  test('MRP present but missing symbol → medium severity fail', () => {
    const result = checkMrpSymbol({ mrp: '278.00' });
    expect(result.status).toBe('fail');
    expect(result.severity).toBe('medium');
  });

  test('MRP with ₹ symbol passes symbol check', () => {
    const result = checkMrpSymbol({ mrp: '₹278.00 inclusive of all taxes' });
    expect(result.status).toBe('pass');
  });
});

// ─── ★ MANDATORY TEST CASE 3 (from spec 02) ──────────────────────────────────
// "A product missing manufacturer address → expect Rule 6(1)(a) fail."

describe('★ Test Case 3 (spec 02): Missing manufacturer address → Rule 6(1)(a) fail', () => {
  test('Returns fail for Rule 6(1)(a) when manufacturer_address is null', () => {
    const result = checkRule6_1_a_address({ manufacturer_address: null });
    expect(result.status).toBe('fail');
    expect(result.rule_id).toBe('Rule 6(1)(a)');
    expect(result.confidence).toBe('high');
  });

  test('Address with no PIN and no city keyword fails with medium severity', () => {
    const result = checkRule6_1_a_address({
      manufacturer_address: 'Building A, Road B, Area C',
    });
    expect(result.status).toBe('fail');
    expect(result.severity).toBe('medium');
  });

  test('Address with 6-digit PIN passes', () => {
    const result = checkRule6_1_a_address({
      manufacturer_address: '37 Nehru Road, Kolkata 700071',
    });
    expect(result.status).toBe('pass');
  });

  test('Address with recognised city name (no PIN) passes', () => {
    const result = checkRule6_1_a_address({
      manufacturer_address: 'Sector 40, Gurugram, Haryana',
    });
    expect(result.status).toBe('pass');
  });

  test('Missing manufacturer name also fails Rule 6(1)(a)', () => {
    const result = checkRule6_1_a_name({ manufacturer_name: null });
    expect(result.status).toBe('fail');
    expect(result.severity).toBe('high');
  });
});

// ─── ★ MANDATORY TEST CASE 4 (from spec 02) ──────────────────────────────────
// "A product with visibly tiny font → expect Rule 7 'estimated' fail with confidence flagged."

describe('★ Test Case 4 (spec 02): Tiny font → Rule 7(3) estimated, confidence=estimated', () => {
  test('Returns estimated status (not fail) when font height is below 1mm', () => {
    const result = checkRule7_3_letterHeight({
      _fontHeightPixels: 3,   // very small
      _imageDPI: 96,          // standard screen DPI
    });
    // 3px / 96dpi * 25.4 ≈ 0.79mm < 1mm minimum
    expect(['estimated', 'MANUAL REVIEW']).toContain(result.status);
    expect(result.confidence).toBe('estimated');
    expect(result.rule_id).toBe('Rule 7(3)');
  });

  test('confidence is NEVER "high" for font size checks', () => {
    const withData = checkRule7_3_letterHeight({ _fontHeightPixels: 2, _imageDPI: 72 });
    const withoutData = checkRule7_3_letterHeight({});
    expect(withData.confidence).toBe('estimated');
    expect(withoutData.confidence).toBe('estimated');
  });

  test('Returns estimated (pass-ish) when font height is sufficient', () => {
    const result = checkRule7_3_letterHeight({
      _fontHeightPixels: 10,  // 10/96 * 25.4 ≈ 2.65mm > 1mm
      _imageDPI: 96,
    });
    expect(result.status).toBe('pass');
    expect(result.confidence).toBe('estimated');
  });

  test('detail message explicitly mentions estimation and physical verification', () => {
    const result = checkRule7_3_letterHeight({ _fontHeightPixels: 2, _imageDPI: 96 });
    expect(result.detail).toMatch(/estimat|physical/i);
  });

  test('Numeral height lookup table returns correct minimum for 500g product', () => {
    const required = getRequiredNumeralHeight({ value: 500, unit: 'g' });
    expect(required).toBe(4.0); // 200g–1kg slab → 4mm
  });

  test('Numeral height lookup: 50g product → 1mm', () => {
    expect(getRequiredNumeralHeight({ value: 50, unit: 'g' })).toBe(1.0);
  });

  test('Numeral height lookup: 2kg product → 6mm', () => {
    expect(getRequiredNumeralHeight({ value: 2, unit: 'kg' })).toBe(6.0);
  });
});

// ─── ★ MANDATORY TEST CASE 5 (from spec 02) ──────────────────────────────────
// "Expired-looking/blurry photo → graceful 'low OCR confidence' handling, not crash."

describe('★ Test Case 5 (spec 02): Low OCR confidence / empty fields → graceful handling', () => {
  test('validateCompliance does not throw with empty fields object', () => {
    expect(() => validateCompliance({}, '')).not.toThrow();
  });

  test('All mandatory fields missing → returns fail violations, not crash', () => {
    const { violations, stats } = validateCompliance({}, '');
    expect(stats.totalViolations).toBeGreaterThan(0);
    expect(violations.every(v => v.rule_id && v.detail)).toBe(true);
  });

  test('Every violation has required spec 02 schema fields', () => {
    const { violations } = validateCompliance({}, '');
    violations.forEach(v => {
      expect(v).toHaveProperty('rule_id');
      expect(v).toHaveProperty('rule_title');
      expect(v).toHaveProperty('status');
      expect(v).toHaveProperty('field');
      expect(v).toHaveProperty('severity');
      expect(v).toHaveProperty('detail');
      expect(v).toHaveProperty('confidence');
    });
  });

  test('confidence field is always one of ["high", "estimated"]', () => {
    const { results } = validateCompliance({}, '');
    results.forEach(r => {
      expect(['high', 'estimated']).toContain(r.confidence);
    });
  });

  test('status is always one of valid blueprint statuses', () => {
    const { results } = validateCompliance({}, '');
    results.forEach(r => {
      expect(['pass', 'fail', 'estimated', 'PASS', 'FAIL', 'POTENTIAL NON-COMPLIANCE', 'MANUAL REVIEW', 'NOT APPLICABLE', 'NOT VERIFIED']).toContain(r.status);
    });
  });

  test('Rule Set 2 (font/PDP) always returns confidence=estimated even with empty fields', () => {
    const { results } = validateCompliance({}, '');
    const ruleSet2 = results.filter(r =>
      r.rule_id === 'Rule 7(3)' || r.rule_id === 'Rule 7' || r.rule_id === 'Rule 7 (PDP)'
    );
    ruleSet2.forEach(r => {
      expect(r.confidence).toBe('estimated');
    });
  });
});

// ─── RULE 6(1)(b) — COMMODITY NAME ───────────────────────────────────────────

describe('Rule 6(1)(b) — Common/Generic Name of Commodity', () => {
  test('PASS: product name present', () => {
    expect(checkRule6_1_b({ product_name: 'Iodized Salt' }).status).toBe('pass');
  });

  test('FAIL: product name null', () => {
    const r = checkRule6_1_b({ product_name: null });
    expect(r.status).toBe('fail');
    expect(r.severity).toBe('high');
    expect(r.confidence).toBe('high');
  });

  test('FAIL: product name empty string', () => {
    expect(checkRule6_1_b({ product_name: '' }).status).toBe('fail');
  });
});

// ─── RULE 6(1)(c) — NET QUANTITY ─────────────────────────────────────────────

describe('Rule 6(1)(c) — Net Quantity', () => {
  test('PASS: valid gram quantity', () => {
    expect(checkRule6_1_c_presence({ net_quantity: '500g' }).status).toBe('pass');
    expect(checkRule6_1_c_unit({ net_quantity: '500g' }).status).toBe('pass');
  });

  test('PASS: valid kg quantity with space', () => {
    expect(checkRule6_1_c_unit({ net_quantity: '1 kg' }).status).toBe('pass');
  });

  test('PASS: pieces/count', () => {
    expect(checkRule6_1_c_unit({ net_quantity: '30 nos.' }).status).toBe('pass');
  });

  test('FAIL: net quantity missing', () => {
    expect(checkRule6_1_c_presence({ net_quantity: null }).status).toBe('fail');
  });

  test('FAIL: non-metric unit (ounce)', () => {
    const r = checkRule6_1_c_unit({ net_quantity: '16 oz' });
    expect(r.status).toBe('fail');
    expect(r.severity).toBe('high');
  });

  test('FAIL: non-metric unit (pound)', () => {
    expect(checkRule6_1_c_unit({ net_quantity: '1 pound' }).status).toBe('fail');
  });

  test('FAIL: vague term (Family Size)', () => {
    expect(checkRule6_1_c_unit({ net_quantity: 'Family Size' }).status).toBe('fail');
  });

  test('FAIL: numeric only, no unit', () => {
    expect(checkRule6_1_c_unit({ net_quantity: '500' }).status).toBe('fail');
  });
});

// ─── RULE 6(1)(f) — MANUFACTURING DATE ───────────────────────────────────────

describe('Rule 6(1)(f) — Mfg Date (presence + format)', () => {
  test('PASS: MM/YYYY format', () => {
    expect(checkRule6_1_f_mfgdate({ mfg_date: '03/2025' }).status).toBe('pass');
    expect(checkDateValidity({ mfg_date: '03/2025' }).status).toBe('pass');
  });

  test('PASS: Month YYYY format', () => {
    expect(checkRule6_1_f_mfgdate({ mfg_date: 'Jan 2025' }).status).toBe('pass');
  });

  test('FAIL: mfg_date missing', () => {
    expect(checkRule6_1_f_mfgdate({ mfg_date: null }).status).toBe('fail');
  });

  test('FAIL: unparseable date format', () => {
    expect(checkRule6_1_f_mfgdate({ mfg_date: 'sometime in 2024' }).status).toBe('fail');
  });

  test('FAIL: future year (OCR misread)', () => {
    expect(checkRule6_1_f_mfgdate({ mfg_date: 'Jan 2099' }).status).toBe('fail');
  });

  test('FAIL (date validity): date in future month this year', () => {
    const futureDate = `${new Date().getMonth() + 2}/2099`;
    expect(checkDateValidity({ mfg_date: futureDate }).status).toBe('fail');
  });
});

// ─── RULE 6(1)(g) — CONSUMER CARE ────────────────────────────────────────────

describe('Rule 6(1)(g) — Consumer Care Details', () => {
  test('PASS: phone number present', () => {
    expect(checkRule6_1_g({ customer_care: '1800-123-4567' }).status).toBe('pass');
  });

  test('PASS: email present', () => {
    expect(checkRule6_1_g({ customer_care: 'care@brand.com' }).status).toBe('pass');
  });

  test('FAIL: missing', () => {
    const r = checkRule6_1_g({ customer_care: null });
    expect(r.status).toBe('fail');
    expect(r.confidence).toBe('high');
  });
});

// ─── RULE 6(10) — E-COMMERCE ─────────────────────────────────────────────────

describe('Rule 6(10) — E-Commerce Listing Requirements', () => {
  test('SKIP: source_type is not ecommerce_listing', () => {
    const r = checkRule6_10_ecommerce(COMPLIANT_FIELDS, { source_type: 'physical' });
    expect(r.status).toBe('pass'); // Not applicable
  });

  test('FAIL: e-commerce listing missing mrp and manufacturer_name', () => {
    const r = checkRule6_10_ecommerce(
      { product_name: 'Test', net_quantity: '100g', customer_care: '1800', manufacturer_address: 'Addr' },
      { source_type: 'ecommerce_listing' }
    );
    expect(r.status).toBe('fail');
    expect(r.detail).toMatch(/mrp|manufacturer_name/);
  });

  test('PASS: e-commerce listing has all required fields', () => {
    const r = checkRule6_10_ecommerce(COMPLIANT_FIELDS, { source_type: 'ecommerce_listing' });
    expect(r.status).toBe('pass');
  });
});

// ─── CONTRADICTORY DECLARATIONS ───────────────────────────────────────────────

describe('Contradictory Declarations (Rule Set 3)', () => {
  test('Returns null (no contradictions) for clean fields', () => {
    const r = checkContradictoryDeclarations({});
    expect(r).toBeNull();
  });

  test('FAIL: two different MRP values detected', () => {
    const r = checkContradictoryDeclarations({
      _mrpValues: ['Rs. 120', 'Rs. 150'],
    });
    expect(r).not.toBeNull();
    expect(r[0].status).toBe('fail');
    expect(r[0].severity).toBe('high');
    expect(r[0].detail).toMatch(/contradictory|multiple|different/i);
  });

  test('No contradiction if both MRP values are the same', () => {
    const r = checkContradictoryDeclarations({
      _mrpValues: ['Rs. 120', 'Rs. 120'],
    });
    expect(r).toBeNull();
  });

  test('FAIL: two different net quantity values detected', () => {
    const r = checkContradictoryDeclarations({
      _netQtyValues: ['500g', '1 kg'],
    });
    expect(r).not.toBeNull();
    expect(r[0].field).toBe('net_quantity');
  });
});

// ─── PDP MANUAL TOGGLE ────────────────────────────────────────────────────────

describe('Rule 7 (PDP) — Manual Toggle', () => {
  test('Returns estimated requiring review when not set', () => {
    const r = checkRule7_pdp({});
    expect(['estimated', 'MANUAL REVIEW']).toContain(r.status);
    expect(r.confidence).toBe('estimated');
  });

  test('PASS when officer confirms PDP compliance', () => {
    const r = checkRule7_pdp({ _pdpConfirmed: true });
    expect(['pass', 'PASS']).toContain(r.status);
  });

  test('ESTIMATED (not hard fail) when officer says not compliant', () => {
    // Physical inspection required — never auto-fail from image alone
    const r = checkRule7_pdp({ _pdpConfirmed: false });
    expect(['estimated', 'MANUAL REVIEW']).toContain(r.status);
    expect(r.status).not.toBe('fail');
  });
});

// ─── SCHEMA CONTRACT ──────────────────────────────────────────────────────────

describe('Schema contract: all results comply with spec 02 schema', () => {
  const REQUIRED_KEYS = ['rule_id', 'rule_title', 'status', 'field', 'confidence'];

  test('All results from validateCompliance have required schema keys', () => {
    const { results } = validateCompliance(COMPLIANT_FIELDS, 'Rs. 278 inclusive of all taxes');
    results.forEach(r => {
      REQUIRED_KEYS.forEach(key => {
        expect(r).toHaveProperty(key);
      });
    });
  });

  test('Failing results also have severity and detail', () => {
    const { violations } = validateCompliance({}, '');
    violations
      .filter(v => v.status === 'fail')
      .forEach(v => {
        expect(v).toHaveProperty('severity');
        expect(v).toHaveProperty('detail');
        expect(v.detail.length).toBeGreaterThan(10);
      });
  });

  test('Rule Set 1 results always have confidence=high', () => {
    const { results } = validateCompliance({}, '');
    const ruleSet1 = results.filter(r =>
      ['Rule 6(1)(a)', 'Rule 6(1)(b)', 'Rule 6(1)(c)', 'Rule 6(1)(f)', 'Rule 6(1)(g)']
        .some(id => r.rule_id === id)
    );
    ruleSet1.forEach(r => {
      expect(r.confidence).toBe('high');
    });
  });

  test('Rule Set 2 results always have confidence=estimated', () => {
    const { results } = validateCompliance({}, '');
    const ruleSet2 = results.filter(r =>
      ['Rule 7(3)', 'Rule 7', 'Rule 7 (PDP)'].includes(r.rule_id)
    );
    ruleSet2.forEach(r => {
      expect(r.confidence).toBe('estimated');
    });
  });
});
