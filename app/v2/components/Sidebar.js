'use client';

import { colors, font, radius, sidebarWidth } from '../lib/theme';
import { DEPARTMENTS } from '../lib/departments';
import { BrandMark } from './BrandMark';
import { Icon } from './Icons';

export function Sidebar({ activePage, onNav, services = {}, actions }) {
  const isEnabled = (d) =>
    d.alwaysOn || services[d.id] !== false; // default-on until proven off

  return (
    <aside
      style={{
        gridArea: 'sidebar',
        background: colors.sidebarBg,
        color: colors.sidebarItem,
        padding: '16px 12px 20px',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        fontFamily: font.sans,
      }}
    >
      <div
        style={{
          padding: '4px 8px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <BrandMark size={28} />
        <div
          style={{
            color: colors.sidebarItemActive,
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          Taggart
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              opacity: 0.55,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginTop: 1,
            }}
          >
            Reporting
          </div>
        </div>
      </div>

      <SectionLabel>Report</SectionLabel>
      {DEPARTMENTS.map((d) =>
        isEnabled(d) ? (
          <NavItem
            key={d.id}
            icon={d.icon}
            label={d.label}
            active={activePage === d.id}
            onClick={() => onNav?.(d.id)}
          />
        ) : null
      )}

      {actions && (
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <SectionLabel>Actions</SectionLabel>
          {actions}
        </div>
      )}
    </aside>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.09em',
        color: colors.textDim,
        textTransform: 'uppercase',
        padding: '16px 8px 4px',
        opacity: 0.55,
      }}
    >
      {children}
    </div>
  );
}

export function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 8px',
        borderRadius: radius.sm,
        color: active ? colors.sidebarItemActive : colors.sidebarItem,
        background: active ? colors.sidebarActive : 'transparent',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
        transition: 'background 100ms, color 100ms',
        userSelect: 'none',
        border: 'none',
        fontFamily: 'inherit',
        textAlign: 'left',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = colors.sidebarHover;
          e.currentTarget.style.color = colors.sidebarItemActive;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = colors.sidebarItem;
        }
      }}
    >
      <Icon
        name={icon}
        size={15}
        style={{ opacity: active ? 1 : 0.75 }}
      />
      {label}
    </button>
  );
}

export const SIDEBAR_WIDTH = sidebarWidth;
