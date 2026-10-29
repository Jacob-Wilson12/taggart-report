'use client';

import { colors, fmt, fmtDelta, font } from '../lib/theme';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { Card, SectionTitle } from '../components/Card';
import { LineChart } from '../components/LineChart';

/**
 * Leads department — matches the existing app's 4×3 structure (per-source
 * Leads / Sold / Close % across Total / Website / Third Party / Facebook).
 *
 *   trend = [{ label, value, sold }] 12-month totals
 */
export function Leads({ client, monthLabel, dept = {}, prevDept = {}, trend = [], compareOn, lastSynced }) {
  const closePct = (sold, leads) => {
    const s = Number(sold);
    const l = Number(leads);
    if (!Number.isFinite(s) || !Number.isFinite(l) || l === 0) return null;
    return (s / l) * 100;
  };
  const closeDelta = (currSold, currLeads, prevSold, prevLeads) => {
    const curr = closePct(currSold, currLeads);
    const prev = closePct(prevSold, prevLeads);
    if (curr == null || prev == null || prev === 0) return null;
    return ((curr - prev) / prev) * 100;
  };

  const sources = [
    { key: 'total', label: 'Total', soldKey: 'total_sold', leadsKey: 'total_leads', source: 'All sources', color: colors.text, soldColor: colors.positive, closeColor: colors.brand },
    { key: 'website', label: 'Website', soldKey: 'website_sold', leadsKey: 'website_leads', source: 'Dealer site forms' },
    { key: 'third_party', label: 'Third Party', soldKey: 'third_party_sold', leadsKey: 'third_party', source: 'Cars.com, AutoTrader' },
    { key: 'facebook', label: 'Facebook', soldKey: 'facebook_sold', leadsKey: 'facebook_leads', source: 'Meta lead forms' },
  ];

  const leadsLine = trend.map((p) => ({ label: p.label, value: p.value || 0 }));

  return (
    <>
      <PageHeader
        title="Lead Summary"
        client={client?.name}
        monthLabel={monthLabel}
        lastSynced={lastSynced}
        onShare={() => alert('Share flow coming in next pass')}
        onDownload={() => window.print()}
      />

      {/* Row 1 — leads by source */}
      <SectionTitle>Leads</SectionTitle>
      <KpiRow>
        {sources.map((s) => (
          <KpiCard
            key={s.key + '-leads'}
            label={`${s.label} Leads`}
            source={s.source}
            value={fmt(dept[s.leadsKey])}
            delta={fmtDelta(dept[s.leadsKey], prevDept[s.leadsKey])}
            deltaLabel="vs prev"
            showCompare={compareOn}
            valueColor={s.color}
          />
        ))}
      </KpiRow>

      {/* Row 2 — sold by source */}
      <SectionTitle style={{ marginTop: 20 }}>Sold</SectionTitle>
      <KpiRow>
        {sources.map((s) => (
          <KpiCard
            key={s.key + '-sold'}
            label={`${s.label} Sold`}
            source="Tekion"
            value={fmt(dept[s.soldKey])}
            delta={fmtDelta(dept[s.soldKey], prevDept[s.soldKey])}
            deltaLabel="vs prev"
            showCompare={compareOn}
            valueColor={s.soldColor}
          />
        ))}
      </KpiRow>

      {/* Row 3 — close rate */}
      <SectionTitle style={{ marginTop: 20 }}>Close Rate</SectionTitle>
      <KpiRow>
        {sources.map((s) => {
          const pct = closePct(dept[s.soldKey], dept[s.leadsKey]);
          return (
            <KpiCard
              key={s.key + '-close'}
              label={`${s.label} Close %`}
              source="Sold ÷ Leads"
              value={pct != null ? pct.toFixed(1) : '—'}
              valueSuffix={pct != null ? '%' : null}
              delta={closeDelta(
                dept[s.soldKey],
                dept[s.leadsKey],
                prevDept[s.soldKey],
                prevDept[s.leadsKey]
              )}
              deltaLabel="vs prev"
              showCompare={compareOn}
              valueColor={s.closeColor}
            />
          );
        })}
      </KpiRow>

      <Card
        title="Leads · 12 months"
        subtitle="Rolling monthly lead totals"
        tag="All sources"
        style={{ marginTop: 24 }}
      >
        <LineChart data={leadsLine} gradientId="leadsLineGrad" />
      </Card>
    </>
  );
}

function KpiRow({ children }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}
