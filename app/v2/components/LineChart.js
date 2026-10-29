'use client';

import { colors, font } from '../lib/theme';

/**
 * Reusable rolling-N-month line chart with gradient area fill. Data shape:
 *   [{ label: 'Jan', value: 1234, highlight?: boolean }, ...]
 *
 * Props:
 *   - height / width override defaults
 *   - yFormat callback for axis labels (defaults to toLocaleString)
 *   - gradientId must be unique per instance (uses gradient defs)
 *   - colorScheme defaults to brand
 */
export function LineChart({
  data,
  height = 220,
  width = 700,
  gradientId = 'lcGrad',
  color = colors.brand,
  yFormat = (v) => v.toLocaleString(),
}) {
  if (!data || data.length < 2) {
    return <EmptyChart height={height} />;
  }
  const pad = { l: 42, r: 20, t: 30, b: 36 };
  const vals = data.map((d) => Number(d.value) || 0);
  const rawMax = Math.max(1, ...vals);
  // Round to a nice ceiling for the Y axis
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const niceMax = Math.ceil(rawMax / magnitude) * magnitude;

  const chartW = width - pad.l - pad.r;
  const chartH = height - pad.t - pad.b;
  const xStep = chartW / Math.max(1, data.length - 1);

  const pts = data.map((d, i) => ({
    x: pad.l + i * xStep,
    y: pad.t + (1 - (Number(d.value) || 0) / niceMax) * chartH,
    d,
  }));

  const linePath = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${pad.t + chartH} L ${
    pts[0].x
  } ${pad.t + chartH} Z`;

  const ticks = [0, 1, 2, 3].map((i) => Math.round((niceMax / 3) * (3 - i)));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height, display: 'block' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.18" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => {
        const y = pad.t + (i / 3) * chartH;
        return (
          <g key={i}>
            <line
              x1={pad.l}
              x2={width - pad.r}
              y1={y}
              y2={y}
              stroke={colors.border}
              strokeWidth="1"
            />
            <text
              x={pad.l - 5}
              y={y + 3}
              textAnchor="end"
              fontSize="10"
              fill={colors.textDim}
              fontFamily={font.sans}
            >
              {yFormat(t)}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === pts.length - 1 ? 5 : 3}
          fill={color}
          stroke={i === pts.length - 1 ? 'white' : color}
          strokeWidth={i === pts.length - 1 ? 2 : 0}
        />
      ))}
      {pts.map((p, i) => (
        <text
          key={'lbl-' + i}
          x={p.x}
          y={height - 10}
          textAnchor="middle"
          fontSize="10"
          fill={i === pts.length - 1 ? color : colors.textDim}
          fontWeight={i === pts.length - 1 ? 600 : 400}
          fontFamily={font.sans}
        >
          {p.d.label}
        </text>
      ))}
    </svg>
  );
}

function EmptyChart({ height }) {
  return (
    <div
      style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.textDim,
        fontSize: 12,
        fontFamily: font.sans,
      }}
    >
      Not enough data yet to draw a trend.
    </div>
  );
}
