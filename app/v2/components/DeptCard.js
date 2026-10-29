'use client';

import { colors, font, radius, shadow } from '../lib/theme';
import { Icon } from './Icons';

/**
 * Department tile shown on Overview — icon, name, one-line summary, and a
 * headline value with its MoM delta. Click to drill into the department.
 */
export function DeptCard({ icon, name, summary, value, delta, onClick }) {
  const deltaIsGood = delta != null ? delta >= 0 : null;
  const deltaColor =
    delta == null || delta === 0
      ? colors.textMuted
      : deltaIsGood
      ? colors.positive
      : colors.negative;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 120ms',
        fontFamily: font.sans,
        textAlign: 'left',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        if (!onClick) return;
        e.currentTarget.style.borderColor = colors.brand;
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = shadow.sm;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.brandTint,
          color: colors.brand,
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{name}</div>
        <div style={{ fontSize: 12, color: colors.textMuted }}>{summary || '—'}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value ?? '—'}
        </div>
        {delta != null && (
          <div style={{ fontSize: 11, fontWeight: 600, color: deltaColor }}>
            {delta > 0 ? '↑' : delta < 0 ? '↓' : '—'} {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>
    </button>
  );
}
