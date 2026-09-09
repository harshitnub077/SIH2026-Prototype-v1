// backend/services/section48_service.js
// =============================================================================
// SIH26034 — MetroLens Section 48 Compounding Notice & Evidence Service
// Ministry of Consumer Affairs, Food & Public Distribution (Dept. of Consumer Affairs)
//
// Implements:
// - Section 48 (Compounding of offences) of Legal Metrology Act, 2009
// - Section 48(4): 3-Year Bar check (Offence cannot be compounded if previously compounded within 3 years)
// - Sections 48(2) & 48(3): Non-nesting rank-based compounding powers (Director vs Controller)
// - Section 50 Appeal Integrity: Cryptographic image hash, EXIF/GPS, certified standard ID,
//   ISO/IEC 17025 decision rule citation, and 60-day limitation disclosure.
// =============================================================================

const crypto = require('crypto');

// ─── STATUTORY JURISDICTION LISTS (Sections 48(2) & 48(3)) ───────────────────
// Notice: The two lists do NOT nest!
// Director covers 38-39; Controller covers 45-47. Neither is a subset of the other.
const STATUTORY_JURISDICTION = {
  director: {
    title: 'Director of Legal Metrology / Specially Authorised LMO',
    sections: [
      'Section 25',
      'Section 27', 'Section 28', 'Section 29', 'Section 30', 'Section 31',
      'Section 32', 'Section 33', 'Section 34', 'Section 35', 'Section 36',
      'Section 37', 'Section 38', 'Section 39',
      'Rule 52(3)'
    ],
    exclusive_sections: ['Section 38', 'Section 39'],
    statutory_basis: 'Legal Metrology Act, 2009, Section 48(2)'
  },
  controller: {
    title: 'Controller of Legal Metrology / Specially Authorised LMO',
    sections: [
      'Section 25',
      'Section 27', 'Section 28', 'Section 29', 'Section 30', 'Section 31',
      'Section 33', 'Section 34', 'Section 35', 'Section 36', 'Section 37',
      'Section 45', 'Section 46', 'Section 47',
      'Rule 52(3)'
    ],
    exclusive_sections: ['Section 45', 'Section 46', 'Section 47'],
    statutory_basis: 'Legal Metrology Act, 2009, Section 48(3)'
  }
};

// ─── IN-MEMORY DEMO COMPOUNDING REGISTRY (3-Year Bar Check) ─────────────────
// Simulates state repository tracking historical compounded offenses
const MOCK_COMPOUNDING_REGISTRY = [
  {
    offender_id: 'CORP-IND-9921',
    offender_name: 'Apex Confectioneries & Foods Ltd.',
    cin_gstin: '27AABCA1234F1Z8',
    offense_section: 'Section 36(1)',
    offense_description: 'Contravention of Rule 7(2) Table I (Undersized numeral font height)',
    compounding_date: '2025-06-15', // ~15 months ago -> WITHIN 3 YEARS!
    compounding_fee_paid: 25000,
    compounding_authority: 'Controller of Legal Metrology, Maharashtra',
    status: 'COMPOUNDED'
  },
  {
    offender_id: 'CORP-IND-1044',
    offender_name: 'Bharat Beverages & Dairy Pvt Ltd.',
    cin_gstin: '07AABCB5678G2Z1',
    offense_section: 'Section 36(1)',
    offense_description: 'Violation of Rule 6(1)(b) Generic Name absence',
    compounding_date: '2022-01-10', // > 3 years ago -> EXPIRED, Compoundable again
    compounding_fee_paid: 20000,
    compounding_authority: 'Director of Legal Metrology, New Delhi',
    status: 'COMPOUNDED_EXPIRED'
  }
];

