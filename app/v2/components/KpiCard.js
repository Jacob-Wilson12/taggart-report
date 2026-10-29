'use client';

import { colors, font, radius, shadow } from '../lib/theme';
import { Icon } from './Icons';

export function KpiCard({
  label,
  source,
  value,
  valueSuffix,
  delta,
  deltaLabel,
  spark,
  bench, // { tone: 'above' | 'on' | 'below', text }
  invertDelta = false,
  showCompare = true,
  valueColor,
}) {
  const deltaIsGood = delta != null
    ? invertDelta
      ? delta < 0
      : delta > 0
    : null;
  const deltaColor =
    delta == null || delta === 0
      ? colors.textMuted
      : deltaIsGood
      ? colors.positive
      : colors.negative;

  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        fontFamily: font.sans,
        transition: 'border-color 150ms, box-shadow 150ms, transform 150ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.brand;
        e.currentTarget.style.boxShadow = shadow.md;
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border;
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </span>
        {source && (
          <span style={{ fontSize: 10, color: colors.textDim, fontWeight: 500 }}>
            {source}
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          color: valueColor || colors.text,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value ?? '—'}
        {valueSuffix && (
          <small style={{ fontSize: 15, fontWeight: 600, color: colors.textMuted, marginLeft: 2 }}>
            {valueSuffix}
          </small>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {showCompare && delta != null && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 12,
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 4,
                color: deltaColor,
                background:
                  deltaColor === colors.positive
                    ? colors.positiveTint
                    : deltaColor === colors.negative
                    ? colors.negativeTint
                    : '#f1f5f9',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <Icon
                name={delta > 0 ? 'arrowUp' : 'arrowDown'}
                size={10}
                strokeWidth={3}
              />
              {Math.abs(Number(delta)).toFixed(1)}%
              {deltaLabel && (
                <span
                  style={{
                    color: colors.textMuted,
                    fontWeight: 500,
                    marginLeft: 2,
                    background: 'transparent',
                  }}
                >
                  {deltaLabel}
                </span>
              )}
            </span>
          )}
          {bench && (
            <BenchChip tone={bench.tone}>{bench.text}</BenchChip>
          )}
        </div>
        {spark && (
          <Sparkline
            points={spark}
            color={colors.brand}
            width={60}
            height={22}
          />
        )}
      </div>
    </div>
  );
}

function BenchChip({ tone = 'on', children }) {
  const dot =
    tone === 'above'
      ? colors.positive
      : tone === 'below'
      ? colors.warning
      : colors.brand;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        color: colors.textMuted,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: dot,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {children}
    </span>
  );
}

/** Mini SVG sparkline from an array of numbers. */
export function Sparkline({ points, color = '#2d7df6', width = 60, height = 22 }) {
  if (!points || points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const d = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
