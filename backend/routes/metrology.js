/**
 * MetroLens Legal Metrology Laboratory Routes (SIH26034)
 * ISO/IEC 17025:2017 & Section 48 Legal Metrology Act, 2009
 */

const express = require('express');
const router = express.Router();
const { runFullMetrologyAnalysis } = require('../services/metrology_engine');
const { generateSection48Notice } = require('../services/section48_service');

const BENCHMARKS = [
  {
    id: 'demo-case-1',
    title: 'The 60-Second Demo: Potato Chips (Rule 7 Undersized Numeral)',
    commodity: 'Crispy Wave Potato Chips',
    pack_type: 'Flexible Pouch (Rectangular)',
    category: 'Snack Food',
    net_quantity: '250 g',
    mrp: 85.00,
    is_embossed: false,
    pack_dimensions: { width_cm: 15.0, height_cm: 22.0, depth_cm: 4.5, shape: 'rectangular' },
    calibration: { standard_serial: 'ML-REF-2026-0842', nominal_size_mm: 50.0, pixels_per_mm: 8.42 },
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
    }
  },
  {
    id: 'demo-case-2',
    title: 'ILAC G8 Guard-Band Inconclusive (Edge Case / Re-Measurement Required)',
    commodity: 'SunGold Pure Refined Sunflower Oil',
    pack_type: 'PET Bottle (Cylindrical)',
    category: 'Edible Oil',
    net_quantity: '1 L',
    mrp: 165.00,
    is_embossed: false,
    pack_dimensions: { width_cm: 8.5, height_cm: 25.0, depth_cm: 8.5, shape: 'cylindrical' },
    calibration: { standard_serial: 'ML-REF-2026-0842', nominal_size_mm: 50.0, pixels_per_mm: 9.10 },
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
    calibration: { standard_serial: 'ML-REF-2026-0842', nominal_size_mm: 50.0, pixels_per_mm: 8.5 },
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
    calibration: { standard_serial: 'ML-REF-2026-0842', nominal_size_mm: 50.0, pixels_per_mm: 8.42 },
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
      firm_name: 'GlamourCosmetics India Private Limited',
      gstin: '27AABCG7721K1Z2',
      address: 'Tower B, Cyber City, Gurugram, Haryana 122002'
    }
  }
];

// GET /api/v1/metrology/benchmarks
router.get('/benchmarks', (req, res) => {
  const analyzedBenchmarks = BENCHMARKS.map(b => {
    const analysis = runFullMetrologyAnalysis({
      imageHash: require('crypto').createHash('sha256').update(b.id).digest('hex'),
      pixelsPerMm: b.calibration.pixels_per_mm,
      netQuantity: b.net_quantity,
      mrp: b.mrp,
      category: b.category,
      packDimensions: b.pack_dimensions,
      isEmbossed: b.is_embossed,
      mrpNumeralBox: b.mrp_numeral_box,
      fgColor: b.fg_color,
      bgColor: b.bg_color,
      detectedDot: b.detected_dot
    });

    const section48 = generateSection48Notice({
      inspectionData: analysis,
      offenderDetails: {
        firm_name: b.offender.firm_name,
        gstin: b.offender.gstin,
        address: b.offender.address,
        commodity: b.commodity
      }
    });

    return {
      ...b,
      analysis,
      section48
    };
  });

  res.json({
    success: true,
    data: analyzedBenchmarks,
    meta: {
      standard: 'ISO/IEC 17025:2017',
      decision_rule: 'ILAC G8:09/2019 Non-Binary Acceptance',
      statutory_basis: 'Legal Metrology (Packaged Commodities) Rules, 2011 (as amended 2026)',
      compounding_basis: 'Section 48 Legal Metrology Act, 2009'
    }
  });
});

// POST /api/v1/metrology/calibrate
router.post('/calibrate', (req, res) => {
  try {
    const analysis = runFullMetrologyAnalysis(req.body);
    res.json({ success: true, data: analysis });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/v1/metrology/section48
router.post('/section48', (req, res) => {
  try {
    const notice = generateSection48Notice(req.body);
    res.json({ success: true, data: notice });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
