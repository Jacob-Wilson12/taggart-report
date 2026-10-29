// Shared design tokens for the /v2 redesign.
// Keep this file the single source of truth — every component imports from here.
// Match keys to the mockup CSS variables (--brand, --surface, etc.).

export const colors = {
  // Brand
  brand: '#2d7df6',
  brandCream: '#f2f7fa',
  brandDark: '#1e5cb8',
  brandTint: '#eff5ff',

  // Surfaces
  bg: '#f7f8fa',
  surface: '#ffffff',
  surfaceAlt: '#fafbfc',

  // Sidebar
  sidebarBg: '#0d1524',
  sidebarItem: '#94a3b8',
  sidebarItemActive: '#f2f7fa',
  sidebarHover: 'rgba(255,255,255,0.06)',
  sidebarActive: 'rgba(45,125,246,0.16)',

  // Text
  text: '#0f172a',
  textMuted: '#64748b',
  textDim: '#94a3b8',

  // Border
  border: '#e6e9ee',
  borderStrong: '#d1d5db',

  // Status
  positive: '#10b981',
  positiveTint: '#ecfdf5',
  negative: '#ef4444',
  negativeTint: '#fef2f2',
  warning: '#f59e0b',
  warningTint: '#fffbeb',
  info: '#3b82f6',
  infoTint: '#eff6ff',
  purple: '#8b5cf6',
  purpleTint: '#f5f3ff',
};

export const font = {
  sans: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'SF Mono', Menlo, Consolas, monospace",
};

export const radius = {
  xs: '5px',
  sm: '7px',
  md: '10px',
  lg: '12px',
  pill: '999px',
};

export const shadow = {
  sm: '0 1px 2px rgba(15,23,42,0.04)',
  md: '0 4px 12px rgba(15,23,42,0.06)',
  lg: '0 6px 20px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.06)',
};

// Layout
export const sidebarWidth = 232;
export const topbarHeight = 56;

// Shared helpers
export function fmt(n) {
  if (n == null || n === '') return '—';
  const num = Number(n);
  if (!Number.isFinite(num)) return '—';
  return num.toLocaleString();
}

export function fmtDelta(curr, prev) {
  if (curr == null || prev == null) return null;
  const a = Number(curr), b = Number(prev);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return ((a - b) / b) * 100;
}

export function toMonthStr(m) {
  const y = m.year, mm = String(m.month).padStart(2, '0');
  return `${y}-${mm}-01`;
}
