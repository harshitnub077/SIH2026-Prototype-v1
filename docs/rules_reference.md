# Rules Reference — Legal Metrology (Packaged Commodities) Rules, 2011
## For Judge Verification — SIH26034 MetroLens

This document lists every rule implemented in `backend/services/rules_engine.js`.
Judges can verify each rule against the official Gazette notification.

> **Source**: Legal Metrology (Packaged Commodities) Rules, 2011 — Ministry of Consumer Affairs,
> Food and Public Distribution, Government of India.
> Gazette Notification G.S.R. 289(E), dated 28th March 2011, as amended.

---

## Rule 6 — Declarations on Every Package

### Rule 6(1)(a) — Name of Commodity
> "Every package shall carry a declaration of the name or description of the commodity contained in the package."

**What we check**: Product name field is present and non-empty.
**Severity**: CRITICAL
**Violation type**: missing

---

### Rule 6(1)(b) — Net Quantity
> "Every package shall carry a declaration of the net quantity in terms of standard unit of weights or measures."

**What we check**: Net quantity field is present and non-empty.
**Severity**: CRITICAL
**Violation type**: missing

---

### Rule 6(1)(c) — Net Quantity Format
> "The net quantity shall be expressed as a numeric value accompanied by the unit of measurement. Vague or non-numeric terms are prohibited."

**What we check**:
1. Net quantity contains a numeric value AND a standard unit (g, kg, ml, L)
2. Net quantity does not contain vague terms (Jumbo, Family Size, Large, Super, Economy)

**Severity**: MAJOR
**Violation types**: incorrect_format, incorrect_value

---

### Rule 6(1)(d) — MRP Declaration
> "Every package shall carry the Maximum Retail Price (MRP) at which the commodity in packaged form may be sold to the ultimate consumer inclusive of all taxes."

**What we check**:
1. MRP field is present
2. MRP parses to a positive numeric value

**Severity**: CRITICAL
**Violation type**: missing, incorrect_value

---

### Rule 6(1)(e) — Month and Year of Manufacture
> "Every package shall carry the month and year in which the commodity is manufactured or packed or imported, as the case may be."

**What we check**:
1. mfg_date field is present
2. Date parses to a valid month + year format
3. Year is not implausibly in the future

**Severity**: CRITICAL
**Violation types**: missing, incorrect_format, incorrect_value

---

### Rule 6(1)(f) — Best Before Date
> "Every package shall, where applicable, carry the best before date or the date of expiry, after which the commodity shall not be sold."

**What we check**: If the product appears to be a food item (FSSAI license or ingredients detected), the best_before field must be present.

**Note**: We infer "food product" from OCR — this is a best-effort heuristic.
**Severity**: MAJOR
**Violation type**: missing

---

### Rule 6(1)(g) — Manufacturer Name and Address
> "Every package shall carry the name and complete address of the manufacturer or packer or, in the case of imported packages, the importer."

**What we check** (two separate sub-checks):
1. manufacturer_name is present
2. manufacturer_address is present AND contains a 6-digit PIN code

**Severity**: CRITICAL (both sub-checks)
**Violation types**: missing, incorrect_format

---

### Rule 6(1)(h) — Consumer Care Contact
> "Every package shall carry the name, address, and telephone number or email of the person or office to which consumer complaints may be addressed."

**What we check**: customer_care field is present (phone number or email address).
**Severity**: MAJOR
**Violation type**: missing

---

### Rule 6(2) — Country of Origin (Imported Goods)
> "In the case of imported packages, the country of origin of the commodity shall be declared on the label."

**What we check**: If the OCR text contains import-related keywords ("Imported by", "Product of" a foreign country), the country_of_origin field must be present.
**Severity**: MAJOR
**Violation type**: missing

---

## Rule 7 — Metric Units Mandatory
> "No package shall contain a declaration of quantity in any unit of weight or measure other than the standard unit."

**What we check**: Net quantity does not use non-metric units (ounce/oz, pound/lb, tola, seer, maund).

**Severity**: CRITICAL
**Violation type**: incorrect_value

