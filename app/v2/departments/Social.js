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
 * Organic Social department. Lots of fields across FB / IG / YT / TikTok —
 * surface followers + reach + engagement at a glance, then platform
 * breakdowns.
 */
export function Social({ client, monthLabel, dept = {}, prevDept = {}, trend = [], compareOn }) {
  const fbFollowersDelta = fmtDelta(dept.fb_followers, prevDept.fb_followers);
  const igFollowersDelta = fmtDelta(dept.ig_followers, prevDept.ig_followers);

  const totalReach =
    (Number(dept.ig_reach) || 0) +
    (Number(dept.fb_visits) || 0) +
    (Number(dept.yt_month_views) || 0) +
    (Number(dept.tiktok_profile_views) || 0);
  const prevReach =
    (Number(prevDept.ig_reach) || 0) +
    (Number(prevDept.fb_visits) || 0) +
    (Number(prevDept.yt_month_views) || 0) +
    (Number(prevDept.tiktok_profile_views) || 0);
  const reachDelta = fmtDelta(totalReach, prevReach);

  const totalPublished =
    (Number(dept.fb_published) || 0) +
    (Number(dept.ig_published) || 0) +
    (Number(dept.yt_long_form_published) || 0) +
    (Number(dept.yt_shorts_published) || 0) +
    (Number(dept.tiktok_published) || 0);
  const prevPublished =
    (Number(prevDept.fb_published) || 0) +
    (Number(prevDept.ig_published) || 0) +
    (Number(prevDept.yt_long_form_published) || 0) +
    (Number(prevDept.yt_shorts_published) || 0) +
    (Number(prevDept.tiktok_published) || 0);
  const publishedDelta = fmtDelta(totalPublished, prevPublished);

  const spark = trend.slice(-7).map((p) => p.value);

  const reachByPlatform = useMemo(() => {
    const items = [
      { label: 'Facebook', value: Number(dept.fb_visits) || 0, color: '#1877f2', display: fmt(dept.fb_visits) },
      { label: 'Instagram', value: Number(dept.ig_reach) || 0, color: '#e1306c', display: fmt(dept.ig_reach) },
      { label: 'YouTube', value: Number(dept.yt_month_views) || 0, color: '#ff0000', display: fmt(dept.yt_month_views) },
      { label: 'TikTok', value: Number(dept.tiktok_profile_views) || 0, color: '#000000', display: fmt(dept.tiktok_profile_views) },
    ];
    return items.filter((i) => i.value > 0);
  }, [dept]);

  const engagementByPlatform = useMemo(() => {
    const items = [
      { label: 'Facebook', value: Number(dept.fb_engagement) || 0, color: '#1877f2', display: fmt(dept.fb_engagement) },
      { label: 'Instagram', value: Number(dept.ig_engagement) || 0, color: '#e1306c', display: fmt(dept.ig_engagement) },
      { label: 'TikTok likes', value: Number(dept.tiktok_likes) || 0, color: '#000000', display: fmt(dept.tiktok_likes) },
      { label: 'YouTube likes', value: Number(dept.yt_month_likes) || 0, color: '#ff0000', display: fmt(dept.yt_month_likes) },
    ];
    return items.filter((i) => i.value > 0);
  }, [dept]);

  return (
    <>
      <PageHeader
        title="Organic Social"
        client={client?.name}
        monthLabel={monthLabel}
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
          label="Facebook Followers"
          source="FB"
          value={fmt(dept.fb_followers)}
          delta={fbFollowersDelta}
          deltaLabel="MoM"
          showCompare={compareOn}
          spark={spark}
        />
        <KpiCard
          label="Instagram Followers"
          source="IG"
          value={fmt(dept.ig_followers)}
          delta={igFollowersDelta}
          deltaLabel="MoM"
          showCompare={compareOn}
          spark={spark}
        />
        <KpiCard
          label="Total Reach"
          source="All platforms"
          value={fmt(totalReach)}
          delta={reachDelta}
          deltaLabel="MoM"
          showCompare={compareOn}
          spark={spark}
        />
        <KpiCard
          label="Posts Published"
          source="All platforms"
          value={fmt(totalPublished)}
          delta={publishedDelta}
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
        <Card title={`Reach by platform · ${monthLabel}`} subtitle="How many unique viewers each platform drove" tag="Multi-platform">
          {reachByPlatform.length ? (
            <BarBreakdown items={reachByPlatform} />
          ) : (
            <EmptyMsg>No reach data for this month yet.</EmptyMsg>
          )}
        </Card>
        <Card title="Engagement" subtitle={`Likes + reactions · ${monthLabel}`}>
          {engagementByPlatform.length ? (
            <BarBreakdown items={engagementByPlatform} />
          ) : (
            <EmptyMsg>No engagement data for this month yet.</EmptyMsg>
          )}
        </Card>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <SmallStat label="FB Published" value={fmt(dept.fb_published)} />
        <SmallStat label="IG Published" value={fmt(dept.ig_published)} />
        <SmallStat label="YT Videos" value={fmt(dept.yt_long_form_published)} />
        <SmallStat label="TikToks" value={fmt(dept.tiktok_published)} />
      </div>

      {dept.top_video && (
        <Card title="Top video" subtitle={`Best-performing video · ${monthLabel}`} style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{dept.top_video}</div>
            {dept.top_video_views != null && (
              <div style={{ fontSize: 20, fontWeight: 700, color: colors.brand }}>
                {fmt(dept.top_video_views)} views
              </div>
            )}
          </div>
        </Card>
      )}

      {hasSummary(dept) && (
        <Card
          title={`Work completed · ${monthLabel}`}
          subtitle="Posts, videos, and campaigns from this month"
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
