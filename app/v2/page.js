'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';
import { colors, font, fmt, fmtDelta, sidebarWidth, topbarHeight } from './lib/theme';
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
import { Hero, HeroStat } from './components/Hero';
import { KpiCard } from './components/KpiCard';
import { Card, SectionTitle } from './components/Card';
import { DeptCard } from './components/DeptCard';
import { Icon } from './components/Icons';

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

  // Build 12-month lead series
  const leadTrend = useMemo(() => {
    const months = [...monthsBefore(current, 11), current];
    return months.map((m) => {
      const key = `${m.year}-${String(m.month).padStart(2, '0')}-01`;
      const l = Number(byMonth[key]?.leads?.total_leads) || 0;
      return { label: MONTH_NAMES[m.month - 1].slice(0, 3), year: m.year, leads: l };
    });
  }, [byMonth, current]);

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
          {activePage === 'overview' ? (
            <OverviewBody
              client={selectedClient}
              monthLabel={monthLabel}
              curr={curr}
              prev={prev}
              leadTrend={leadTrend}
              services={services}
              onNavDept={setActivePage}
              compareOn={compareOn}
              loading={loading}
            />
          ) : (
            <ComingSoon dept={activePage} onBack={() => setActivePage('overview')} />
          )}
        </div>
      </main>
    </div>
  );
}

