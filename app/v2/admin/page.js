'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../../supabase';
import { colors, font, sidebarWidth, topbarHeight } from '../lib/theme';
import { ADMIN_DEPARTMENTS, DEPT_FIELDS, fieldCount, filledCount, sectionsFor } from '../lib/deptFields';
import { loadClients, lastMonth, monthsBefore } from '../lib/data';
import { Sidebar, NavItem } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { Icon } from '../components/Icons';
import { BrandMark } from '../components/BrandMark';
import { RoleToggle } from '../components/RoleToggle';
import {
  TopQueriesEditor,
  TrackedKeywordsEditor,
  PageLinksEditor,
  DurationEditor,
} from '../components/AdvancedEditors';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
function toMonthStr(m) {
  return `${m.year}-${String(m.month).padStart(2, '0')}-01`;
}
function labelMonth(m) {
  return `${MONTH_NAMES[m.month - 1].slice(0, 3)} ${String(m.year).slice(-2)}`;
}

export default function AdminPage() {
  // ─── Auth + role ───
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [role, setRole] = useState(null); // null until loaded
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        setAuthReady(true);
      });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) return;
    supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setRole((data?.role || 'user').toLowerCase()));
  }, [session]);
  const isTeam = role != null && ['admin', 'editor', 'account_manager'].includes(role);

  // ─── Clients ───
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  useEffect(() => {
    if (!session) return;
    loadClients(session).then((list) => {
      setClients(list);
      if (list.length) setSelectedClient(list[0]);
    });
  }, [session]);

  // ─── Period (current + past 3 for context) ───
  const [current, setCurrent] = useState(() => lastMonth());
  const pastMonths = useMemo(() => monthsBefore(current, 3), [current]);
  const periods = useMemo(() => {
    const list = [current, ...monthsBefore(current, 5)];
    return list.map((m) => ({
      id: `${m.year}-${String(m.month).padStart(2, '0')}`,
      label: `${MONTH_NAMES[m.month - 1]} ${m.year}`,
      monthObj: m,
    }));
  }, [current]);
  const selectedMonthId = `${current.year}-${String(current.month).padStart(2, '0')}`;
  const monthLabel = `${MONTH_NAMES[current.month - 1]} ${current.year}`;
  const handleMonthChange = useCallback(
    (id) => {
      const match = periods.find((p) => p.id === id);
      if (match) setCurrent(match.monthObj);
    },
    [periods]
  );

  // ─── Dept + Data ───
  const [activeDept, setActiveDept] = useState('seo');
  const [byMonth, setByMonth] = useState({}); // key -> { dept -> data }
  const [dirty, setDirty] = useState({}); // key -> true if local edits pending

  // Load current + past 3 months for selected client × active dept
  useEffect(() => {
    if (!selectedClient) return;
    const months = [current, ...pastMonths];
    const monthStrs = months.map(toMonthStr);
    supabase
      .from('report_data')
      .select('department, data, month')
      .eq('client_id', selectedClient.id)
      .in('month', monthStrs)
      .then(({ data }) => {
        const next = {};
        (data || []).forEach((r) => {
          const k = typeof r.month === 'string' ? r.month.substring(0, 10) : toMonthStr(r);
          if (!next[k]) next[k] = {};
          next[k][r.department] = r.data || {};
        });
        setByMonth(next);
      });
  }, [selectedClient, current, pastMonths]);

  const curKey = toMonthStr(current);
  const currentData = byMonth[curKey]?.[activeDept] || {};
  const pastData = pastMonths.map((m) => ({
    monthObj: m,
    label: labelMonth(m),
    data: byMonth[toMonthStr(m)]?.[activeDept] || {},
  }));

  const totalFields = fieldCount(activeDept);
  const filled = filledCount(activeDept, currentData);

  // ─── Save ───
  const saveTimerRef = useRef(null);
  const [savingState, setSavingState] = useState('idle'); // idle|saving|saved
  const saveField = useCallback(
    (key, value) => {
      // Optimistic local update
      setByMonth((prev) => ({
        ...prev,
        [curKey]: {
          ...(prev[curKey] || {}),
          [activeDept]: { ...((prev[curKey] || {})[activeDept] || {}), [key]: value },
        },
      }));
      setDirty((d) => ({ ...d, [`${curKey}:${activeDept}:${key}`]: true }));
      // Debounced upsert
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSavingState('saving');
      saveTimerRef.current = setTimeout(async () => {
        const existing = byMonth[curKey]?.[activeDept] || {};
        const nextData = { ...existing, [key]: value };
        const row = {
          client_id: selectedClient.id,
          department: activeDept,
          month: curKey,
          data: nextData,
          last_updated_at: new Date().toISOString(),
        };
        const { error } = await supabase
          .from('report_data')
          .upsert(row, { onConflict: 'client_id,department,month' });
        if (!error) {
          setSavingState('saved');
          setDirty((d) => {
            const next = { ...d };
            delete next[`${curKey}:${activeDept}:${key}`];
            return next;
          });
          setTimeout(() => setSavingState('idle'), 1500);
        } else {
          console.error('Save error', error);
          setSavingState('idle');
        }
      }, 500);
    },
    [byMonth, curKey, activeDept, selectedClient]
  );

  // ─── Render guards ───
  if (!authReady) return <FullScreenMsg>Loading…</FullScreenMsg>;
  if (!session) {
    return (
      <FullScreenMsg>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Sign in to use the admin</h2>
          <p style={{ fontSize: 13, color: colors.textMuted }}>
            Head to <a href="/" style={{ color: colors.brand }}>the main report</a> to sign in.
          </p>
        </div>
      </FullScreenMsg>
    );
  }
  if (role != null && !isTeam) {
    return (
      <FullScreenMsg>
        <div style={{ textAlign: 'center', maxWidth: 420, padding: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 20px',
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
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Team only</h2>
          <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 22, lineHeight: 1.55 }}>
            The admin is for internal Taggart team members. If you&rsquo;re looking for
            your performance report, head to the main report.
          </p>
          <a
            href="/v2"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              background: colors.brand,
              color: 'white',
              boxShadow: '0 1px 2px rgba(45,125,246,0.25)',
            }}
          >
            <Icon name="arrowLeft" size={13} />
            Go to the report
          </a>
        </div>
      </FullScreenMsg>
    );
  }
  if (role == null) {
    // Role query in flight — avoid flashing the admin UI
    return <FullScreenMsg>Checking access…</FullScreenMsg>;
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${sidebarWidth}px 1fr`,
        gridTemplateRows: `${topbarHeight}px 1fr`,
        gridTemplateAreas: '"sidebar topbar" "sidebar main"',
        height: '100vh',
        maxHeight: '100vh',
        background: colors.bg,
        fontFamily: font.sans,
      }}
    >
      <AdminSidebar
        activeDept={activeDept}
        onNav={setActiveDept}
        byMonth={byMonth}
        curKey={curKey}
      />
      <AdminTopBar
        activeDept={activeDept}
        selectedClient={selectedClient}
        clients={clients}
        onClientChange={setSelectedClient}
        monthLabel={monthLabel}
        periods={periods}
        selectedMonthId={selectedMonthId}
        onMonthChange={handleMonthChange}
        savingState={savingState}
      />
      <main
        style={{
          gridArea: 'main',
          overflowY: 'auto',
          padding: '24px 28px 40px',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <HealthRibbon
            dept={activeDept}
            monthLabel={monthLabel}
            clientName={selectedClient?.name}
            filled={filled}
            total={totalFields}
          />
          <AdminForm
            activeDept={activeDept}
            monthLabel={monthLabel}
            currentData={currentData}
            pastData={pastData}
            saveField={saveField}
          />
        </div>
      </main>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Shell pieces specific to the admin
// ──────────────────────────────────────────────────────────────────────────

function AdminSidebar({ activeDept, onNav, byMonth, curKey }) {
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
      <div style={{ padding: '4px 8px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BrandMark size={28} />
        <div style={{ color: colors.sidebarItemActive, fontWeight: 700, fontSize: 14, lineHeight: 1.1 }}>
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
            Admin
          </div>
        </div>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 3,
            background: 'rgba(245,158,11,0.2)',
            color: '#fbbf24',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Team
        </span>
      </div>

      <SectionLabel>Departments</SectionLabel>
      {ADMIN_DEPARTMENTS.map((d) => {
        const data = byMonth[curKey]?.[d.id] || {};
        const total = fieldCount(d.id);
        const have = filledCount(d.id, data);
        const chip = `${have}/${total}`;
        const needsWork = have < total;
        return (
          <SidebarItem
            key={d.id}
            icon={d.icon}
            label={d.label}
            active={activeDept === d.id}
            chip={chip}
            chipTone={needsWork ? 'warn' : 'ok'}
            onClick={() => onNav(d.id)}
          />
        );
      })}
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

function SidebarItem({ icon, label, active, chip, chipTone, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 8px',
        borderRadius: 6,
        color: active ? colors.sidebarItemActive : colors.sidebarItem,
        background: active ? colors.sidebarActive : 'transparent',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
        border: 'none',
        fontFamily: 'inherit',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <Icon name={icon} size={15} style={{ opacity: active ? 1 : 0.75 }} />
      <span style={{ flex: 1 }}>{label}</span>
      {chip && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 3,
            background: chipTone === 'warn' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
            color: chipTone === 'warn' ? '#fbbf24' : '#6ee7b7',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {chip}
        </span>
      )}
    </button>
  );
}

function AdminTopBar({ activeDept, selectedClient, clients, onClientChange, monthLabel, periods, selectedMonthId, onMonthChange, savingState }) {
  const deptLabel = ADMIN_DEPARTMENTS.find((d) => d.id === activeDept)?.label || 'Admin';
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
      <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
        {deptLabel}
        <span style={{ color: colors.textDim, margin: '0 6px' }}>·</span>
        <small style={{ color: colors.textMuted, fontWeight: 500 }}>
          {selectedClient?.name} · {monthLabel}
        </small>
      </div>
      <div style={{ flex: 1 }} />
      <AutosaveBadge state={savingState} />
      <RoleToggle current="admin" />
      <TopBar
        title=""
        clients={clients}
        selectedClient={selectedClient}
        onClientChange={onClientChange}
        monthLabel={monthLabel}
        months={periods}
        selectedMonth={selectedMonthId}
        onMonthChange={onMonthChange}
      />
    </header>
  );
}

function AutosaveBadge({ state }) {
  const label =
    state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : 'Autosave on';
  const color =
    state === 'saving' ? colors.textMuted : state === 'saved' ? colors.positive : colors.textDim;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        color,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          animation: state === 'saving' ? 'pulse 1s infinite' : 'none',
        }}
      />
      {label}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Health ribbon — the dark top banner on each dept
// ──────────────────────────────────────────────────────────────────────────

function HealthRibbon({ dept, monthLabel, clientName, filled, total }) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0d1524, #1e293b)',
        color: 'white',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 20,
        fontFamily: font.sans,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>
          {ADMIN_DEPARTMENTS.find((d) => d.id === dept)?.label || 'Dept'} · {monthLabel}
          <span style={{ color: 'rgba(242,247,250,0.55)', fontWeight: 500, marginLeft: 6, fontSize: 13 }}>
            {filled} of {total} fields populated · {clientName}
          </span>
        </div>
      </div>
      <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.08)', marginBottom: 12 }}>
        <div style={{ height: '100%', background: '#10b981', width: `${pct}%` }} />
      </div>
      <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'rgba(242,247,250,0.75)' }}>
        <span>
          <strong style={{ color: 'white', fontWeight: 700, marginRight: 4 }}>{filled}</strong>filled
        </span>
        <span>
          <strong style={{ color: 'white', fontWeight: 700, marginRight: 4 }}>{total - filled}</strong>remaining
        </span>
        <span style={{ marginLeft: 'auto' }}>
          <strong style={{ color: 'white', fontWeight: 700, marginRight: 4 }}>{pct}%</strong>complete
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// The form itself — grouped by section, past 3 months alongside each row
// ──────────────────────────────────────────────────────────────────────────

function AdminForm({ activeDept, monthLabel, currentData, pastData, saveField }) {
  const fields = DEPT_FIELDS[activeDept] || [];
  const sections = sectionsFor(activeDept);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {sections.map((section) => (
        <Section key={section} title={section}>
          {fields
            .filter((f) => f.section === section)
            .map((f) => (
              <FieldRow
                key={f.key}
                field={f}
                currentValue={currentData[f.key]}
                pastValues={pastData.map((p) => ({ label: p.label, value: p.data[f.key] }))}
                monthLabel={monthLabel}
                onSave={(v) => saveField(f.key, v)}
              />
            ))}
        </Section>
      ))}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, overflow: 'hidden' }}>
      <div
        style={{
          padding: '14px 20px',
          background: colors.surfaceAlt,
          borderBottom: `1px solid ${colors.border}`,
          fontSize: 14,
          fontWeight: 700,
          color: colors.text,
        }}
      >
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function FieldRow({ field, currentValue, pastValues, monthLabel, onSave }) {
  const [draft, setDraft] = useState(currentValue ?? '');
  useEffect(() => {
    // Reset local draft when month/client/dept changes
    setDraft(currentValue ?? '');
  }, [currentValue]);

  const isTextArea = field.type === 'textarea';
  const isAdvanced = field.type === 'advanced';
  const hasValue = currentValue != null && currentValue !== '';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr 300px 120px',
        gap: 14,
        alignItems: isTextArea ? 'flex-start' : 'center',
        padding: '14px 20px',
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 500 }}>
        {field.label}
        {field.synced && (
          <span style={{ marginLeft: 6, fontSize: 10, color: colors.purple, fontWeight: 700 }}>
            SYNCED
          </span>
        )}
        {field.hint && (
          <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: 400 }}>
            {field.hint}
          </div>
        )}
      </div>

      {isAdvanced ? (
        <AdvancedField field={field} value={currentValue} onSave={onSave} />
      ) : (
        <FieldInput
          type={field.type}
          value={draft}
          disabled={field.synced}
          onChange={(v) => setDraft(v)}
          onBlur={() => {
            if (draft !== (currentValue ?? '')) onSave(draft === '' ? null : draft);
          }}
          currentLabel={monthLabel}
        />
      )}

      <PastMonths items={pastValues} />

      <SourceBadge value={currentValue} synced={field.synced} />
    </div>
  );
}

/**
 * Dispatch to the right advanced editor based on field.key.
 */
function AdvancedField({ field, value, onSave }) {
  switch (field.key) {
    case 'top_queries':
      return <TopQueriesEditor value={value} onSave={onSave} />;
    case 'tracked_keywords':
      return <TrackedKeywordsEditor value={value} onSave={onSave} />;
    case 'page_links':
      return <PageLinksEditor value={value} onSave={onSave} />;
    case 'avg_session_duration':
      return <DurationEditor value={value} onSave={onSave} />;
    default:
      return (
        <div
          style={{
            fontSize: 12,
            color: colors.textDim,
            fontStyle: 'italic',
          }}
        >
          No editor yet for <code>{field.key}</code> —{' '}
          <a href="/admin" style={{ color: colors.brand }}>
            edit in legacy admin
          </a>
          .
        </div>
      );
  }
}

function FieldInput({ type, value, disabled, onChange, onBlur, currentLabel }) {
  if (type === 'textarea') {
    return (
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        rows={3}
        placeholder={disabled ? 'Auto-synced' : `${currentLabel}…`}
        style={{
          padding: '8px 10px',
          borderRadius: 6,
          border: `1px solid ${colors.border}`,
          fontSize: 13,
          fontFamily: 'inherit',
          lineHeight: 1.4,
          resize: 'vertical',
          background: disabled ? colors.surfaceAlt : 'white',
          color: colors.text,
        }}
      />
    );
  }
  const isNum = type === 'number' || type === 'decimal';
  return (
    <input
      type={isNum ? 'number' : 'text'}
      step={type === 'decimal' ? '0.01' : undefined}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      placeholder={disabled ? 'Auto-synced' : currentLabel}
      style={{
        padding: '8px 10px',
        borderRadius: 6,
        border: `1px solid ${colors.border}`,
        fontSize: 13,
        fontFamily: 'inherit',
        background: disabled ? colors.surfaceAlt : 'white',
        color: colors.text,
        fontVariantNumeric: 'tabular-nums',
      }}
    />
  );
}

function PastMonths({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            textAlign: 'center',
            padding: '6px 4px',
            borderRadius: 5,
            background: colors.surfaceAlt,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 2,
            }}
          >
            {it.label}
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: it.value != null ? colors.text : colors.textDim,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {it.value != null && it.value !== '' ? it.value : '—'}
          </div>
        </div>
      ))}
    </div>
  );
}

function SourceBadge({ value, synced }) {
  const hasValue = value != null && value !== '';
  if (synced) {
    return (
      <Badge color={colors.purple} bg={colors.purpleTint}>
        auto-synced
      </Badge>
    );
  }
  if (hasValue) {
    return (
      <Badge color={colors.brandDark} bg={colors.brandTint}>
        manual
      </Badge>
    );
  }
  return (
    <Badge color="#991b1b" bg="#fef2f2">
      missing
    </Badge>
  );
}

function Badge({ color, bg, children }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        borderRadius: 5,
        fontSize: 11,
        fontWeight: 600,
        color,
        background: bg,
        justifySelf: 'start',
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
      {children}
    </span>
  );
}

function FullScreenMsg({ children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: colors.bg,
        color: colors.text,
        fontFamily: font.sans,
      }}
    >
      {children}
    </div>
  );
}
