'use client';

import { useMemo } from 'react';
import { colors, fmt, fmtDelta } from '../lib/theme';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { Card } from '../components/Card';
import { LineChart } from '../components/LineChart';
import { BarBreakdown } from '../components/BarBreakdown';
import { DataTable } from '../components/DataTable';
import { WorkCompleted } from '../components/WorkCompleted';

/**
 * SEO department page — real data in from Supabase.
 *   dept     = curr.seo (current month's data blob)
 *   prevDept = prev.seo (prior month)
 *   trend    = [{ label, value }, …] rolling 12 months of organic_sessions
 */
export function Seo({ client, monthLabel, dept = {}, prevDept = {}, trend = [], compareOn, lastSynced }) {
  const sessionsDelta = fmtDelta(dept.organic_sessions, prevDept.organic_sessions);
  const positionDelta = dept.avg_position && prevDept.avg_position
    ? Number(prevDept.avg_position) - Number(dept.avg_position) // smaller is better
    : null;
  const positionPct = positionDelta != null && prevDept.avg_position
    ? (positionDelta / Number(prevDept.avg_position)) * 100
    : null;
  const impressionsDelta = fmtDelta(dept.impressions, prevDept.impressions);
  const ctrDelta = fmtDelta(dept.ctr, prevDept.ctr);

  const spark = trend.slice(-7).map((p) => p.value);

  // Traffic by channel breakdown
  const channelItems = useMemo(() => {
    const items = [
      { key: 'organic_sessions', label: 'Organic', color: colors.brand },
      { key: 'paid_sessions',    label: 'Paid',    color: colors.purple },
      { key: 'direct_sessions',  label: 'Direct',  color: colors.positive },
      { key: 'social_sessions',  label: 'Social',  color: colors.warning },
      { key: 'site_visits_from_email', label: 'Email', color: colors.textMuted },
    ];
    return items
      .map((it) => ({ ...it, value: Number(dept[it.key]) || 0 }))
      .filter((it) => it.value > 0);
  }, [dept]);

  // Top queries table: dept.top_queries is an array (or might be null/legacy)
  const topQueries = useMemo(() => {
    const q = dept.top_queries;
    if (!Array.isArray(q)) return [];
    return q.slice(0, 10).map((row) => ({
      query: row.query || row.text || '—',
      position: row.position != null ? Number(row.position).toFixed(1) : '—',
      impressions: row.impressions != null ? Number(row.impressions).toLocaleString() : '—',
      clicks: row.clicks != null ? Number(row.clicks).toLocaleString() : '—',
      ctr: row.ctr != null ? `${(Number(row.ctr) * 100).toFixed(1)}%` : '—',
    }));
  }, [dept.top_queries]);

  return (
    <>
      <PageHeader
        title="SEO"
        client={client?.name}
        monthLabel={monthLabel}
        lastSynced={lastSynced}
        onShare={() => alert('Share flow coming in next pass')}
        onDownload={() => window.print()}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <KpiCard
          label="Organic Sessions"
          source="GA4"
          value={fmt(dept.organic_sessions)}
          delta={sessionsDelta}
          deltaLabel="MoM"
          showCompare={compareOn}
          spark={spark}
        />
        <KpiCard
          label="Avg Position"
          source="Search Console"
          value={dept.avg_position != null ? Number(dept.avg_position).toFixed(1) : '—'}
          delta={positionPct}
          deltaLabel="positions"
          showCompare={compareOn}
          invertDelta
        />
        <KpiCard
          label="Impressions"
          source="Search Console"
          value={fmt(dept.impressions)}
          delta={impressionsDelta}
          deltaLabel="MoM"
          showCompare={compareOn}
        />
        <KpiCard
          label="CTR"
          source="Search Console"
          value={dept.ctr != null ? `${Number(dept.ctr).toFixed(1)}` : '—'}
          valueSuffix={dept.ctr != null ? '%' : null}
          delta={ctrDelta}
          deltaLabel="MoM"
          showCompare={compareOn}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <Card
          title="Organic sessions · 12 months"
          subtitle="GA4 organic search channel"
          tag="GA4"
        >
          <LineChart
            data={trend}
            gradientId="seoSessionsGrad"
            yFormat={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)}
          />
        </Card>
        <Card
          title="Traffic by channel"
          subtitle={`Sessions attribution · ${monthLabel}`}
        >
          {channelItems.length ? (
            <BarBreakdown items={channelItems} />
          ) : (
            <EmptyMsg>No channel data for this month yet.</EmptyMsg>
          )}
        </Card>
      </div>

      <Card
        title="Website Conversions"
        subtitle="How many sessions it takes to drive each conversion type · NCM-style breakdown"
        tag="GA4 · CallRail"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <ConversionTile
            label="Phone Calls"
            source="Website click-to-calls"
            count={dept.phone_calls}
            sessions={Number(dept.total_sessions) || Number(dept.organic_sessions)}
            accent={colors.brand}
          />
          <ConversionTile
            label="Chats & Texts"
            source="Chat and SMS widgets"
            count={dept.chat_conversations}
            sessions={Number(dept.total_sessions) || Number(dept.organic_sessions)}
            accent={colors.purple}
          />
          <ConversionTile
            label="Lead Forms"
            source="On-site form submissions"
            count={dept.form_submissions}
            sessions={Number(dept.total_sessions) || Number(dept.organic_sessions)}
            accent={colors.positive}
          />
        </div>
      </Card>

      <Card
        title={`Top queries · ${monthLabel}`}
        subtitle="Ranked by impressions"
        tag="Search Console"
        style={{ marginTop: 12 }}
      >
        {topQueries.length ? (
          <DataTable
            columns={[
              { key: 'query', label: 'Query' },
              { key: 'position', label: 'Position', align: 'right' },
              { key: 'impressions', label: 'Impressions', align: 'right' },
              { key: 'clicks', label: 'Clicks', align: 'right' },
              { key: 'ctr', label: 'CTR', align: 'right' },
            ]}
            rows={topQueries}
          />
        ) : (
          <EmptyMsg>No top queries entered for this month yet.</EmptyMsg>
        )}
      </Card>

      {hasSummary(dept) && (
        <Card
          title={`Work completed · ${monthLabel}`}
          subtitle="What the Taggart team did on your SEO this month"
          style={{ marginTop: 12 }}
        >
          <WorkCompleted
            workCompleted={dept.work_completed}
            wins={dept.wins}
            losses={dept.losses}
            nextMonth={dept.next_month}
          />
        </Card>
      )}
    </>
  );
}