function depTitle(id) {
  const d = DEPARTMENTS.find((x) => x.id === id);
  return d?.label || 'Overview';
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
// Overview body
// ──────────────────────────────────────────────────────────────────────────

function OverviewBody({ client, monthLabel, curr, prev, leadTrend, services, onNavDept, compareOn, loading }) {
  const leads = curr.leads || {};
  const prevLeads = prev.leads || {};
  const seo = curr.seo || {};
  const prevSeo = prev.seo || {};
  const gbp = curr.gbp || {};
  const prevGbp = prev.gbp || {};
  const gads = curr.google_ads || {};
  const prevGads = prev.google_ads || {};
  const metaAds = curr.meta_ads || {};
  const prevMetaAds = prev.meta_ads || {};
  const social = curr.social || {};
  const prevSocial = prev.social || {};
  const callrail = curr.callrail || {};
  const prevCallrail = prev.callrail || {};

  const closePct =
    leads.total_sold != null && leads.total_leads
      ? ((Number(leads.total_sold) / Number(leads.total_leads)) * 100).toFixed(1)
      : null;

  const prevClose =
    prevLeads.total_sold != null && prevLeads.total_leads
      ? (Number(prevLeads.total_sold) / Number(prevLeads.total_leads)) * 100
      : null;

  const closeDelta =
    closePct != null && prevClose != null && prevClose !== 0
      ? ((Number(closePct) - prevClose) / prevClose) * 100
      : null;

  const totalLeadsDelta = fmtDelta(leads.total_leads, prevLeads.total_leads);
  const totalSoldDelta = fmtDelta(leads.total_sold, prevLeads.total_sold);
  const sessionsDelta = fmtDelta(seo.organic_sessions, prevSeo.organic_sessions);
  const callsDelta = fmtDelta(callrail.total_calls, prevCallrail.total_calls);
  const spendDelta = fmtDelta(
    (Number(gads.total_spend) || 0) + (Number(metaAds.total_spend) || 0),
    (Number(prevGads.total_spend) || 0) + (Number(prevMetaAds.total_spend) || 0)
  );
  const ratingDelta = fmtDelta(gbp.avg_rating, prevGbp.avg_rating);

  const totalSpend =
    (Number(gads.total_spend) || 0) + (Number(metaAds.total_spend) || 0);

  // Lead sparkline — last 7 months
  const spark = leadTrend.slice(-7).map((p) => p.leads);

  if (loading) {
    return <SkeletonOverview />;
  }

  return (
    <>
      <Hero
        kicker={`${monthLabel} · ${client?.name || ''}`}
        title={headline(leads, totalLeadsDelta)}
        subtitle={`Data through today · auto-refreshed on load`}
      >
        <HeroStat
          label="Total Leads"
          value={fmt(leads.total_leads)}
          trend={
            compareOn && totalLeadsDelta != null ? (
              <TrendText delta={totalLeadsDelta} prev={prevLeads.total_leads} prevLabel="March" />
            ) : null
          }
        />
        <HeroStat
          label="Total Sold"
          value={fmt(leads.total_sold)}
          trend={
            compareOn && totalSoldDelta != null ? (
              <TrendText delta={totalSoldDelta} prev={prevLeads.total_sold} prevLabel="March" />
            ) : null
          }
        />
        <HeroStat
          label="Close Rate"
          value={closePct ?? '—'}
          suffix={closePct ? '%' : null}
          trend={
            compareOn && closeDelta != null ? (
              <TrendText delta={closeDelta} prev={prevClose?.toFixed(1)} prevLabel="March" suffix="%" />
            ) : null
          }
        />
      </Hero>

      <SectionTitle>Top-line KPIs</SectionTitle>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <KpiCard
          label="Website Sessions"
          source="GA4"
          value={fmt(seo.organic_sessions)}
          delta={sessionsDelta}
          deltaLabel="MoM"
          showCompare={compareOn}
          spark={spark}
        />
        <KpiCard
          label="Phone Calls"
          source="CallRail"
          value={fmt(callrail.total_calls)}
          delta={callsDelta}
          deltaLabel="MoM"
          showCompare={compareOn}
          spark={spark}
        />
        <KpiCard
          label="Ad Spend"
          source="Google + Meta"
          value={totalSpend ? `$${Math.round(totalSpend).toLocaleString()}` : '—'}
          delta={spendDelta}
          deltaLabel="MoM"
          showCompare={compareOn}
          invertDelta
          spark={spark}
        />
        <KpiCard
          label="Google Rating"
          source="GBP"
          value={gbp.avg_rating != null ? Number(gbp.avg_rating).toFixed(1) : '—'}
          valueSuffix={gbp.avg_rating != null ? '/5' : null}
          delta={ratingDelta}
          deltaLabel="MoM"
          showCompare={compareOn}
          spark={spark}
        />
      </div>

      <Card
        title="Lead Trend · Rolling 12 months"
        subtitle="Total leads by month, from all channels"
        tag="All channels"
      >
        <LeadTrendChart data={leadTrend} />
      </Card>

      <SectionTitle style={{ marginTop: 24 }}>Departments this month</SectionTitle>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          marginTop: 16,
        }}
      >
        {services.seo !== false && (
          <DeptCard
            icon="seo"
            name="SEO"
            summary={`${fmt(seo.organic_sessions)} organic sessions · avg pos ${
              seo.avg_position ? Number(seo.avg_position).toFixed(1) : '—'
            }`}
            value={fmt(seo.organic_sessions)}
            delta={sessionsDelta}
            onClick={() => onNavDept('seo')}
          />
        )}
        {services.gbp !== false && (
          <DeptCard
            icon="gbp"
            name="Google Business Profile"
            summary={`${fmt(gbp.profile_views)} profile views · ${fmt(callrail.gbp_calls)} calls`}
            value={fmt(gbp.profile_views)}
            delta={fmtDelta(gbp.profile_views, prevGbp.profile_views)}
            onClick={() => onNavDept('gbp')}
          />
        )}
        {services.google_ads !== false && (
          <DeptCard
            icon="google_ads"
            name="Google Ads"
            summary={`${
              gads.total_spend ? `$${Number(gads.total_spend).toLocaleString()}` : '—'
            } spend · ${fmt(gads.conversions)} conversions`}
            value={fmt(gads.conversions)}
            delta={fmtDelta(gads.conversions, prevGads.conversions)}
            onClick={() => onNavDept('google_ads')}
          />
        )}
        {services.meta_ads !== false && (
          <DeptCard
            icon="meta_ads"
            name="Meta Ads"
            summary={`${
              metaAds.total_spend ? `$${Number(metaAds.total_spend).toLocaleString()}` : '—'
            } spend · ${fmt(metaAds.conversions)} conversions`}
            value={fmt(metaAds.conversions)}
            delta={fmtDelta(metaAds.conversions, prevMetaAds.conversions)}
            onClick={() => onNavDept('meta_ads')}
          />
        )}
        {services.social !== false && (
          <DeptCard
            icon="social"
            name="Organic Social"
            summary={`FB ${fmt(social.fb_followers)} · IG ${fmt(social.ig_followers)}`}
            value={fmt(social.total_published)}
            delta={fmtDelta(social.total_published, prevSocial.total_published)}
            onClick={() => onNavDept('social')}
          />
        )}
        {services.leads !== false && (
          <DeptCard
            icon="leads"
            name="Leads"
            summary={`${fmt(leads.total_leads)} total · ${fmt(leads.total_sold)} sold · ${
              closePct || '—'
            }% close`}
            value={fmt(leads.total_leads)}
            delta={totalLeadsDelta}
            onClick={() => onNavDept('leads')}
          />
        )}
      </div>
    </>
  );
}

