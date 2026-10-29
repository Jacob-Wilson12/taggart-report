'use client';

import { colors, font } from '../lib/theme';

/**
 * "Work Completed · Month" card. Accepts the raw textarea blob from
 * report_data.{dept}.work_completed and renders it as a clean list — one
 * line per entry. Wins / losses / next month can be passed too.
 */
export function WorkCompleted({ workCompleted, wins, losses, nextMonth, title = 'Summary' }) {
  const hasAny = [workCompleted, wins, losses, nextMonth].some((v) => (v || '').trim());
  if (!hasAny) return null;

  return (
    <div style={{ fontFamily: font.sans }}>
      <SubList label="Work completed" text={workCompleted} tone="brand" />
      <SubList label="Wins" text={wins} tone="positive" />
      <SubList label="Watch items" text={losses} tone="warning" />
      <SubList label="What's coming next month" text={nextMonth} tone="purple" />
    </div>
  );
}

function SubList({ label, text, tone }) {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;
  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
  const borderColor =
    tone === 'positive'
      ? colors.positive
      : tone === 'warning'
      ? colors.warning
      : tone === 'purple'
      ? colors.purple
      : colors.brand;
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          borderLeft: `2px solid ${borderColor}`,
        }}
      >
        {lines.map((line, i) => (
          <li
            key={i}
            style={{
              fontSize: 13,
              color: colors.text,
              paddingLeft: 12,
              paddingTop: 4,
              paddingBottom: 4,
              lineHeight: 1.55,
            }}
          >
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
