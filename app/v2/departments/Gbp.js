'use client';

import { useMemo } from 'react';
import { colors, fmt, fmtDelta } from '../lib/theme';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { Card } from '../components/Card';
import { LineChart } from '../components/LineChart';
import { BarBreakdown } from '../components/BarBreakdown';
import { WorkCompleted } from '../components/WorkCompleted';

/**
 * Google Business Profile department page.
 *   dept = curr.gbp
 */
export function Gbp({ client, monthLabel, dept = {}, prevDept = {}, trend = [], compareOn, lastSynced }) {
  const viewsDelta = fmtDelta(dept.profile_views, prevDept.profile_views);
  const callsDelta = fmtDelta(dept.phone_calls, prevDept.phone_calls);
  const directionsDelta = fmtDelta(dept.direction_requests, prevDept.direction_requests);
  const ratingDelta = fmtDelta(dept.avg_rating, prevDept.avg_rating);

  const spark = trend.slice(-7).map((p) => p.value);

  const actionItems = useMemo(() => {
    const items = [
      { label: 'Website clicks', value: Number(dept.website_clicks) || 0, color: colors.brand, display: fmt(dept.website_clicks) },
      { label: 'Phone calls', value: Number(dept.phone_calls) || 0, color: colors.positive, display: fmt(dept.phone_calls) },
      { label: 'Direction requests', value: Number(dept.direction_requests) || 0, color: colors.purple, display: fmt(dept.direction_requests) },
    ];
    return items.filter((i) => i.value > 0);
  }, [dept]);

  const visibilityItems = useMemo(() => {
    const items = [
      { label: 'Search appearances', value: Number(dept.search_appearances) || 0, color: colors.brand, display: fmt(dept.search_appearances) },
      { label: 'Map views', value: Number(dept.map_views) || 0, color: colors.purple, display: fmt(dept.map_views) },
    ];
    return items.filter((i) => i.value > 0);
  }, [dept]);

  return (
    <>
      <PageHeader
        title="Google Business Profile"
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
          label="Profile Views"
          source="GBP Insights"
          value={fmt(dept.profile_views)}
          delta={viewsDelta}
          deltaLabel="MoM"
          showCompare={compareOn}
          spark={spark}
        />
        <KpiCard
          label="Phone Calls"
          source="CallRail · GBP"
          value={fmt(dept.phone_calls)}
          delta={callsDelta}
          deltaLabel="MoM"
          showCompare={compareOn}
          spark={spark}
        />
        <KpiCard
          label="Direction Requests"
          source="GBP"
          value={fmt(dept.direction_requests)}
          delta={directionsDelta}
          deltaLabel="MoM"
          showCompare={compareOn}
          spark={spark}
        />
        <KpiCard
          label="Google Rating"
          source={dept.review_count != null ? `${dept.review_count} reviews` : 'GBP'}
          value={dept.avg_rating != null ? Number(dept.avg_rating).toFixed(1) : '—'}
          valueSuffix={dept.avg_rating != null ? '/5' : null}
          delta={ratingDelta}
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
          title="Profile views · 12 months"
          subtitle="GBP Insights · impressions on your listing"
          tag="GBP"
        >
          <LineChart
            data={trend}
            gradientId="gbpViewsGrad"
            yFormat={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v)}
          />
        </Card>
        <Card title="Customer actions" subtitle={`What people did after finding you · ${monthLabel}`}>
          {actionItems.length ? (
            <BarBreakdown items={actionItems} />
          ) : (
            <EmptyMsg>No action data for this month yet.</EmptyMsg>
          )}
        </Card>
      </div>

      {visibilityItems.length > 0 && (
        <Card title="Visibility sources" subtitle="How people found your listing" style={{ marginTop: 12 }}>
          <BarBreakdown items={visibilityItems} />
        </Card>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginTop: 12,
        }}
      >
        <SmallStat label="New Reviews" value={fmt(dept.new_reviews)} />
        <SmallStat label="Photos on Profile" value={fmt(dept.photo_count)} />
        <SmallStat label="Posts Published" value={fmt(dept.posts_published)} />
      </div>

      {hasSummary(dept) && (
        <Card
          title={`Work completed · ${monthLabel}`}
          subtitle="Posts, photos, and review responses on your GBP listing"
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

function SmallStat({ label, value }) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: 14,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>{value}</div>
    </div>
  );
}

function hasSummary(dept) {
  return [dept.work_completed, dept.wins, dept.losses, dept.next_month]
    .some((v) => (v || '').trim());
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