function TrendText({ delta, prev, prevLabel, suffix }) {
  const good = delta > 0;
  return (
    <>
      <span style={{ color: good ? '#6ee7b7' : '#fca5a5' }}>
        {good ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
      </span>{' '}
      {prev != null && (
        <span>
          vs {prev}
          {suffix || ''} {prevLabel ? '' : ''}
        </span>
      )}
    </>
  );
}

function headline(leads, delta) {
  if (!leads?.total_leads) return 'Report ready';
  if (delta == null) return 'Solid month across every channel';
  if (delta >= 10) return 'Big month — leads trending up';
  if (delta >= 0) return 'Solid month across every channel';
  if (delta >= -10) return 'Slower month — watch the pipeline';
  return 'Down month — need to course-correct';
}

// ──────────────────────────────────────────────────────────────────────────
// Lead trend chart (SVG)
// ──────────────────────────────────────────────────────────────────────────

function LeadTrendChart({ data }) {
  const width = 800;
  const height = 200;
  const pad = { l: 40, r: 20, t: 20, b: 24 };
  const vals = data.map((d) => d.leads);
  const max = Math.max(60, ...vals);
  const niceMax = Math.ceil(max / 60) * 60;
  const xStep = (width - pad.l - pad.r) / Math.max(1, data.length - 1);

  const points = data.map((d, i) => {
    const x = pad.l + i * xStep;
    const y = pad.t + (1 - d.leads / niceMax) * (height - pad.t - pad.b);
    return { x, y, d };
  });
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - pad.b} L ${
    points[0].x
  } ${height - pad.b} Z`;

  const ticks = [0, 1, 2, 3].map((i) => Math.round((niceMax / 3) * (3 - i)));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height, display: 'block' }}>
      <defs>
        <linearGradient id="v2LeadGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={colors.brand} stopOpacity="0.2" />
          <stop offset="1" stopColor={colors.brand} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => {
        const y = pad.t + (i / 3) * (height - pad.t - pad.b);
        return (
          <g key={t + '-' + i}>
            <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke={colors.border} strokeWidth="1" />
            <text
              x={pad.l - 5}
              y={y + 3}
              textAnchor="end"
              fontSize="10"
              fill={colors.textDim}
              fontFamily={font.sans}
            >
              {t}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#v2LeadGrad)" />
      <path d={linePath} fill="none" stroke={colors.brand} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 5 : 3}
          fill={colors.brand}
          stroke="white"
          strokeWidth={i === points.length - 1 ? 2 : 0}
        />
      ))}
      {points.map((p, i) => (
        <text
          key={'lbl-' + i}
          x={p.x}
          y={height - 4}
          textAnchor="middle"
          fontSize="10"
          fill={i === points.length - 1 ? colors.brand : colors.textDim}
          fontWeight={i === points.length - 1 ? 600 : 400}
          fontFamily={font.sans}
        >
          {p.d.label}
        </text>
      ))}
    </svg>
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

function SkeletonOverview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ height: 128, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 110,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
            }}
          />
        ))}
      </div>
      <div style={{ height: 240, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10 }} />
    </div>
  );
}
