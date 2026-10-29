'use client';

import { colors, fmt, fmtDelta, font } from '../lib/theme';
import { Hero, HeroStat } from '../components/Hero';
import { KpiCard } from '../components/KpiCard';
import { Card, SectionTitle } from '../components/Card';
import { DeptCard } from '../components/DeptCard';
import { LineChart } from '../components/LineChart';
import { Icon } from '../components/Icons';

export function Overview({ client, monthLabel, curr, prev, leadTrend, services, onNavDept, compareOn, loading }) {
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

  const spark = leadTrend.slice(-7).map((p) => p.leads);
  const lineData = leadTrend.map((p) => ({ label: p.label, value: p.leads }));

  if (loading) return <SkeletonOverview />;

  return (
    <>
      <Hero
        kicker={`${monthLabel} · ${client?.name || ''}`}
        title={headline(leads, totalLeadsDelta)}
        subtitle="Data through today · auto-refreshed on load"
      >
        <HeroStat
          label="Total Leads"
          value={fmt(leads.total_leads)}
          trend={
            compareOn && totalLeadsDelta != null ? (
              <TrendText delta={totalLeadsDelta} prev={prevLeads.total_leads} />
            ) : null
          }
        />
        <HeroStat
          label="Total Sold"
          value={fmt(leads.total_sold)}
          trend={
            compareOn && totalSoldDelta != null ? (
              <TrendText delta={totalSoldDelta} prev={prevLeads.total_sold} />
            ) : null
          }
        />
        <HeroStat
          label="Close Rate"
          value={closePct ?? '—'}
          suffix={closePct ? '%' : null}
          trend={
            compareOn && closeDelta != null ? (
              <TrendText delta={closeDelta} prev={prevClose?.toFixed(1)} suffix="%" />
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
        <LineChart data={lineData} gradientId="overviewLeadGrad" />
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

function TrendText({ delta, prev, suffix }) {
  const good = delta > 0;
  return (
    <>
      <span style={{ color: good ? '#6ee7b7' : '#fca5a5' }}>
        {good ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
      </span>{' '}
      {prev != null && (
        <span>
          vs {prev}
          {suffix || ''}
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

function SkeletonOverview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ height: 128, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ height: 110, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10 }} />
        ))}
      </div>
      <div style={{ height: 240, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10 }} />
    </div>
  );
}
