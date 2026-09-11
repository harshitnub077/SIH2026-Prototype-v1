'use client';

/**
 * ComplianceGauge.jsx
 * SVG donut chart showing compliance score %.
 * Supports the blueprint 5-status system (PASS, POTENTIAL NON-COMPLIANCE,
 * MANUAL REVIEW, NOT APPLICABLE, NOT VERIFIED) plus legacy aliases.
 */

// Blueprint §8 — 5-status color mapping
const STATUS_COLOR = {
  // New blueprint statuses
  'PASS':                     '#4ade80',  // green-400
  'POTENTIAL NON-COMPLIANCE': '#f87171',  // red-400
  'MANUAL REVIEW':            '#fbbf24',  // amber-400
  'NOT APPLICABLE':           '#94a3b8',  // slate-400
  'NOT VERIFIED':             '#fb923c',  // orange-400
  // Legacy aliases
  compliant:           '#4ade80',
  non_compliant:       '#f87171',
  needs_review:        '#fbbf24',
  partially_compliant: '#fbbf24',
};

const STATUS_LABEL = {
  'PASS':                     'Pass',
  'POTENTIAL NON-COMPLIANCE': 'Potential Non-Compliance',
  'MANUAL REVIEW':            'Manual Review',
  'NOT APPLICABLE':           'Not Applicable',
  'NOT VERIFIED':             'Not Verified',
  // Legacy
  compliant:           'Compliant',
  non_compliant:       'Non-Compliant',
  needs_review:        'Manual Review',
  partially_compliant: 'Partially Compliant',
};

/**
 * @param {number} score      - Compliance score 0–100
 * @param {string} status     - Blueprint 5-status or legacy status string
 * @param {number} [size=140] - SVG size in px
 */
export default function ComplianceGauge({ score = 0, status = 'NOT VERIFIED', size = 140 }) {
  const radius = size * 0.37;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = Math.max(0, Math.min(score, 100)) / 100 * circumference;
  const color = STATUS_COLOR[status] || STATUS_COLOR['MANUAL REVIEW'];
  const label = STATUS_LABEL[status] || status;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={size * 0.086}
          />
          {/* Progress arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={size * 0.086}
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>

        {/* Center text — rendered upright over the rotated SVG */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <span
            className="font-black leading-none"
            style={{ color, fontSize: size * 0.22 }}
          >
            {score}%
          </span>
          <span className="text-slate-400 leading-none" style={{ fontSize: size * 0.07 }}>
            compliance
          </span>
        </div>
      </div>

      {/* Label below */}
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded text-center"
        style={{
          background: `${color}22`,
          color,
          border: `1px solid ${color}44`,
        }}
      >
        {label}
      </span>
    </div>
  );
}
