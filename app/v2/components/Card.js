'use client';

import { colors, font, radius } from '../lib/theme';

/**
 * Chart / table shell. All content blocks under the KPI row share this frame.
 */
export function Card({ title, subtitle, tag, children, style }) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        padding: 20,
        fontFamily: font.sans,
        ...style,
      }}
    >
      {(title || tag) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 16,
            gap: 12,
          }}
        >
          <div>
            {title && (
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.005em', marginBottom: 2 }}>
                {title}
              </div>
            )}
            {subtitle && <div style={{ fontSize: 12, color: colors.textMuted }}>{subtitle}</div>}
          </div>
          {tag && (
            <span
              style={{
                padding: '3px 8px',
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 5,
                fontSize: 11,
                fontWeight: 600,
                color: colors.textMuted,
                whiteSpace: 'nowrap',
              }}
            >
              {tag}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function SectionTitle({ children, style }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.06em',
        color: colors.textMuted,
        textTransform: 'uppercase',
        margin: '8px 0 12px',
        fontFamily: font.sans,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
