// backend/scripts/seedDatabase.js
// ============================================================
// Initial Catalog Sync for SIH26034 MetroLens
// Updated for spec 03: Product table + JSONB extracted_fields
// ============================================================
// Usage: npm run db:seed
// Idempotent — safe to run multiple times (clears existing data first)

const { sequelize, User, Product, Scan, Violation, Report, syncDatabase } = require('../models');
const bcrypt = require('bcryptjs');
const { randomUUID: uuidv4 } = require('crypto');

const SEED_PRODUCTS = [
  // ── Fully Compliant Products ───────────────────────────────────────────────
  {
    product: { productName: 'Aashirvaad Whole Wheat Atta', brandName: 'ITC', category: 'food' },
    scan: {
      sourceType: 'physical_label',
      overallCompliance: 'compliant',
      complianceScore: 100,
      totalRulesChecked: 15,
      totalViolations: 0,
      highViolations: 0,
      ocrEngineUsed: 'tesseract',
      extractedFields: {
        product_name: 'Aashirvaad Whole Wheat Atta',
        brand_name: 'ITC',
        net_quantity: '5 kg',
        mrp: 'Rs. 278 inclusive of all taxes',
        mfg_date: 'Jan 2025',
        best_before: 'Dec 2026',
        manufacturer_name: 'ITC Limited',
        manufacturer_address: '37 J.L. Nehru Road, Kolkata 700071, West Bengal',
        customer_care: '1800-345-6789',
        batch_lot_number: 'BT202501',
        fssai_license: '10015011002792',
        ingredients: 'Whole wheat (100%)',
      },
      ocrRawText: 'Aashirvaad Whole Wheat Atta 5 kg MRP Rs. 278 inclusive of all taxes...',
    },
    violations: [],
  },

  // ── Non-Compliant: Missing MRP ─────────────────────────────────────────────
  {
    product: { productName: 'Generic Rice Flour', brandName: 'Local Brand', category: 'food' },
    scan: {
      sourceType: 'physical_label',
      overallCompliance: 'non_compliant',
      complianceScore: 60,
      totalRulesChecked: 15,
      totalViolations: 2,
      highViolations: 2,
      ocrEngineUsed: 'tesseract',
      extractedFields: {
        product_name: 'Rice Flour',
        net_quantity: '500 g',
        mfg_date: 'Feb 2025',
        manufacturer_name: 'Local Foods Pvt Ltd',
        manufacturer_address: 'Shop 4, Market Road, Jaipur 302001',
        customer_care: null,
        mrp: null,
        fssai_license: null,
      },
      ocrRawText: 'Rice Flour 500g Mfg: Feb 2025...',
    },
    violations: [
      {
        ruleId: 'Rule 6(1)(f)',
        ruleTitle: 'Maximum Retail Price (MRP) Declaration',
        status: 'fail',
        affectedField: 'mrp',
        severity: 'high',
        detail: 'MRP (Maximum Retail Price) is not declared on the label. Every package must display MRP inclusive of all taxes under Rule 6(1)(f).',
        confidence: 'high',
      },
      {
        ruleId: 'Rule 6(1)(g)',
        ruleTitle: 'Consumer Care Details (Helpline / Email)',
        status: 'fail',
        affectedField: 'customer_care',
        severity: 'medium',
        detail: 'Consumer care contact details are not present on the label. Mandatory under Rule 6(1)(g).',
        confidence: 'high',
      },
    ],
  },

  // ── Non-Compliant: Missing Address ─────────────────────────────────────────
  {
    product: { productName: 'Premium Basmati Rice', brandName: 'GoldGrain', category: 'food' },
    scan: {
      sourceType: 'physical_label',
      overallCompliance: 'non_compliant',
      complianceScore: 55,
      totalRulesChecked: 15,
      totalViolations: 3,
      highViolations: 2,
      ocrEngineUsed: 'gemini',
      extractedFields: {
        product_name: 'Premium Basmati Rice',
        brand_name: 'GoldGrain',
        net_quantity: '1 kg',
        mrp: 'Rs. 185 inclusive of all taxes',
        mfg_date: 'Mar 2025',
        manufacturer_name: 'GoldGrain Foods',
        manufacturer_address: null,
        customer_care: 'care@goldgrain.com',
        fssai_license: '10015011009999',
      },
      ocrRawText: 'GoldGrain Premium Basmati Rice 1kg Rs. 185...',
    },
    violations: [
      {
        ruleId: 'Rule 6(1)(a)',
        ruleTitle: 'Manufacturer / Packer / Importer Address',
        status: 'fail',
        affectedField: 'manufacturer_address',
        severity: 'high',
        detail: 'Complete address of the manufacturer, packer, or importer is absent. A full address is mandatory under Rule 6(1)(a).',
        confidence: 'high',
      },
      {
        ruleId: 'Rule 6(1)(c) — Format',
        ruleTitle: 'Net Quantity Unit Validity',
        status: 'fail',
        affectedField: 'net_quantity',
        severity: 'medium',
        detail: 'Weight shown on reverse side may be in non-standard units. Please verify.',
        confidence: 'high',
      },
      {
        ruleId: 'Rule 7(3)',
        ruleTitle: 'Minimum Letter Height (1mm minimum)',
        status: 'estimated_fail',
        affectedField: 'font_size',
        severity: 'low',
        detail: 'Estimated letter height ≈ 0.8mm (min required: 1mm). Physical measurement required.',
        confidence: 'estimated',
      },
    ],
  },

  // ── Needs Review: Only Estimated Issues ────────────────────────────────────
  {
    product: { productName: 'Sunflower Refined Oil', brandName: 'Fortune', category: 'food' },
    scan: {
      sourceType: 'physical_label',
      overallCompliance: 'needs_review',
      complianceScore: 85,
      totalRulesChecked: 15,
      totalViolations: 2,
      highViolations: 0,
      ocrEngineUsed: 'tesseract',
      extractedFields: {
        product_name: 'Sunflower Refined Oil',
        brand_name: 'Fortune',
        net_quantity: '1 L',
        mrp: '₹ 172 Inclusive of All Taxes',
        mfg_date: '12/2024',
        best_before: '11/2025',
        manufacturer_name: 'Adani Wilmar Limited',
        manufacturer_address: 'Fortune House, Ahmedabad 380009, Gujarat',
        customer_care: '1800-103-5278',
        fssai_license: '10016011000053',
      },
      ocrRawText: 'Fortune Sunflower Refined Oil 1L MRP ₹ 172...',
    },
    violations: [
      {
        ruleId: 'Rule 7(3)',
        ruleTitle: 'Minimum Letter Height (1mm minimum)',
        status: 'estimated_fail',
        affectedField: 'font_size',
        severity: 'low',
        detail: 'Font height on net quantity could not be estimated precisely (no DPI reference). Physical verification recommended.',
        confidence: 'estimated',
      },
      {
        ruleId: 'Rule 7 (PDP)',
        ruleTitle: 'Principal Display Panel — Declaration Placement',
        status: 'estimated_fail',
        affectedField: 'layout',
        severity: 'low',
        detail: 'PDP compliance has not been manually confirmed. Please use the review toggle after physical inspection.',
        confidence: 'estimated',
      },
    ],
  },

  // ── Non-Compliant: Non-metric units ────────────────────────────────────────
  {
    product: { productName: 'Mixed Dry Fruits', brandName: 'NutriBox', category: 'food' },
    scan: {
      sourceType: 'physical_label',
      overallCompliance: 'non_compliant',
      complianceScore: 40,
      totalRulesChecked: 15,
      totalViolations: 4,
      highViolations: 3,
      ocrEngineUsed: 'tesseract',
      extractedFields: {
        product_name: 'Assorted Dry Fruits',
        brand_name: 'NutriBox',
        net_quantity: '16 oz',
        mrp: '299',
        mfg_date: '01/2025',
        manufacturer_name: 'NutriBox Organics',
        manufacturer_address: 'Plot 12, Industrial Area, Pune 411012',
        customer_care: null,
        fssai_license: '1234',
      },
      ocrRawText: 'NutriBox Dry Fruits 16 oz MRP 299...',
    },
    violations: [
      {
        ruleId: 'Rule 6(1)(c)',
        ruleTitle: 'Net Quantity — Valid Standard Unit',
        status: 'fail',
        affectedField: 'net_quantity',
        severity: 'high',
        detail: 'Non-standard unit detected: "oz". Only SI/metric units (g, kg, ml, L) are recognized under LM(PC) Rules.',
        confidence: 'high',
      },
      {
        ruleId: 'Rule 6(1)(f)',
        ruleTitle: 'MRP Symbol Validity (₹ or Rs.)',
        status: 'fail',
        affectedField: 'mrp',
        severity: 'medium',
        detail: 'MRP value "299" is missing the required "₹" or "Rs." symbol.',
        confidence: 'high',
      },
      {
        ruleId: 'Rule 6(1)(g)',
        ruleTitle: 'Consumer Care Details (Helpline / Email)',
        status: 'fail',
        affectedField: 'customer_care',
        severity: 'medium',
        detail: 'Consumer care contact details are not present on the label.',
        confidence: 'high',
      },
      {
        ruleId: 'Rule 6(1)(f)',
        ruleTitle: 'FSSAI License Format',
        status: 'fail',
        affectedField: 'fssai_license',
        severity: 'high',
        detail: 'FSSAI license "1234" is not 14 digits (found 4 digits).',
        confidence: 'high',
      },
    ],
  },

  // ── E-Commerce Listing ─────────────────────────────────────────────────────
  {
    product: { productName: 'Vitamin C Tablets', brandName: 'HealthKart', category: 'pharma' },
    scan: {
      sourceType: 'ecommerce_listing',
      overallCompliance: 'needs_review',
      complianceScore: 78,
      totalRulesChecked: 15,
      totalViolations: 1,
      highViolations: 0,
      ocrEngineUsed: 'gemini',
      extractedFields: {
        product_name: 'Vitamin C Tablets 500mg',
        brand_name: 'HealthKart',
        net_quantity: '60 tablets',
        mrp: 'Rs. 349 inclusive of all taxes',
        mfg_date: 'Nov 2024',
        manufacturer_name: 'HealthKart Ltd',
        manufacturer_address: 'Sector 44, Gurugram 122003, Haryana',
        customer_care: 'support@healthkart.com',
      },
      ocrRawText: 'HealthKart Vitamin C 500mg 60 tabs MRP Rs. 349...',
    },
    violations: [
      {
        ruleId: 'Rule 7 (PDP)',
        ruleTitle: 'Principal Display Panel — Declaration Placement',
        status: 'estimated_fail',
        affectedField: 'layout',
        severity: 'low',
        detail: 'E-commerce listing: PDP compliance requires manual review of product images on the listing page.',
        confidence: 'estimated',
      },
    ],
  },
];

