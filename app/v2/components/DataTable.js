'use client';

import { colors, font } from '../lib/theme';

/**
 * Styled table — pass columns + rows and we handle the chrome.
 *
 *   columns: [{ key, label, align?: 'left' | 'right', format? }, ...]
 *   rows:    [{ [key]: value, ... }, ...]
 */
export function DataTable({ columns, rows, emptyText = 'No rows yet.' }) {
  if (!rows || rows.length === 0) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: 'center',
          color: colors.textDim,
          fontSize: 12,
          fontFamily: font.sans,
        }}
      >
        {emptyText}
      </div>
    );
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: font.sans }}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              style={{
                textAlign: col.align || 'left',
                padding: '8px 10px',
                fontSize: 10,
                fontWeight: 700,
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                borderBottom: `1px solid ${colors.border}`,
                background: colors.surfaceAlt,
              }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {columns.map((col) => {
              const v = r[col.key];
              return (
                <td
                  key={col.key}
                  style={{
                    padding: 10,
                    borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${colors.border}`,
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: col.align || 'left',
                  }}
                >
                  {col.format ? col.format(v, r) : v ?? '—'}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
