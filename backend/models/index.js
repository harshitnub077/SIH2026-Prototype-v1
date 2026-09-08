// backend/models/index.js
// ============================================================
// Sequelize ORM — Database Models
// Schema matches 03_DATABASE_SCHEMA.md exactly (SIH26034)
// ============================================================

const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config');

const sequelizeOptions = {
  logging: config.server.nodeEnv === 'development' ? false : false,
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
};

const useSqlite = process.env.USE_SQLITE === 'true' || process.env.DB_DIALECT === 'sqlite' || (!config.db.url && process.env.NODE_ENV !== 'production');

const sequelize = useSqlite
  ? new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../test.sqlite'),
      logging: false
    })
  : config.db.url 
    ? new Sequelize(config.db.url, { 
        dialect: 'postgres', 
        logging: false, 
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } 
      })
    : new Sequelize(config.db.name, config.db.user, config.db.password, {
        host: config.db.host,
        port: config.db.port,
        dialect: 'postgres',
        logging: false
      });

// ─── TABLE: users ─────────────────────────────────────────────────────────────
// Enforcement officers and admins
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: { type: DataTypes.TEXT, allowNull: false },
  email: { type: DataTypes.TEXT, allowNull: false, unique: true },
  passwordHash: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'password_hash',
  },
  role: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'officer',
    validate: { isIn: [['admin', 'officer']] },
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// ─── TABLE: products ──────────────────────────────────────────────────────────
// One row per unique product — can have multiple scans over time.
// Created/found when a scan is first submitted for a product.
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productName: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'product_name',
  },
  brandName: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'brand_name',
  },
  category: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'e.g. food, pharma, cosmetics, household — inferred from OCR/FSSAI presence',
  },
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// ── TABLE: batches ────────────────────────────────────────────────────────────
const Batch = sequelize.define('Batch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  uploadedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    field: 'uploaded_by',
  },
  originalImage: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'original_image',
  },
  status: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'processing',
    validate: { isIn: [['processing', 'completed', 'failed']] },
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message',
  },
}, {
  tableName: 'batches',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// ─── TABLE: scans ─────────────────────────────────────────────────────────────
// One row per image scan event.
const Scan = sequelize.define('Scan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  batchId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'batches', key: 'id' },
    onDelete: 'CASCADE',
    field: 'batch_id',
  },

  // ── Foreign Keys ──────────────────────────────────────────────────────────
  productId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'products', key: 'id' },
    field: 'product_id',
    comment: 'Set after OCR extracts the product name and finds/creates a product record',
  },
  uploadedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    field: 'uploaded_by',
    comment: 'Null in demo/anonymous mode',
  },

  // ── Image & OCR ────────────────────────────────────────────────────────────
  imagePath: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'image_path',
  },
  originalFilename: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'original_filename',
  },
  sourceType: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'physical_label',
    field: 'source_type',
    validate: { isIn: [['physical_label', 'ecommerce_listing']] },
    comment: 'physical_label (default) or ecommerce_listing (Rule 6(10) applies)',
  },

  // ── Processing Status ─────────────────────────────────────────────────────
  status: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'processing',
    validate: { isIn: [['processing', 'complete', 'failed']] },
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message',
    comment: 'Set if status=failed',
  },

  // ── OCR output ────────────────────────────────────────────────────────────
  ocrRawText: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'ocr_raw_text',
  },

  // ── JSONB extracted fields (blueprint §6 Structured Declaration Data Model) ──
  // Stores all OCR-extracted declarations as flexible key-value JSON.
  // No rigid column-per-field — accommodates whatever OCR returns.
  // Fields per blueprint: manufacturer_name, manufacturer_address,
  //   packer_name, packer_address, importer_name, importer_address,
  //   country_of_origin, product_name (generic/common name), brand_name,
  //   net_quantity_value, net_quantity_unit, piece_count,
  //   mfg_date (Month/Year of manufacture/pre-packing/import),
  //   best_before, mrp, customer_care,
  //   dimensions (L×W rules 14–17), sheet_count (rule 16),
  //   batch_lot_number, fssai_license, ingredients, ...
  extractedFields: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'extracted_fields',
  },

  // ── Compliance result — 5-status system per blueprint §8 ──────────────────
  // PASS                    = evidence sufficient, all requirements met
  // POTENTIAL NON-COMPLIANCE = automated evidence indicates requirement not met
  // MANUAL REVIEW           = evidence insufficient for automatic conclusion
  // NOT APPLICABLE          = applicability/exemption engine says rule does not apply
  // NOT VERIFIED            = required input, image quality or scale is missing
  overallCompliance: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'overall_compliance',
    validate: { isIn: [[
      'PASS',
      'POTENTIAL NON-COMPLIANCE',
      'MANUAL REVIEW',
      'NOT APPLICABLE',
      'NOT VERIFIED',
      // Legacy aliases kept for backward compat during migration:
      'compliant', 'non_compliant', 'needs_review',
    ]] },
  },

  // ── Dashboard metrics (not in spec 03 but needed for aggregation) ─────────
  ocrEngineUsed: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: 'tesseract',
    field: 'ocr_engine_used',
  },
  ocrConfidenceAvg: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'ocr_confidence_avg',
    comment: 'Average Tesseract word confidence (0–100)',
  },
  complianceScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'compliance_score',
    comment: '% of rules passed (0–100)',
  },
  totalRulesChecked: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'total_rules_checked',
  },
  totalViolations: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'total_violations',
  },
  highViolations: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'high_violations',
    comment: 'Count of severity=high violations',
  },
}, {
  tableName: 'scans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['status'] },
    { fields: ['overall_compliance'] },
    { fields: ['created_at'] },
  ],
});

