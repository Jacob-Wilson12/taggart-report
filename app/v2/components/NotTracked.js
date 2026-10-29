'use client';

import { colors, font } from '../lib/theme';
import { Icon } from './Icons';
import { DEPT_LABELS } from '../lib/departments';

/**
 * Friendly empty state shown when a user navigates to a department that
 * isn't enabled for the currently-selected client. From the mockup Jacob
 * approved: "SEO isn't tracked for Juneau Honda — head back to Overview."
 */
export function NotTracked({ dept, clientName, onBack }) {
  const label = DEPT_LABELS[dept] || 'That department';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '60px 32px',
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        maxWidth: 480,
        margin: '60px auto',
        fontFamily: font.sans,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          marginBottom: 20,
          background: colors.brandTint,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.brand,
        }}
      >
        <Icon name="circleBan" size={26} />
      </div>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          marginBottom: 8,
        }}
      >
        {label} isn&rsquo;t tracked for {clientName || 'this client'}
      </h2>
      <p
        style={{
          color: colors.textMuted,
          fontSize: 13,
          marginBottom: 22,
          lineHeight: 1.55,
        }}
      >
        This dealership doesn&rsquo;t run this service through Taggart Advertising,
        so there&rsquo;s no data to show here. Head back to the Overview for services
        that are active.
      </p>
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 14px',
          borderRadius: 7,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          border: 'none',
          background: colors.brand,
          color: 'white',
          fontFamily: 'inherit',
          boxShadow: '0 1px 2px rgba(45,125,246,0.25)',
        }}
      >
        <Icon name="arrowLeft" size={13} />
        Back to Overview
      </button>
    </div>
  );
}