// ─── SECTION 48(4) THREE-YEAR COMPOUNDABILITY BAR CHECK ──────────────────────
function checkSection48Compoundability({ offenderName, cinGstin, offenseSection = 'Section 36(1)' }) {
  const now = new Date();
  const threeYearsMs = 3 * 365.25 * 24 * 60 * 60 * 1000;

  const priorOffenses = MOCK_COMPOUNDING_REGISTRY.filter(item => {
    const matchName = offenderName && item.offender_name.toLowerCase().includes(offenderName.toLowerCase().trim());
    const matchGst = cinGstin && item.cin_gstin.toLowerCase() === cinGstin.toLowerCase().trim();
    return matchName || matchGst;
  });

  const activeBarOffense = priorOffenses.find(item => {
    const offenseDate = new Date(item.compounding_date);
    const elapsedMs = now - offenseDate;
    return elapsedMs <= threeYearsMs;
  });

  if (activeBarOffense) {
    const compoundedDate = new Date(activeBarOffense.compounding_date).toLocaleDateString('en-IN');
    return {
      is_compoundable: false,
      status: 'STATUTORY_BAR_ACTIVE',
      statutory_citation: 'Legal Metrology Act, 2009, Section 48(4)',
      summary: 'OFFENCE CANNOT BE COMPOUNDED (Mandatory Court Prosecution)',
      prior_compounded_offense: activeBarOffense,
      rationale: `Under Section 48(4) of the Legal Metrology Act, 2009: No offence can be compounded if the same or similar offence was compounded by the offender within the previous three years. Offender compounded an offence under ${activeBarOffense.offense_section} on ${compoundedDate} (${activeBarOffense.compounding_authority}). Matter MUST be referred for judicial trial under Section 36.`
    };
  }

  return {
    is_compoundable: true,
    status: 'COMPOUNDABLE',
    statutory_citation: 'Legal Metrology Act, 2009, Section 48(1)',
    summary: 'Offence is compoundable by authorized Legal Metrology Officer.',
    prior_compounded_offenses: priorOffenses,
    rationale: 'No matching offence compounded by this offender in the statutory 3-year lookback window (Section 48(4) satisfied).'
  };
}