async function seed() {
  console.log('\n🌱 Starting initial database sync (spec 03 schema)…\n');

  await syncDatabase({ alter: true });

  // ── Administrator (spec 06: matches login page SSO buttons) ────────────────
  const officerHash = await bcrypt.hash('demo1234',  10);
  const adminHash   = await bcrypt.hash('admin1234', 10);

  const [adminUser] = await User.findOrCreate({
    where: { email: 'admin@metrolens.gov.in' },
    defaults: {
      name: 'System Administrator',
      email: 'admin@metrolens.gov.in',
      passwordHash: adminHash,
      role: 'admin',
    },
  });
  console.log('✅ Registered: admin@metrolens.gov.in');

  const [officerUser] = await User.findOrCreate({
    where: { email: 'officer@metrolens.gov.in' },
    defaults: {
      name: 'Enforcement Officer',
      email: 'officer@metrolens.gov.in',
      passwordHash: officerHash,
      role: 'officer',
    },
  });
  console.log('✅ Registered: officer@metrolens.gov.in');

  // ── Products + Scans + Violations ────────────────────────────────────────────
  let scanCount = 0;
  let violationCount = 0;

  for (const entry of SEED_PRODUCTS) {
    // Create/find Product
    const [product] = await Product.findOrCreate({
      where: { productName: entry.product.productName },
      defaults: entry.product,
    });

    // Create Scan
    const scan = await Scan.create({
      productId: product.id,
      uploadedBy: scanCount % 2 === 0 ? adminUser.id : officerUser.id,
      imagePath: `uploads/demo_${product.id.slice(0, 8)}.jpg`,
      originalFilename: `${entry.product.productName.replace(/\s+/g, '_')}.jpg`,
      ...entry.scan,
      status: 'complete',
      ocrRawText: entry.scan.ocrRawText,
    });

    // Create Violations
    for (const v of entry.violations) {
      await Violation.create({ scanId: scan.id, ...v });
      violationCount++;
    }

    // Create dummy Report record
    await Report.create({
      scanId: scan.id,
      filePath: `reports/compliance_${scan.id.slice(0, 8)}.pdf`,
      generatedBy: adminUser.id,
    });

    scanCount++;
    console.log(`  ✅ ${entry.product.productName} → ${entry.scan.overallCompliance} (${entry.violations.length} violations)`);
  }

  console.log(`\n✅ Seeded ${scanCount} product scans, ${violationCount} compliance violations`);
  console.log('🏁 Database sync complete.\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
