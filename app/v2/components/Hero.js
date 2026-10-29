'use client';

import { colors, font } from '../lib/theme';

// Subtle brick-wall texture — same aesthetic as the Taggart Badge logo.
// 220×110 tile with offset courses; dark navy base + low-opacity blue grout.
// Encoded as a URL-safe inline SVG so no network hop + no public asset.
const BRICK_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' width='220' height='110' viewBox='0 0 220 110'>
  <rect width='220' height='110' fill='%231a2540'/>
  <g stroke='%232d7df6' stroke-opacity='0.14' stroke-width='1' fill='none'>
    <path d='M0 0 L220 0 M0 55 L220 55 M0 110 L220 110'/>
    <path d='M0 0 L0 55 M110 0 L110 55 M220 0 L220 55'/>
    <path d='M55 55 L55 110 M165 55 L165 110'/>
  </g>
</svg>
`.trim();
const BRICK_URL = `data:image/svg+xml;utf8,${BRICK_SVG.replace(/\n/g, '').replace(/\s{2,}/g, ' ')}`;

/**
 * Dark gradient hero at the top of Overview. Three stat tiles alongside a
 * headline. Pass children for the stat slots or use the HeroStat helper.
 *
 * Uses a subtle brick-wall SVG pattern as texture — the same aesthetic as
 * the Taggart Badge logo, giving the header brand presence without
 * competing with the content.
 */
export function Hero({ kicker, title, subtitle, children }) {
  return (
    <div
      style={{
        background: `
          linear-gradient(135deg, rgba(13,21,36,0.92) 0%, rgba(26,37,64,0.92) 100%),
          url("${BRICK_URL}")
        `,
        backgroundSize: 'auto, 220px 110px',
        backgroundRepeat: 'no-repeat, repeat',
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
          background: 'radial-gradient(circle, rgba(45,125,246,0.22), transparent 70%)',
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
