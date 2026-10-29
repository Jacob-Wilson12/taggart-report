'use client';

import { colors, font } from '../lib/theme';
import { Icon } from './Icons';

/**
 * Standard header used on every department page — title + client/month
 * subtitle + action buttons (share, download PDF).
 */
export function PageHeader({ title, client, monthLabel, onShare, onDownload }) {
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
          <DataThrough />
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

function DataThrough() {
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
      Data through today
    </span>
  );
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
