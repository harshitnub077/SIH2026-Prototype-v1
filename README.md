# SIH26034 — MetroLens
### Legal Metrology Packaged-Commodity Compliance Engine
**Ministry of Consumer Affairs, Food & Public Distribution (Dept. of Consumer Affairs) · Smart India Hackathon 2026**

> 🌐 **Live Deployed Portal:** [https://metrolens.vercel.app](https://metrolens.vercel.app)  
> 🔗 **Official Repository:** [https://github.com/harshitnub077/SIH2026-Prototype-v1](https://github.com/harshitnub077/SIH2026-Prototype-v1)  
> 
> **The thesis, in one line:** An inspector standing in a shop can check whether a declaration exists. They cannot check whether it's tall enough. We turn a phone photo into a traceable physical measurement, cite the exact rule it fails with stated uncertainty, and hand out a Section 48 notice that survives an appeal.

---

## 1. The Problem & The Trap

Every packaged product sold in India must legally carry declarations (manufacturer name/address, net quantity, MRP, month/year, etc.) in a specific format, size, and placement under the **Legal Metrology Act, 2009** and the **Legal Metrology (Packaged Commodities) Rules, 2011**.

| Most Hackathon Teams | MetroLens Engine |
| :--- | :--- |
| OCR the label, regex-check whether MRP / net qty / mfg date text is present. | Traceable scale recovery from calibrated fiducials (or package dimensions); measures physical font cap-height in millimetres. |
| **Output:** `"MRP: found ✓"` — a naive presence check. | **Output:** `"Measured 1.82 mm ± 0.21 mm (k=2); Rule 7(2) Table I requires 2.00 mm; guard-banded per ILAC G8:09/2019 — NON-COMPLIANT."` |
| Generic PDF summary. | Statutory **Section 48 Compounding Notice** with Section 48(4) 3-year bar check and Section 50 appeal evidence chain. |

---

## 2. System Architecture: Three Engines

1. **Engine 1 — Arithmetic & Completeness (No CV)**:
   - **Unit Sale Price (USP) Recomputation**: Recomputed from $\text{MRP} \div \text{Net Quantity}$ (per gram if $< 1\text{ kg}$, per kg if $> 1\text{ kg}$; per ml if $< 1\text{ L}$, per L if $> 1\text{ L}$).
   - **Rule 26 Exemption**: Packs $\le 10\text{g}$ or $\le 10\text{ml}$ are exempt from USP. Exact $1\text{kg}$ boundary flagged as ambiguous, not an automatic penalty.
   - **Rule 6 Checklist**: Name/address, generic name, net quantity, month/year, MRP, consumer care, dimensions.
   - **Category Rules**: Edible oil dual declaration (**Fourth Schedule, Item 11** — if declared by volume, weight must also be declared; substituted 1 Jan 2024), Electronics manufacturing date & QR route (G.S.R. 577(E)), and Rule 7(5) FSSAI carve-outs.

2. **Engine 2 — Geometry & Metrology (The Core Differentiator)**:
   - **Scale Recovery (Pixels to Millimetres)**: Traceable reference standard (certified ArUco/fiducial card e.g. `ML-REF-2026-0842`, $50.0\text{ mm} \pm 0.05\text{ mm}$) or known package dimension fallback.
   - **Principal Display Panel (PDP)**: Area computed per Rule 7(4) (rectangular: $H \times W$; cylindrical: $40\% \times H \times C$; irregular: $40\%$ total area).
   - **Rule 7(2) Tables I & II**: Minimum font height lookup substituted by G.S.R. 629(E).
   - **Aspect Ratio Floor**: Numeral width $\ge h/3$ per Rule 7(3).
   - **Rule 8 Placement**: Clear space surrounding net quantity ($\ge 1.0 \times h$ vertical, $\ge 2.0 \times h$ horizontal).
   - **Rule 9(1)(b) Numeric Contrast**: Relative luminance contrast ratio measured against $4.5:1$ threshold.
   - **Rule 6(8) Veg / Non-Veg Dot**: Color-and-position verification at the top of PDP for cosmetics and toiletries.
   - **5-Component Uncertainty Budget (ISO/IEC 17025 / GUM)**: $u_{\text{scale}}$, $u_{\text{pix}}$, $u_{\text{rect}}$, $u_{\text{edge}}$, $u_{\text{conv}}$, combined at $k=2$ (95.45% confidence).
   - **ILAC G8:09/2019 Guard-Banding**: Guard-banded acceptance limit $AL = TL - w$ yielding legally defensible verdicts.

3. **Engine 3 — E-Commerce & Versioned Law**:
   - **Rule 6(10)**: Mandatory marketplace listing declarations.
   - **Rule 6(10A)**: Country-of-origin filter mandate tracking the 2026 amendment trifecta:
     - G.S.R. 128(E) (notified 13 Feb 2026, in force 1 July 2026)
     - G.S.R. 312(E) (notified 27 April 2026, in force 1 July 2027)
     - G.S.R. 418(E) (notified 29 May 2026, immediate effect: AEO bonded-warehouse & director liability).

---

## 3. The Output: Section 48 Notice, Built to Survive a Section 50 Appeal

- **Section 48 Compounding Notice**: Official statutory notice issued by an authorized Legal Metrology Officer.
- **Section 48(4) 3-Year Lookback Bar**: Offence cannot be compounded if the offender compounded a similar offence within the previous three years. MetroLens automatically queries offender history and surfaces the statutory bar, referring repeat offenders to the Metropolitan Magistrate under Section 36.
- **Rank-Based Jurisdiction (Sections 48(2)/(3))**: Enforces non-nesting statutory schedules (Director covers Sec 25, 27–39, 52(3) with exclusive 38–39; Controller covers Sec 25, 27–31, 33–37, 45–47, 52(3) with exclusive 45–47).
- **Evidentiary Chain for Section 50 Appeal**: SHA-256 cryptographic image hash, EXIF/GPS metadata, reference standard serial number, ISO/IEC 17025 decision rule citation, expanded uncertainty budget appendix, and 60-day limitation disclosure.

---

## 4. Verification & Testing

A complete automated unit test suite validates all 22 statutory and metrological requirements:

```bash
node tests/metrology_engine.test.js
```

**Results:**
- Table I & Table II Slabs: **4/4 PASSED**
- PDP Area Formulas: **2/2 PASSED**
- 5-Component Uncertainty Budget: **1/1 PASSED**
- ILAC G8 Guard-Banding: **3/3 PASSED**
- Rule 8 Free Space: **2/2 PASSED**
- Rule 9 Contrast Ratio: **2/2 PASSED**
- Engine 1 USP & Exemptions: **5/5 PASSED**
- Section 48 Notice & Compoundability: **3/3 PASSED**
- **Total: 22/22 Tests Passing**

---

## 5. Live Portal & Quick Start

### 🌐 Live Production Deployment
- **Official Web Application:** [https://metrolens.vercel.app](https://metrolens.vercel.app)
- **GitHub Repository:** [https://github.com/harshitnub077/SIH2026-Prototype-v1](https://github.com/harshitnub077/SIH2026-Prototype-v1)

### Local Setup:
```bash
cd backend
npm install
cp .env.example .env
npm run dev
# Running on http://localhost:5001
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:3000
```
