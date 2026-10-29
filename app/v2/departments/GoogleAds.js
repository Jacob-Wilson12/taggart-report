'use client';

import { useMemo } from 'react';
import { colors, fmt, fmtDelta } from '../lib/theme';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { Card } from '../components/Card';
import { LineChart } from '../components/LineChart';
import { BarBreakdown } from '../components/BarBreakdown';
import { WorkCompleted } from '../components/WorkCompleted';

export function GoogleAds({ client, monthLabel, dept = {}, prevDept = {}, trend = [], compareOn }) {
  const spendDelta = fmtDelta(dept.total_spend, prevDept.total_spend);
  const clicksDelta = fmtDelta(dept.clicks, prevDept.clicks);
  const conversionsDelta = fmtDelta(dept.conversions, prevDept.conversions);
  const cplDelta = fmtDelta(dept.cost_per_lead, prevDept.cost_per_lead);
  const spark = trend.slice(-7).map((p) => p.value);

  // Budget pacing — spent vs monthly budget
  const budget = Number(dept.budget) || 0;
  const spent = Number(dept.total_spend) || 0;
  const pacing = budget > 0 ? Math.min(100, (spent / budget) * 100) : null;

  const breakdown = useMemo(() => {
    const items = [
      { label: 'Clicks', value: Number(dept.clicks) || 0, color: colors.brand, display: fmt(dept.clicks) },
      { label: 'Impressions', value: Number(dept.impressions) || 0, color: colors.purple, display: fmt(dept.impressions) },
      { label: 'Conversions', value: Number(dept.conversions) || 0, color: colors.positive, display: fmt(dept.conversions) },
    ];
    return items.filter((it) => it.value > 0);
  }, [dept]);

  return (
    <>
      <PageHeader
        title="Google Ads"
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
          label="Spend"
          source="Google Ads"
          value={dept.total_spend != null ? `$${Math.round(Number(dept.total_spend)).toLocaleString()}` : '—'}
          delta={spendDelta}
          deltaLabel="MoM"
          showCompare={compareOn}
          spark={spark}
        />
        <KpiCard
          label="Clicks"
          source="Google Ads"
          value={fmt(dept.clicks)}
          delta={clicksDelta}
          deltaLabel="MoM"
          showCompare={compareOn}
          spark={spark}
        />
        <KpiCard
          label="Conversions"
          source="Google Ads"
          value={fmt(dept.conversions)}
          delta={conversionsDelta}
          deltaLabel="MoM"
          showCompare={compareOn}
          spark={spark}
        />
        <KpiCard
          label="Cost per Lead"
          source="Google Ads"
          value={dept.cost_per_lead != null ? `$${Number(dept.cost_per_lead).toFixed(2)}` : '—'}
          delta={cplDelta}
          deltaLabel="MoM"
          showCompare={compareOn}
          invertDelta
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
          title="Spend trend · 12 months"
          subtitle="Monthly Google Ads spend"
          tag="Google Ads"
        >
          <LineChart
            data={trend}
            gradientId="gadsSpendGrad"
            yFormat={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`}
          />
        </Card>
        <Card title="Performance mix" subtitle={`Volume breakdown · ${monthLabel}`}>
          {breakdown.length ? (
            <BarBreakdown items={breakdown} />
          ) : (
            <EmptyMsg>No performance data for this month yet.</EmptyMsg>
          )}
          {pacing != null && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${colors.border}` }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
                Budget Pacing
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                <span style={{ fontWeight: 600 }}>
                  ${Math.round(spent).toLocaleString()} of ${Math.round(budget).toLocaleString()}
                </span>
                <span style={{ color: colors.textMuted }}>{pacing.toFixed(0)}%</span>
              </div>
              <div style={{ height: 6, background: '#eef1f5', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${pacing}%`,
                    height: '100%',
                    background: pacing > 100 ? colors.negative : pacing > 90 ? colors.warning : colors.brand,
                  }}
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <SmallStat label="CTR" value={dept.ctr != null ? `${Number(dept.ctr).toFixed(2)}%` : '—'} />
        <SmallStat label="Avg CPC" value={dept.cpc != null ? `$${Number(dept.cpc).toFixed(2)}` : '—'} />
        <SmallStat label="Impression Share" value={dept.impression_share != null ? `${Number(dept.impression_share).toFixed(1)}%` : '—'} />
      </div>

      {dept.top_campaign && (
        <Card title="Top campaign" subtitle={`Best-performing campaign · ${monthLabel}`} style={{ marginTop: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{dept.top_campaign}</div>
        </Card>
      )}

      {hasSummary(dept) && (
        <Card
          title={`Work completed · ${monthLabel}`}
          subtitle="Campaign and creative work done this month"
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