// ─── TABLE: violations ────────────────────────────────────────────────────────
// One row per rule check result (fail or estimated_fail) per scan.
// Schema exactly matches spec 03_DATABASE_SCHEMA.md.
const Violation = sequelize.define('Violation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  scanId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'scans', key: 'id' },
    onDelete: 'CASCADE',
    field: 'scan_id',
  },

  // ── Rule identification (spec 02 + 03) ─────────────────────────────────────
  ruleId: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'rule_id',
    comment: 'e.g. "Rule 6(1)(c)" — exact citation from LM(PC) Rules 2011',
  },
  ruleTitle: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'rule_title',
  },

  // ── Check outcome — 5-status system per blueprint §8 ────────────────────
  // PASS                    = evidence sufficient, requirement met
  // POTENTIAL NON-COMPLIANCE = automated evidence indicates requirement not met
  // MANUAL REVIEW           = evidence or legal context insufficient for auto-conclusion
  // NOT APPLICABLE          = applicability/exemption engine says rule does not apply
  // NOT VERIFIED            = required input, image quality or scale is missing
  status: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { isIn: [[
      'PASS',
      'POTENTIAL NON-COMPLIANCE',
      'MANUAL REVIEW',
      'NOT APPLICABLE',
      'NOT VERIFIED',
      // Legacy aliases kept for backward compat during migration:
      'fail', 'estimated_fail', 'pass',
    ]] },
  },

  // ── Finding detail ────────────────────────────────────────────────────────
  affectedField: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'field',
    comment: 'Which extracted field this check relates to',
  },
  severity: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: { isIn: [['high', 'medium', 'low', null]] },
    comment: 'null for PASS / NOT APPLICABLE results',
  },
  detail: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ── Rule version (blueprint §1 — store rule version with every result) ────
  // ruleVersion: {
  //   type: DataTypes.TEXT,
  //   allowNull: true,
  //   field: 'rule_version',
  //   defaultValue: 'LM-PC-2011-v1.0',
  // },

  // ── Confidence (blueprint §5 CV requirements) ─────────────────────────────
  // 'high'      = presence/pattern check — reliable
  // 'estimated' = image analysis (font/PDP) — approximate
  confidence: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'high',
    validate: { isIn: [['high', 'estimated']] },
  },
}, {
  tableName: 'violations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['scan_id'] },
  ],
});

// ─── TABLE: reports ───────────────────────────────────────────────────────────
// Generated PDF reports — decoupled from scans table per spec 03.
const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  scanId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'scans', key: 'id' },
    onDelete: 'CASCADE',
    field: 'scan_id',
  },
  filePath: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'file_path',
  },
  generatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    field: 'generated_by',
  },
}, {
  tableName: 'reports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// ─── ASSOCIATIONS ─────────────────────────────────────────────────────────────
User.hasMany(Scan, { foreignKey: 'uploadedBy', as: 'scans' });
Scan.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploadedByUser' });

Batch.hasMany(Scan, { foreignKey: 'batchId', as: 'scans', onDelete: 'CASCADE' });
Scan.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });

User.hasMany(Batch, { foreignKey: 'uploadedBy', as: 'batches' });
Batch.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploadedByUser' });

Product.hasMany(Scan, { foreignKey: 'productId', as: 'scans' });
Scan.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Scan.hasMany(Violation, { foreignKey: 'scanId', as: 'violations', onDelete: 'CASCADE' });
Violation.belongsTo(Scan, { foreignKey: 'scanId', as: 'scan' });

Scan.hasMany(Report, { foreignKey: 'scanId', as: 'reports', onDelete: 'CASCADE' });
Report.belongsTo(Scan, { foreignKey: 'scanId', as: 'scan' });

User.hasMany(Report, { foreignKey: 'generatedBy', as: 'generatedReports' });
Report.belongsTo(User, { foreignKey: 'generatedBy', as: 'generatedByUser' });

// ─── INDEX RAW SQL (applied after sync) ───────────────────────────────────────
// These match the exact index definitions from spec 03.
const INDEXES_SQL = [
  'CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status)',
  'CREATE INDEX IF NOT EXISTS idx_scans_compliance ON scans(overall_compliance)',
  'CREATE INDEX IF NOT EXISTS idx_violations_scan_id ON violations(scan_id)',
  'CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC)',
];

// ─── SYNC HELPER ─────────────────────────────────────────────────────────────
const syncDatabase = async (options = {}) => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established');

    // Sync tables in dependency order
    await User.sync(options);
    await Product.sync(options);
    await Batch.sync(options);
    await Scan.sync(options);
    await Violation.sync(options);
    await Report.sync(options);

    // Apply raw indexes from spec 03
    for (const sql of INDEXES_SQL) {
      await sequelize.query(sql).catch(() => {}); // Ignore if already exists
    }

    console.log('✅ Database tables synced (schema v03)');
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Product,
  Batch,
  Scan,
  Violation,
  Report,
  syncDatabase,
};
