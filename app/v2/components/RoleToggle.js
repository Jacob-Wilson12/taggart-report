'use client';

import Link from 'next/link';
import { colors, radius } from '../lib/theme';
import { Icon } from './Icons';

/**
 * Pill-style toggle between the client Report view (/v2) and the team
 * Admin view (/v2/admin). Shown only to internal team members.
 */
export function RoleToggle({ current = 'report' }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        padding: 3,
        background: '#eef1f5',
        borderRadius: radius.sm,
        fontSize: 12,
        fontWeight: 600,
        gap: 2,
        marginRight: 4,
      }}
    >
      <Pill href="/v2" icon="overview" active={current === 'report'}>
        Report
      </Pill>
      <Pill href="/v2/admin" icon="search" active={current === 'admin'}>
        Admin
      </Pill>
    </div>
  );
}

function Pill({ href, icon, active, children }) {
  return (
    <Link
      href={href}
      style={{
        padding: '5px 12px',
        borderRadius: 5,
        color: active ? colors.text : colors.textMuted,
        background: active ? colors.surface : 'transparent',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        boxShadow: active
          ? '0 1px 2px rgba(15,23,42,0.06), 0 0 0 1px ' + colors.border
          : 'none',
      }}
    >
      <Icon
        name={icon}
        size={12}
        style={{ color: active ? colors.brand : 'currentColor' }}
      />
      {children}
    </Link>
  );
}
