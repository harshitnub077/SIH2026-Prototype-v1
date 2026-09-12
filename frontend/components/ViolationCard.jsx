'use client';

/**
 * ViolationCard — Blueprint §8 5-status system.
 *
 * Status  →  UX meaning
 * POTENTIAL NON-COMPLIANCE  →  Strong automated finding (red)
 * MANUAL REVIEW             →  Needs officer verification (amber)
 * NOT VERIFIED              →  Insufficient data for determination (orange)
 * NOT APPLICABLE            →  Rule exempt (should not appear; slate)
 */

const STATUS_CONFIG = {
  'POTENTIAL NON-COMPLIANCE': {
    label: 'Potential Non-Compliance',
    accentVar: '--fail',
    bgVar: '--fail-bg',
    borderVar: '--fail-border',
    chipStyle: { background: 'var(--fail-bg)', color: 'var(--fail)', border: '1px solid var(--fail-border)' },
    leftBar: 'var(--fail)',
    disclaimer: null,
  },
  'MANUAL REVIEW': {
    label: 'Manual Review Required',
    accentVar: '--review',
    bgVar: '--review-bg',
    borderVar: '--review-border',
    chipStyle: { background: 'var(--review-bg)', color: 'var(--review)', border: '1px solid var(--review-border)' },
    leftBar: 'var(--review)',
    disclaimer: 'This finding requires officer verification — do not initiate enforcement action on this finding alone.',
  },
  'NOT VERIFIED': {
    label: 'Not Verified',
    accentVar: '--nv',
    bgVar: '--nv-bg',
    borderVar: '--nv-border',
    chipStyle: { background: 'var(--nv-bg)', color: 'var(--nv)', border: '1px solid var(--nv-border)' },
    leftBar: 'var(--nv)',
    disclaimer: 'Image quality or calibration data insufficient — physical verification required before any action.',
  },
  'NOT APPLICABLE': {
    label: 'Not Applicable',
    accentVar: '--na',
    bgVar: '--na-bg',
    borderVar: '--border',
    chipStyle: { background: 'var(--na-bg)', color: 'var(--na)', border: '1px solid var(--border)' },
    leftBar: 'var(--na)',
    disclaimer: null,
  },
  // Legacy
  'fail':           { label: 'Definite Fail',   accentVar: '--fail',   bgVar: '--fail-bg',   borderVar: '--fail-border',   chipStyle: { background: 'var(--fail-bg)',   color: 'var(--fail)',   border: '1px solid var(--fail-border)' },   leftBar: 'var(--fail)',   disclaimer: null },
  'estimated_fail': { label: 'Estimated Fail',  accentVar: '--review', bgVar: '--review-bg', borderVar: '--review-border', chipStyle: { background: 'var(--review-bg)', color: 'var(--review)', border: '1px solid var(--review-border)' }, leftBar: 'var(--review)', disclaimer: 'Requires physical verification before enforcement.' },
  'estimated':      { label: 'Estimated',       accentVar: '--review', bgVar: '--review-bg', borderVar: '--review-border', chipStyle: { background: 'var(--review-bg)', color: 'var(--review)', border: '1px solid var(--review-border)' }, leftBar: 'var(--review)', disclaimer: 'Requires physical verification before enforcement.' },
};

const SEV_CONFIG = {
  high:    { label: 'HIGH',   color: 'var(--fail)',   bg: 'var(--fail-bg)',   border: 'var(--fail-border)' },
  critical:{ label: 'CRIT',   color: 'var(--fail)',   bg: 'var(--fail-bg)',   border: 'var(--fail-border)' },
  medium:  { label: 'MED',    color: 'var(--review)', bg: 'var(--review-bg)', border: 'var(--review-border)' },
  major:   { label: 'MAJOR',  color: 'var(--review)', bg: 'var(--review-bg)', border: 'var(--review-border)' },
  low:     { label: 'LOW',    color: 'var(--text-secondary)', bg: 'var(--bg-raised)', border: 'var(--border)' },
  minor:   { label: 'MINOR',  color: 'var(--text-secondary)', bg: 'var(--bg-raised)', border: 'var(--border)' },
};

export default function ViolationCard({ violation: v }) {
  const ruleId      = v.ruleId    || v.rule_id     || '—';
  const ruleTitle   = v.ruleTitle || v.rule_title  || '';
  const detail      = v.detail    || v.violationDetail || '';
  const field       = v.affectedField || v.field   || null;
  const severity    = v.severity  || 'low';
  const status      = v.status    || 'POTENTIAL NON-COMPLIANCE';
  const confidence  = v.confidence || 'high';
  const ruleVersion = v.rule_version || v.ruleVersion || null;

  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG['POTENTIAL NON-COMPLIANCE'];
  const sevCfg    = SEV_CONFIG[severity]  || SEV_CONFIG.low;

  return (
    <div
      className="relative overflow-hidden rounded-xl transition-all duration-200"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border)`,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.2)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Severity left stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ background: `linear-gradient(180deg, ${sevCfg.color}, ${sevCfg.color}88)` }}
      />

      <div className="pl-5 pr-4 pt-4 pb-3.5 space-y-3">

        {/* ── Top: rule ID + chips ──────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Rule ID — monospace badge */}
          <code
            className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
            style={{
              background: 'var(--bg-raised)',
              color: 'var(--accent)',
              border: '1px solid var(--accent-border)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {ruleId}
          </code>

          {/* Severity chip */}
          <span
            className="text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded"
            style={{
              background: sevCfg.bg,
              color: sevCfg.color,
              border: `1px solid ${sevCfg.border}`,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {sevCfg.label}
          </span>

          {/* Status chip */}
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={statusCfg.chipStyle}>
            {statusCfg.label}
          </span>
        </div>

        {/* ── Rule title ────────────────────────────────────────────────── */}
        {ruleTitle && (
          <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {ruleTitle}
          </p>
        )}

        {/* ── Detail text ───────────────────────────────────────────────── */}
        {detail && (
          <div
            className="rounded-lg px-3 py-2.5"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-muted)' }}
          >
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{detail}</p>
          </div>
        )}

        {/* ── Footer: field + confidence + rule version ─────────────────── */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-0.5">
          <div className="flex items-center gap-3">
            {field && (
              <span className="text-[11px]" style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                field: <span style={{ color: 'var(--text-secondary)' }}>{field}</span>
              </span>
            )}
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={confidence === 'estimated'
                ? { background: 'var(--review-bg)', color: 'var(--review)', border: '1px solid var(--review-border)' }
                : { background: 'var(--pass-bg)', color: 'var(--pass)', border: '1px solid var(--pass-border)' }
              }
            >
              {confidence}
            </span>
            {ruleVersion && (
              <span className="text-[10px]" style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                {ruleVersion}
              </span>
            )}
          </div>
        </div>

        {/* ── Disclaimer ────────────────────────────────────────────────── */}
        {statusCfg.disclaimer && (
          <p
            className="text-xs italic flex gap-2 pt-1"
            style={{ color: `${statusCfg.chipStyle.color}aa`, borderTop: `1px solid var(${statusCfg.borderVar})` }}
          >
            <span>ⓘ</span>
            <span>{statusCfg.disclaimer}</span>
          </p>
        )}
      </div>
    </div>
  );
}
