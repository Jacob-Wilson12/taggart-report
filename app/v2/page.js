'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';
import { colors, font, sidebarWidth, topbarHeight } from './lib/theme';
import { DEPARTMENTS } from './lib/departments';
import {
  loadClients,
  loadReportData,
  loadServices,
  lastMonth,
  monthsBefore,
} from './lib/data';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Icon } from './components/Icons';
import { Overview } from './departments/Overview';
import { Seo } from './departments/Seo';
import { GoogleAds } from './departments/GoogleAds';
import { MetaAds } from './departments/MetaAds';
import { Gbp } from './departments/Gbp';
import { Social } from './departments/Social';
import { Leads } from './departments/Leads';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// Period picker options — mirror the mockup. For Phase 1 we only wire
// "last_month" and the raw month picks; quarter/YTD can come after.
function periodOptions(current) {
  const months = [current, ...monthsBefore(current, 3)];
  return months.map((m) => ({
    id: `${m.year}-${String(m.month).padStart(2, '0')}`,
    label: `${MONTH_NAMES[m.month - 1]} ${m.year}`,
    monthObj: m,
  }));
}

export default function OverviewPage() {
  // ─── Auth ───
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
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

  // ─── Clients + selection ───
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  useEffect(() => {
    if (!session) return;
    loadClients(session).then((list) => {
      setClients(list);
      if (list.length) setSelectedClient(list[0]);
    });
  }, [session]);

  // ─── Period ───
  const [current, setCurrent] = useState(() => lastMonth());
  const periods = useMemo(() => periodOptions(current), [current]);
  const selectedMonthId = `${current.year}-${String(current.month).padStart(2, '0')}`;
  const monthLabel = `${MONTH_NAMES[current.month - 1]} ${current.year}`;
  const handleMonthChange = useCallback(
    (id) => {
      const match = periods.find((p) => p.id === id);
      if (match) setCurrent(match.monthObj);
    },
    [periods]
  );

  // ─── Data ───
  const [byMonth, setByMonth] = useState({});
  const [services, setServices] = useState({});
  const [loading, setLoading] = useState(false);
  const [compareOn, setCompareOn] = useState(true);

  useEffect(() => {
    if (!selectedClient) return;
    setLoading(true);
    const trend = monthsBefore(current, 11); // past 12 incl. current
    trend.push(current);
    const prevMonth = monthsBefore(current, 1);
    const months = [...trend, ...prevMonth];
    Promise.all([
      loadReportData(selectedClient.id, months),
      loadServices(selectedClient.id),
    ])
      .then(([bm, svc]) => {
        setByMonth(bm);
        setServices(svc);
      })
      .finally(() => setLoading(false));
  }, [selectedClient, current]);

  // ─── Derived ───
  const currentKey = `${current.year}-${String(current.month).padStart(2, '0')}-01`;
  const prevObj = monthsBefore(current, 1)[0];
  const prevKey = `${prevObj.year}-${String(prevObj.month).padStart(2, '0')}-01`;
  const curr = byMonth[currentKey] || {};
  const prev = byMonth[prevKey] || {};

  // Build 12-month trend per department. For Overview we care about leads;
  // SEO uses organic_sessions; Google Ads + Meta Ads use total_spend. We
  // compute them once so each dept can pick what it wants.
  const trendMonths = useMemo(
    () => [...monthsBefore(current, 11), current],
    [current]
  );

  const leadTrend = useMemo(
    () =>
      trendMonths.map((m) => {
        const key = `${m.year}-${String(m.month).padStart(2, '0')}-01`;
        return {
          label: MONTH_NAMES[m.month - 1].slice(0, 3),
          year: m.year,
          leads: Number(byMonth[key]?.leads?.total_leads) || 0,
        };
      }),
    [byMonth, trendMonths]
  );

  const trendFor = useCallback(
    (dept, field) =>
      trendMonths.map((m) => {
        const key = `${m.year}-${String(m.month).padStart(2, '0')}-01`;
        return {
          label: MONTH_NAMES[m.month - 1].slice(0, 3),
          value: Number(byMonth[key]?.[dept]?.[field]) || 0,
        };
      }),
    [byMonth, trendMonths]
  );

  // ─── Nav state (page = overview/seo/...) ───
  const [activePage, setActivePage] = useState('overview');

  // ─── Render guards ───
  if (!authReady) {
    return <FullScreenMsg>Loading…</FullScreenMsg>;
  }
  if (!session) {
    return (
      <FullScreenMsg>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Sign in to view your report</h2>
          <p style={{ fontSize: 13, color: colors.textMuted }}>
            Head back to <a href="/" style={{ color: colors.brand }}>the main report</a> to sign in.
          </p>
        </div>
      </FullScreenMsg>
    );
  }

  // ─── Layout shell ───
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
      <Sidebar
        activePage={activePage}
        onNav={setActivePage}
        services={services}
      />
      <TopBar
        title={depTitle(activePage)}
        subtitle={selectedClient?.name}
        clients={clients}
        selectedClient={selectedClient}
        onClientChange={setSelectedClient}
        monthLabel={monthLabel}
        months={periods}
        selectedMonth={selectedMonthId}
        onMonthChange={handleMonthChange}
        compareOn={compareOn}
        onToggleCompare={() => setCompareOn((v) => !v)}
      />
      <main
        style={{
          gridArea: 'main',
          overflowY: 'auto',
          padding: '24px 28px 40px',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          {renderDept({
            activePage,
            selectedClient,
            monthLabel,
            curr,
            prev,
            leadTrend,
            trendFor,
            services,
            compareOn,
            loading,
            onNavDept: setActivePage,
          })}
        </div>
      </main>
    </div>
  );
}

function depTitle(id) {
  const d = DEPARTMENTS.find((x) => x.id === id);
  return d?.label || 'Overview';
}

function renderDept({
  activePage,
  selectedClient,
  monthLabel,
  curr,
  prev,
  leadTrend,
  trendFor,
  services,
  compareOn,
  loading,
  onNavDept,
}) {
  const common = { client: selectedClient, monthLabel, compareOn };

  switch (activePage) {
    case 'overview':
      return (
        <Overview
          {...common}
          curr={curr}
          prev={prev}
          leadTrend={leadTrend}
          services={services}
          onNavDept={onNavDept}
          loading={loading}
        />
      );
    case 'seo':
      return (
        <Seo
          {...common}
          dept={curr.seo || {}}
          prevDept={prev.seo || {}}
          trend={trendFor('seo', 'organic_sessions')}
        />
      );
    case 'google_ads':
      return (
        <GoogleAds
          {...common}
          dept={curr.google_ads || {}}
          prevDept={prev.google_ads || {}}
          trend={trendFor('google_ads', 'total_spend')}
        />
      );
    case 'meta_ads':
      return (
        <MetaAds
          {...common}
          dept={curr.meta_ads || {}}
          prevDept={prev.meta_ads || {}}
          trend={trendFor('meta_ads', 'total_spend')}
        />
      );
    case 'gbp':
      return (
        <Gbp
          {...common}
          dept={curr.gbp || {}}
          prevDept={prev.gbp || {}}
          trend={trendFor('gbp', 'profile_views')}
        />
      );
    case 'social':
      return (
        <Social
          {...common}
          dept={curr.social || {}}
          prevDept={prev.social || {}}
          trend={trendFor('social', 'fb_followers')}
        />
      );
    case 'leads':
      return (
        <Leads
          {...common}
          dept={curr.leads || {}}
          prevDept={prev.leads || {}}
          trend={trendFor('leads', 'total_leads')}
        />
      );
    default:
      return <ComingSoon dept={activePage} onBack={() => onNavDept('overview')} />;
  }
}

function FullScreenMsg({ children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: font.sans,
        background: colors.bg,
        color: colors.text,
      }}
    >
      {children}
    </div>
  );
}


// ──────────────────────────────────────────────────────────────────────────
// Placeholder for departments we haven't ported yet
// ──────────────────────────────────────────────────────────────────────────

function ComingSoon({ dept, onBack }) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px dashed ${colors.borderStrong}`,
        borderRadius: 12,
        padding: '60px 32px',
        textAlign: 'center',
        maxWidth: 500,
        margin: '60px auto',
      }}
    >
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
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
        {depTitle(dept)} page in progress
      </h2>
      <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 22, lineHeight: 1.55 }}>
        We&rsquo;ve built the Overview — department pages roll out in the next pass. Head back to
        Overview or use the current app at <a href="/" style={{ color: colors.brand }}>/</a> for now.
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
          fontFamily: font.sans,
        }}
      >
        <Icon name="arrowLeft" size={13} />
        Back to Overview
      </button>
    </div>
  );
}