---

## Rule 8 — Minimum Font Height ⚠️ ESTIMATED

> "The height of the numerals and letters used in making declarations required under these rules shall be as follows:
> - ≤ 200g/200ml: minimum 1mm
> - 200g–1kg / 200ml–1L: minimum 2mm
> - > 1kg / > 1L: minimum 4mm"

**What we check**: If font_size_compliant is explicitly set to false by image analysis.

**⚠️ ESTIMATED**: Font height in mm cannot be measured precisely from a 2D photo without a physical scale reference object in the image. Our system estimates from pixel measurements. This finding is always labeled "ESTIMATED" in the UI and PDF — it is an indicative result only and requires physical verification.

**Severity**: MINOR (due to estimation uncertainty)
**Violation type**: estimated_issue

---

## Rule 9 — Permissible Error in Net Quantity ⚠️ ESTIMATED

> "The error in net quantity of a packaged commodity shall not exceed the limits of error as per Schedule II."

**Permissible error table**:
| Declared Qty | Permissible Error |
|---|---|
| ≤ 50g/ml | 9% |
| 50–100g/ml | 4.5g/ml |
| 100–200g/ml | 4.5% |
| 200–300g/ml | 9g/ml |
| 300–500g/ml | 3% |
| 500g/ml–1kg/L | 15g/ml |
| 1–10kg/L | 1.5% |
| > 10kg/L | 150g/L |

**⚠️ ESTIMATED**: Actual weight/volume cannot be measured from a label photograph. Physical verification using calibrated equipment is required. We only flag this if explicit discrepancy evidence is returned by Gemini Vision analysis.

**Severity**: MINOR
**Violation type**: estimated_issue

---

## Rule 22 — FSSAI License (Food Products)

> Cross-referenced requirement: Food Safety and Standards Act, 2006 mandates FSSAI License/Registration number on all food packages. Legal Metrology compliance for food-category packages cross-references this requirement.

**What we check**:
1. If the product appears to be a food item (ingredients list present), FSSAI license must be declared
2. FSSAI license number must be exactly 14 digits

**Severity**: MAJOR
**Violation types**: missing, incorrect_format

---

## Rule 24 — Selling Above MRP Prohibited

> "No packaged commodity shall be sold, distributed, or delivered at a price exceeding the declared maximum retail price."

**What we check**: Whether multiple distinct MRP values are detected on the same label (dual pricing), which could confuse consumers or indicate a regulatory violation.

**Note**: Actual selling price verification requires point-of-sale check. We only flag the dual-MRP scenario from label analysis.
**Severity**: MAJOR (estimated)
**Violation type**: incorrect_value

---

## Rule 26 — No False or Misleading Declarations

> "No package shall contain any declaration, statement, design, or device that is false or misleading in any particular, or that is likely to deceive a purchaser or create a wrong impression regarding its quantity."

**What we check**: Presence of vague marketing terms that may substitute for or confuse the net quantity declaration:
- "Family Size"
- "Jumbo"
- "Super Value"
- "Economy Pack"
- "Free Extra"

**Note**: Best-effort keyword detection. Manual review recommended.
**Severity**: MINOR (estimated)
**Violation type**: incorrect_value

---

## Honest Limitations

| Check | Why It's Limited | What's Needed for Definitive Check |
|---|---|---|
| Rule 8 (Font Height) | No physical scale reference in 2D image | Printed label + ruler / calibrated camera |
| Rule 9 (Net Weight) | Cannot weigh product from photo | Calibrated weighing scale |
| Rule 24 (Dual MRP) | Heuristic price detection | Side-by-side price comparison |
| Rule 26 (Misleading) | Keyword-based; context-sensitive | Human officer review |
| Rule 6(1)(f) (Best Before) | Food category inferred, not certain | Product category database |

All estimated findings are clearly labeled **[ESTIMATED]** in the UI, PDF report, and database.

---

*Rules Reference for MetroLens — SIH26034*
*Legal Metrology (Packaged Commodities) Rules, 2011 — Government of India*
