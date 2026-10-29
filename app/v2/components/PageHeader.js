'use client';

import { colors, font } from '../lib/theme';
import { Icon } from './Icons';

/**
 * Standard header used on every department page — title + client/month
 * subtitle + action buttons (share, download PDF).
 */
export function PageHeader({ title, client, monthLabel, lastSynced, onShare, onDownload }) {
  return (
    <div
      style={{
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        fontFamily: font.sans,
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: 3,
            color: colors.text,
          }}
        >
          {title}
        </h1>
        <div
          style={{
            color: colors.textMuted,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          {monthLabel && <span>{monthLabel}</span>}
          {monthLabel && client && <span>·</span>}
          {client && <span>{client}</span>}
          <DataThrough lastSynced={lastSynced} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {onDownload && (
          <ActionBtn tone="ghost" onClick={onDownload} icon="download">
            PDF
          </ActionBtn>
        )}
        {onShare && (
          <ActionBtn tone="primary" onClick={onShare} icon="share">
            Share
          </ActionBtn>
        )}
      </div>
    </div>
  );
}

function DataThrough({ lastSynced }) {
  const label = lastSynced
    ? `Synced ${formatSyncTime(lastSynced)}`
    : 'Data through today';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 9px',
        background: colors.brandTint,
        color: colors.brandDark,
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: colors.brand,
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
}

function formatSyncTime(d) {
  if (!(d instanceof Date)) return '—';
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function ActionBtn({ tone, onClick, icon, children }) {
  const bg = tone === 'primary' ? colors.brand : colors.surface;
  const color = tone === 'primary' ? 'white' : colors.text;
  const border = tone === 'primary' ? 'transparent' : colors.border;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 14px',
        borderRadius: 7,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        border: `1px solid ${border}`,
        background: bg,
        color,
        fontFamily: 'inherit',
        boxShadow: tone === 'primary' ? '0 1px 2px rgba(45,125,246,0.25)' : 'none',
      }}
    >
      {icon && <Icon name={icon} size={13} />}
      {children}
    </button>
  );
}
