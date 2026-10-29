'use client';

import { colors, font } from '../lib/theme';

/**
 * Horizontal breakdown — label + progress bar + value / %. Used anywhere we
 * want to show composition (traffic by channel, actions, source split).
 *
 *   items: [{ label, value, color?, display? }, ...]
 */
export function BarBreakdown({ items, footer }) {
  const total = items.reduce((sum, i) => sum + (Number(i.value) || 0), 0) || 1;
  return (
    <div style={{ fontFamily: font.sans }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it, idx) => {
          const pct = ((Number(it.value) || 0) / total) * 100;
          const barColor = it.color || colors.brand;
          return (
            <div key={idx}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                <span style={{ fontWeight: 600, color: colors.text }}>{it.label}</span>
                <span style={{ color: colors.textMuted }}>
                  {it.display != null
                    ? it.display
                    : `${(Number(it.value) || 0).toLocaleString()} · ${pct.toFixed(1)}%`}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: '#eef1f5',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, pct))}%`,
                    height: '100%',
                    background: barColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {footer && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${colors.border}`,
            fontSize: 12,
            color: colors.textMuted,
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
