'use client';

import { useEffect, useRef, useState } from 'react';
import { colors, font, radius, topbarHeight } from '../lib/theme';
import { Icon } from './Icons';

export function TopBar({ title, subtitle, clients, selectedClient, onClientChange, monthLabel, months, selectedMonth, onMonthChange, compareOn, onToggleCompare }) {
  return (
    <header
      style={{
        gridArea: 'topbar',
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px 0 24px',
        gap: 16,
        fontFamily: font.sans,
        height: topbarHeight,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.005em', color: colors.text }}>
        {title}
        {subtitle && (
          <>
            <span style={{ color: colors.textDim, margin: '0 6px' }}>·</span>
            <small style={{ color: colors.textMuted, fontWeight: 500 }}>{subtitle}</small>
          </>
        )}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Dropdown
          icon="home"
          label={selectedClient?.name || 'Pick a client'}
          items={(clients || []).map((c) => ({ id: c.id, label: c.name, sub: c.group_name }))}
          selectedId={selectedClient?.id}
          onSelect={(id) => {
            const c = (clients || []).find((x) => x.id === id);
            if (c) onClientChange?.(c);
          }}
        />
        <Dropdown
          icon="calendar"
          label={monthLabel}
          items={months || []}
          selectedId={selectedMonth}
          onSelect={onMonthChange}
        />
        <CompareToggle on={!!compareOn} onToggle={onToggleCompare} />
      </div>
    </header>
  );
}

function Dropdown({ icon, label, items, selectedId, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px 6px 12px',
          border: `1px solid ${colors.border}`,
          borderRadius: radius.sm,
          background: colors.surface,
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          color: colors.text,
          height: 32,
          fontFamily: 'inherit',
        }}
      >
        <Icon name={icon} size={13} style={{ opacity: 0.6 }} />
        <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <Icon name="caret" size={10} strokeWidth={2.5} style={{ opacity: 0.5 }} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            boxShadow: '0 6px 20px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.06)',
            minWidth: 240,
            maxHeight: 400,
            overflowY: 'auto',
            zIndex: 40,
          }}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(item.id);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 14px',
                fontSize: 13,
                cursor: 'pointer',
                color: colors.text,
                background: item.id === selectedId ? colors.brandTint : 'transparent',
                fontWeight: item.id === selectedId ? 600 : 400,
                width: '100%',
                border: 'none',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                if (item.id !== selectedId) e.currentTarget.style.background = colors.brandTint;
              }}
              onMouseLeave={(e) => {
                if (item.id !== selectedId) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span>{item.label}</span>
              {item.sub && (
                <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 400 }}>
                  {item.sub}
                </span>
              )}
              {item.id === selectedId && (
                <Icon name="check" size={13} strokeWidth={3} style={{ marginLeft: 'auto', color: colors.brand }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CompareToggle({ on, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        border: `1px solid ${on ? colors.brand : colors.border}`,
        borderRadius: radius.sm,
        background: on ? colors.brandTint : colors.surface,
        color: on ? colors.brandDark : colors.text,
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        userSelect: 'none',
        height: 32,
        fontFamily: 'inherit',
      }}
    >
      <span
        style={{
          width: 26,
          height: 15,
          background: on ? colors.brand : '#d1d5db',
          borderRadius: 999,
          position: 'relative',
          transition: 'background 150ms',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: 2,
            width: 11,
            height: 11,
            background: 'white',
            borderRadius: '50%',
            transition: 'transform 150ms',
            transform: on ? 'translateX(11px)' : 'translateX(0)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
          }}
        />
      </span>
      Compare
    </button>
  );
}