function hasSummary(dept) {
  return [dept.work_completed, dept.wins, dept.losses, dept.next_month]
    .some((v) => (v || '').trim());
}

/**
 * Three-row conversion tile matching Toyota NCM composite layout:
 *   Count → Conv Rate (% of sessions) → Session Ratio (1:N)
 */
function ConversionTile({ label, source, count, sessions, accent }) {
  const c = Number(count) || 0;
  const s = Number(sessions) || 0;
  const convRate = s > 0 && c > 0 ? (c / s) * 100 : null;
  const ratio = c > 0 && s > 0 ? Math.round(s / c) : null;

  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accent,
        }}
      />
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        {source && (
          <div style={{ fontSize: 10, color: colors.textDim, fontWeight: 500 }}>
            {source}
          </div>
        )}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: colors.text,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {c > 0 ? c.toLocaleString() : '—'}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          paddingTop: 10,
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <MiniStat
          label="Conv. Rate"
          value={convRate != null ? `${convRate.toFixed(2)}%` : '—'}
        />
        <MiniStat
          label="Session Ratio"
          value={ratio != null ? `1:${ratio.toLocaleString()}` : '—'}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: colors.text,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyMsg({ children }) {
  return (
    <div
      style={{
        padding: 24,
        textAlign: 'center',
        color: colors.textDim,
        fontSize: 12,
      }}
    >
      {children}
    </div>
  );
}