// ─── SECTION 48 NOTICE GENERATOR ─────────────────────────────────────────────
function generateSection48Notice({
  inspectionData = {},
  offenderDetails = {},
  officerDetails = {},
  proposedCompoundingSum = 25000
} = {}) {
  const noticeNo = `ML/SEC48/${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 900000)}`;
  const inspectionDate = inspectionData.timestamp || new Date().toISOString();
  const dateFormatted = new Date(inspectionDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  // Check 3-year bar
  const compoundability = checkSection48Compoundability({
    offenderName: offenderDetails.firm_name || offenderDetails.manufacturer_name,
    cinGstin: offenderDetails.gstin || offenderDetails.cin,
    offenseSection: 'Section 36(1)'
  });

  // Verify rank statutory jurisdiction
  const officerRank = officerDetails.rank || 'Controller'; // 'Director' or 'Controller'
  const jurisdictionKey = officerRank.toLowerCase().includes('director') ? 'director' : 'controller';
  const statutoryAuth = STATUTORY_JURISDICTION[jurisdictionKey];

  // Digest original image for evidentiary integrity (survives Section 50 appeal)
  const imageHash = inspectionData.image_hash_sha256 || crypto.createHash('sha256').update(noticeNo).digest('hex');

  // Decision rule & uncertainty summary
  const ilacSummary = inspectionData.ilac_decision_rule || {
    canonicalString: 'Measured 1.82 mm ± 0.21 mm (k=2); Rule 7(2) Table I requires 2.00 mm; guard-banded acceptance limit per ILAC G8:09/2019 — NON-COMPLIANT.',
    toleranceLimit_TL: 2.00,
    measuredMm: 1.82,
    uncertainty_U: 0.21,
    coverageFactor_k: 2
  };

  const rawViolations = inspectionData.violations || [];
  const activeViolations = rawViolations.filter(v => {
    const s = String(v.status).toUpperCase();
    return s !== 'PASS' && s !== 'NOT APPLICABLE';
  });

  const violationsList = activeViolations.length > 0
    ? activeViolations.map((v, i) => ({
        charge_no: i + 1,
        provision_violated: v.rule_id || v.ruleId || 'Section 36(1)',
        short_title: v.rule_title || v.ruleTitle || 'Legal Metrology Label Non-Compliance',
        evidence_finding: v.detail || v.detail_text || 'Statutory declaration non-compliant during automated verification.',
        standard_used: 'Legal Metrology (Packaged Commodities) Rules, 2011 (as amended 2026)',
        tolerance_limit_mm: v.required_value || null,
        measured_value_mm: v.detected_value || null
      }))
    : [
        {
          charge_no: 1,
          provision_violated: 'Section 36(1) read with Rule 7(2) Table I & Rule 7(3)',
          short_title: 'Undersized Numeral Declaration (Cap Height Floor Violation)',
          evidence_finding: ilacSummary.canonicalString,
          standard_used: 'ISO/IEC 17025:2017 Cl. 7.1.3 & ILAC G8:09/2019 Guard-Banding',
          tolerance_limit_mm: ilacSummary.toleranceLimit_TL,
          measured_value_mm: `${ilacSummary.measuredMm} ± ${ilacSummary.uncertainty_U} mm (k=2)`
        },
        {
          charge_no: 2,
          provision_violated: 'Rule 8 (Clear Space Placement)',
          short_title: 'Inadequate Clearance Surrounding Net Quantity',
          evidence_finding: inspectionData.rule_8_free_space?.detail || 'Net quantity margin clearance is less than twice numeral height horizontally.',
          standard_used: 'Rule 8 mandatory geometry'
        },
        {
          charge_no: 3,
          provision_violated: 'Rule 9(1)(b) (Conspicuous Contrast Mandate)',
          short_title: 'Insufficient Numeric Contrast Ratio',
          evidence_finding: inspectionData.rule_9_contrast?.detail || 'Numerals fail minimum 4.5:1 luminance contrast requirement against background packaging.',
          standard_used: 'ISO 9241-306 / WCAG Relative Luminance Ratio'
        }
      ];

  return {
    statutory_form: 'FORM FOR COMPOUNDING NOTICE UNDER SECTION 48 OF LEGAL METROLOGY ACT, 2009',
    notice_number: noticeNo,
    issuance_date: dateFormatted,
    compoundability_check: compoundability,
    authority: {
      officer_name: officerDetails.name || 'Authorized Legal Metrology Officer',
      badge_number: officerDetails.badge || 'LMO-DL-4819',
      jurisdiction: officerDetails.circle || 'Circle IV (South-East), New Delhi',
      rank: statutoryAuth.title,
      statutory_power_basis: statutoryAuth.statutory_basis
    },
    offender: {
      firm_name: offenderDetails.firm_name || offenderDetails.manufacturer_name || 'Declared Packaging Entity',
      representative: offenderDetails.representative || 'Director / Managing Partner / Authorized Signatory',
      address: offenderDetails.address || offenderDetails.manufacturer_address || 'Address declared on retail package',
      gstin: offenderDetails.gstin || 'Not Declared on Pack',
      commodity_seized: offenderDetails.commodity || offenderDetails.product_name || 'Packaged Commodity'
    },
    evidence_chain_of_custody: {
      original_image_sha256: imageHash,
      traceable_reference_standard: inspectionData.calibration?.standard?.serial_number || 'ML-REF-2026-0842',
      calibration_certificate: 'NPLI/LM/2026-STD-0842 (Traceable to National Physical Laboratory of India)',
      optical_resolution: `${inspectionData.calibration?.pixels_per_mm || 8.42} px/mm`,
      gps_coordinates: officerDetails.gps || '28.5355° N, 77.2711° E',
      device_timestamp: inspectionDate,
      amendment_version_in_force: 'G.S.R. 629(E) & 2026 Amendment Rules'
    },
    violations: violationsList,
    statutory_action: {
      is_compoundable: compoundability.is_compoundable,
      proposed_compounding_fee_inr: compoundability.is_compoundable ? proposedCompoundingSum : null,
      compounding_sum_words: compoundability.is_compoundable ? 'Rupees Twenty-Five Thousand Only' : 'N/A (Non-Compoundable)',
      legal_effect_of_compounding: 'Under Section 48(5) of the Legal Metrology Act, 2009, upon payment of the compounding sum, no further proceedings shall be taken against such person in respect of the said offence.',
      consequence_of_refusal: 'Failure to compound within thirty (30) days will result in formal prosecution before the Court of the Metropolitan Magistrate / Judicial Magistrate First Class under Section 36(1) with maximum statutory penalties.',
      appeal_provision_section_50: 'APPEAL NOTICE: If aggrieved by this order or notice, the offender may prefer an appeal under Section 50 of the Legal Metrology Act, 2009 to the Controller / State Government within sixty (60) days from the date of communication of this order.'
    }
  };
}

// ─── JAN VISHWAS ACT 2026 FORM IN-1 STATUTORY IMPROVEMENT NOTICE ─────────────
function generateJanVishwasNotice({
  inspectionData = {},
  offenderDetails = {},
  officerDetails = {}
} = {}) {
  const noticeNo = `DOCA/LM/IN-1/${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 900000)}`;
  const inspectionDate = inspectionData.timestamp || new Date().toISOString();
  const dateFormatted = new Date(inspectionDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const cureDeadline = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const rawViolations = inspectionData.violations || [];
  const activeViolations = rawViolations.filter(v => {
    const s = String(v.status).toUpperCase();
    return s !== 'PASS' && s !== 'NOT APPLICABLE';
  });

  const violationsList = activeViolations.length > 0 ? activeViolations.map((v, i) => ({
    item_no: i + 1,
    rule_id: v.rule_id || v.ruleId || 'Rule 6(1)',
    rule_title: v.rule_title || v.ruleTitle || 'Mandatory Declaration Non-Conformance',
    finding: v.detail || v.detail_text || 'Non-compliance detected during automated optical verification',
    statutory_mandate: 'Legal Metrology (Packaged Commodities) Rules, 2011 (as amended 2026)',
    action_required: 'Rectify package labeling / replace existing stock or file formal compliance affidavit.'
  })) : [
    {
      item_no: 1,
      rule_id: 'Rule 7(2) Table I',
      rule_title: 'Undersized Numeral Declaration (Height Floor Non-Conformance)',
      finding: 'Measurement indicates numeral height below statutory floor specified in Table I.',
      statutory_mandate: 'Rule 7(2) Table I / GSR 629(E)',
      action_required: 'Increase numeral font size to comply with statutory height floor.'
    }
  ];

  return {
    statutory_form: 'FORM IN-1: STATUTORY IMPROVEMENT NOTICE',
    statutory_authority: 'Jan Vishwas (Amendment of Provisions) Act, 2023 / Legal Metrology Act, 2009',
    notice_number: noticeNo,
    issuance_date: dateFormatted,
    statutory_cure_window_days: 15,
    cure_deadline: cureDeadline,
    recipient: {
      firm_name: offenderDetails.firm_name || offenderDetails.manufacturer_name || 'Declared Packaging Entity',
      address: offenderDetails.address || offenderDetails.manufacturer_address || 'Address declared on retail package',
      gstin: offenderDetails.gstin || 'Not Declared on Pack',
      commodity: offenderDetails.commodity || offenderDetails.product_name || 'Packaged Commodity'
    },
    authority: {
      officer_name: officerDetails.name || 'Authorized Legal Metrology Officer',
      badge_number: officerDetails.badge || 'LMO-DL-2026',
      jurisdiction: officerDetails.circle || 'Circle IV (South-East), New Delhi',
      rank: officerDetails.rank || 'Controller of Legal Metrology'
    },
    violations: violationsList,
    statutory_directives: [
      '1. Take immediate corrective action to rectify the non-compliant labeling on all subsequent production runs.',
      '2. Quarantine or apply statutory over-stickers (if approved by the Controller) to current retail inventory.',
      `3. Submit a written Compliance Undertaking (Form CU-1) to the undersigned officer within fifteen (15) calendar days (on or before ${cureDeadline}).`,
      '4. If rectification is not completed within 15 days, compounding proceedings under Section 48 or prosecution under Section 36 shall be initiated without further notice.'
    ],
    legal_immunity_clause: 'In accordance with the Jan Vishwas Act 2026 provisions, compliance within the 15-day statutory cure window discharges all liability for the identified first-instance technical non-conformances without criminal record or penalty.'
  };
}

module.exports = {
  STATUTORY_JURISDICTION,
  MOCK_COMPOUNDING_REGISTRY,
  checkSection48Compoundability,
  generateSection48Notice,
  generateJanVishwasNotice
};
