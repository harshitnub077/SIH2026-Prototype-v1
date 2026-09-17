const fs = require('fs');
let s = fs.readFileSync('backend/routes/scans.js', 'utf8');

const newRoute = `
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
`;

s = s.replace('module.exports = router;', newRoute);
fs.writeFileSync('backend/routes/scans.js', s);
console.log('PUT route injected');
