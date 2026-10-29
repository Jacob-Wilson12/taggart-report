'use client';

import { colors, font } from '../lib/theme';

/**
 * Dark gradient hero at the top of Overview. Three stat tiles alongside a
 * headline. Pass children for the stat slots or use the HeroStat helper.
 */
export function Hero({ kicker, title, subtitle, children }) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0d1524 0%, #1a2540 100%)',
        color: 'white',
        borderRadius: 12,
        padding: '24px 28px',
        marginBottom: 20,
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
        gap: 24,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: font.sans,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(45,125,246,0.15), transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div>
        {kicker && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(242,247,250,0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}
          >
            {kicker}
          </div>
        )}
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: 'rgba(242,247,250,0.6)' }}>{subtitle}</div>
        )}
      </div>
      {children}
    </div>
  );
}

export function HeroStat({ label, value, suffix, trend }) {
  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(242,247,250,0.55)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value ?? '—'}
        {suffix && (
          <small style={{ fontSize: 14, fontWeight: 600, color: 'rgba(242,247,250,0.7)', marginLeft: 2 }}>
            {suffix}
          </small>
        )}
      </div>
      {trend && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            marginTop: 6,
            color: 'rgba(242,247,250,0.7)',
          }}
        >
          {trend}
        </div>
      )}
    </div>
  );
}
