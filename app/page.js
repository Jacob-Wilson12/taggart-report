'use client';
import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "../supabase";

/* ─── CONSTANTS ─── */
const C = {
  white: "#fff", navy: "#0c1a2e", cyan: "#00c9e8", cyanD: "#00a5bf",
  cyanL: "#e6f9fc", bc: "#1b3254", bl: "#243e63", bb: "#2d5080",
  t: "#1a1a2e", tl: "#6b7280", bd: "#d0d5dd", bl2: "#e4e7ec",
  g: "#10b981", gL: "#ecfdf5", r: "#ef4444", rL: "#fef2f2",
  o: "#f59e0b", oL: "#fffbeb", p: "#8b5cf6",
  sh: "0 2px 6px rgba(0,0,0,0.08)", bg: "#ebedf1",
};
const F = "Inter,system-ui,sans-serif";
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CLIENT_ORDER = ["Goode Motor Group","Goode Motor Ford","Goode Motor Mazda","Twin Falls Volkswagen","Juneau Auto Mall","Juneau Subaru","Juneau CDJR","Juneau Toyota","Juneau Chevrolet","Juneau Honda","Juneau Powersports","Cassia Car Rental","Explore Juneau"];

const DEPT_TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "seo",       label: "🔍 SEO" },
  { id: "gbp",       label: "📍 Google Business" },
  { id: "google_ads",label: "📢 Google Ads" },
  { id: "meta_ads",  label: "📱 Meta Ads" },
  { id: "social",    label: "🎬 Organic Social" },
  { id: "email",     label: "✉️ Email" },
  { id: "creative",  label: "🎨 Creative" },
];

const ts = { background: C.white, border: `1px solid ${C.bd}`, borderRadius: 8, fontSize: 12, color: C.t, fontFamily: F };

/* ─── UTILITIES ─── */
const fmt = (v, type = "number") => {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (isNaN(n)) return v;
  if (type === "currency") return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (type === "pct") return n.toFixed(1) + "%";
  if (type === "decimal") return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return n.toLocaleString();
};
const fmtDur = (seconds) => {
  if (!seconds) return "—";
  const s = Number(seconds);
  if (isNaN(s)) return seconds;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}:${String(rem).padStart(2, "0")}`;
};
const lines = (str) => str ? str.split("\n").map(l => l.trim()).filter(Boolean) : [];

/* ─── SHARED COMPONENTS ─── */
const Tip = ({ text }) => {
  const [s, ss] = useState(false);
  return (
    <span onMouseEnter={() => ss(true)} onMouseLeave={() => ss(false)} style={{ position: "relative", cursor: "help", marginLeft: 4, color: C.tl, fontSize: 12 }}>
      &#9432;
      {s && <span style={{ position: "absolute", bottom: "120%", left: "50%", transform: "translateX(-50%)", background: C.navy, color: "#fff", padding: "6px 10px", borderRadius: 6, fontSize: 11, width: 200, textAlign: "center", zIndex: 99, pointerEvents: "none", fontWeight: 400, lineHeight: 1.4 }}>{text}</span>}
    </span>
  );
};

// KPI card (white background)
const KpiCard = ({ label, value, sub, color, tip }) => (
  <div style={{ background: C.white, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "16px 20px", flex: 1, minWidth: 140, boxShadow: C.sh }}>
    <div style={{ fontSize: 11, color: C.tl, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: F }}>{label}{tip && <Tip text={tip} />}</div>
    <div style={{ fontSize: 28, fontWeight: 800, color: color || C.t, fontFamily: F, lineHeight: 1.1 }}>{value || "—"}</div>
    {sub && <div style={{ fontSize: 11, color: C.tl, marginTop: 3, fontFamily: F }}>{sub}</div>}
  </div>
);

// Metric inside a BlueCard
const BM = ({ l, v, pre = "", suf = "" }) => (
  <div style={{ flex: 1, minWidth: 100, textAlign: "center", padding: "12px 6px" }}>
    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4, fontFamily: F }}>{l}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", fontFamily: F, lineHeight: 1.1 }}>
      {(v === null || v === undefined || v === "") ? "—" : `${pre}${typeof v === "number" ? v.toLocaleString() : v}${suf}`}
    </div>
  </div>
);

// Blue summary card (dark navy gradient)
const BlueCard = ({ icon, label, highlight, children }) => (
  <div style={{ background: `linear-gradient(135deg, ${C.bc}, ${C.bl})`, borderRadius: 12, padding: "18px 22px", border: `1px solid ${C.bb}`, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: F }}>{label}</span>
    </div>
    {children}
    {highlight && (
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }}>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase", fontWeight: 700, fontFamily: F }}>Highlight: </span>
        <span style={{ color: "#fff", fontWeight: 600, fontFamily: F }}>{highlight}</span>
      </div>
    )}
  </div>
);

const SecWrap = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <h3 style={{ fontSize: 15, fontWeight: 700, color: C.t, margin: "0 0 10px", fontFamily: F }}>{title}</h3>
    {children}
  </div>
);

const Card = ({ children, style }) => (
  <div style={{ background: C.white, borderRadius: 10, padding: "16px 18px", border: `1px solid ${C.bd}`, boxShadow: C.sh, marginBottom: 16, ...style }}>
    {children}
  </div>
);

const WinsLosses = ({ wins, losses }) => {
  const w = lines(wins), l = lines(losses);
  if (!w.length && !l.length) return null;
  return (
    <SecWrap title="Wins & Watch Items">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {w.map((x, i) => <div key={i} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontFamily: F, color: "#166534" }}>✅ {x}</div>)}
        {l.map((x, i) => <div key={i} style={{ background: C.rL, border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontFamily: F, color: "#991b1b" }}>⚠️ {x}</div>)}
      </div>
    </SecWrap>
  );
};

const WorkDone = ({ text }) => {
  const items = lines(text);
  if (!items.length) return null;
  return (
    <SecWrap title="Work Completed">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={{ background: "#f8fafc", border: `1px solid ${C.bd}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, fontFamily: F, display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ color: C.cyanD, fontWeight: 700, flexShrink: 0 }}>✓</span>{it}
          </div>
        ))}
      </div>
    </SecWrap>
  );
};

const NextMonth = ({ text }) => {
  const items = lines(text);
  if (!items.length) return null;
  return (
    <SecWrap title="What's Coming Next Month">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, fontFamily: F, padding: "6px 0" }}>
            <span style={{ color: C.cyan, fontWeight: 700, flexShrink: 0 }}>→</span>{it}
          </div>
        ))}
      </div>
    </SecWrap>
  );
};

const NoData = ({ label }) => (
  <div style={{ padding: "40px 24px", textAlign: "center", color: C.tl, fontFamily: F, fontSize: 14 }}>
    <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
    No {label || "data"} entered for this period yet.
  </div>
);

/* ─── DASHBOARD ─── */
function Dashboard({ data, services, clientName, monthLabel }) {
  const leads = data.leads || {};
  const cr = data.callrail || {};
  const seo = data.seo || {};
  const gbp = data.gbp || {};
  const gads = data.google_ads || {};
  const meta = data.meta_ads || {};
  const social = data.social || {};
  const email = data.email || {};
  const creative = data.creative || {};

  const hasLeads = leads.total_leads != null;
  const hasCalls = cr.total_calls != null;

  // Compute social totals
  const totalReach = (Number(social.fb_reach) || 0) + (Number(social.ig_reach) || 0) + (Number(social.tiktok_reach) || 0);
  const totalEngagement = (Number(social.fb_engagement) || 0) + (Number(social.ig_engagement) || 0) + (Number(social.tiktok_likes) || 0);
  const newFollowers = (Number(social.fb_new_followers) || 0) + (Number(social.ig_new_followers) || 0) + (Number(social.tiktok_followers) || 0);

  return (
    <>
      {/* Lead Summary */}
      {(services.leads !== false) && (
        <>
          <div style={{ marginBottom: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.t, margin: 0, fontFamily: F }}>Lead Summary</h2>
            <p style={{ fontSize: 11, color: C.tl, margin: "2px 0 0", fontFamily: F }}>Total leads across all channels</p>
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
            <KpiCard label="Total Leads" value={fmt(leads.total_leads)} tip="All leads across every source this period." />
            <KpiCard label="Website Leads" value={fmt(leads.website_leads)} tip="Leads submitted directly from the dealership website." />
            <KpiCard label="Third Party" value={fmt(leads.third_party)} tip="Leads from third-party providers like Cars.com, AutoTrader, etc." />
            <KpiCard label="Facebook Leads" value={fmt(leads.facebook_leads)} tip="Leads generated from Facebook Lead Ad forms." />
          </div>
          {leads.total_sold != null && (
            <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
              <KpiCard label="Total Sold" value={fmt(leads.total_sold)} color={C.g} />
              <KpiCard label="Website Sold" value={fmt(leads.website_sold)} />
              <KpiCard label="Third Party Sold" value={fmt(leads.third_party_sold)} />
              <KpiCard label="Facebook Sold" value={fmt(leads.facebook_sold)} />
            </div>
          )}
        </>
      )}

      {/* CallRail */}
      {(services.callrail !== false) && (
        <>
          <div style={{ marginBottom: 10 }}><h2 style={{ fontSize: 16, fontWeight: 700, color: C.t, margin: 0, fontFamily: F }}>Phone Calls (CallRail)</h2></div>
          <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
            <KpiCard label="Total Calls" value={fmt(cr.total_calls)} tip="Total tracked calls this period." />
            <KpiCard label="From Website" value={fmt(cr.website_calls)} tip="Calls attributed to website visits." />
            <KpiCard label="From Ads" value={fmt(cr.ads_calls)} tip="Calls attributed to paid ad campaigns." />
            <KpiCard label="From Google Business" value={fmt(cr.gbp_calls)} tip="Calls from the GBP call button." />
          </div>
        </>
      )}

      {/* Department BlueCards */}
      <div style={{ marginBottom: 10 }}><h2 style={{ fontSize: 16, fontWeight: 700, color: C.t, margin: 0, fontFamily: F }}>Department Performance</h2></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
        {services.seo !== false && (
          <BlueCard icon="🔍" label="SEO" highlight={seo.top_query ? `Top Query: ${seo.top_query}` : null}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <BM l="Org. Sessions" v={seo.organic_sessions ? Number(seo.organic_sessions) : null} />
              <BM l="Impressions" v={seo.impressions ? Number(seo.impressions) : null} />
              <BM l="Page 1 KWs" v={seo.page1_keywords ? Number(seo.page1_keywords) : null} />
              <BM l="CTR" v={seo.ctr != null ? parseFloat(seo.ctr).toFixed(1) : null} suf="%" />
              <BM l="Avg Position" v={seo.avg_position != null ? parseFloat(seo.avg_position).toFixed(1) : null} />
              <BM l="VDP Views" v={seo.vdp_views ? Number(seo.vdp_views) : null} />
            </div>
          </BlueCard>
        )}
        {services.gbp !== false && (
          <BlueCard icon="📍" label="Google Business Profile" highlight={gbp.avg_rating ? `★ ${gbp.avg_rating} avg rating · ${gbp.new_reviews || 0} new reviews` : null}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <BM l="Profile Views" v={gbp.profile_views ? Number(gbp.profile_views) : null} />
              <BM l="Search Appearances" v={gbp.search_appearances ? Number(gbp.search_appearances) : null} />
              <BM l="Map Views" v={gbp.map_views ? Number(gbp.map_views) : null} />
              <BM l="Web Clicks" v={gbp.website_clicks ? Number(gbp.website_clicks) : null} />
              <BM l="Calls" v={gbp.phone_calls ? Number(gbp.phone_calls) : null} />
              <BM l="Directions" v={gbp.direction_requests ? Number(gbp.direction_requests) : null} />
            </div>
          </BlueCard>
        )}
        {services.google_ads !== false && (
          <BlueCard icon="📢" label="Google Ads" highlight={gads.top_campaign ? `Top: ${gads.top_campaign}` : null}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <BM l="Conversions" v={gads.conversions ? Number(gads.conversions) : null} />
              <BM l="Cost/Lead" v={gads.cost_per_lead != null ? parseFloat(gads.cost_per_lead).toFixed(2) : null} pre="$" />
              <BM l="Spend" v={gads.total_spend ? Number(gads.total_spend) : null} pre="$" />
              <BM l="CTR" v={gads.ctr != null ? parseFloat(gads.ctr).toFixed(1) : null} suf="%" />
              <BM l="CPC" v={gads.cpc != null ? parseFloat(gads.cpc).toFixed(2) : null} pre="$" />
              <BM l="Imp Share" v={gads.impression_share != null ? parseFloat(gads.impression_share).toFixed(0) : null} suf="%" />
            </div>
          </BlueCard>
        )}
        {services.meta_ads !== false && (
          <BlueCard icon="📱" label="Meta Ads" highlight={meta.top_ad ? `Top: ${meta.top_ad}` : null}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <BM l="Conversions" v={meta.conversions ? Number(meta.conversions) : null} />
              <BM l="Cost/Lead" v={meta.cost_per_lead != null ? parseFloat(meta.cost_per_lead).toFixed(2) : null} pre="$" />
              <BM l="Reach" v={meta.reach ? Number(meta.reach) : null} />
              <BM l="CPC" v={meta.cpc != null ? parseFloat(meta.cpc).toFixed(2) : null} pre="$" />
              <BM l="Frequency" v={meta.frequency != null ? parseFloat(meta.frequency).toFixed(1) : null} />
              <BM l="Eng Rate" v={meta.engagement_rate != null ? parseFloat(meta.engagement_rate).toFixed(1) : null} suf="%" />
            </div>
          </BlueCard>
        )}
        {services.social !== false && (
          <BlueCard icon="🎬" label="Organic Social" highlight={social.top_video ? `🎬 ${social.top_video}${social.top_video_views ? " — " + Number(social.top_video_views).toLocaleString() + " views" : ""}` : null}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <BM l="Total Reach" v={totalReach > 0 ? totalReach : null} />
              <BM l="Engagement" v={totalEngagement > 0 ? totalEngagement : null} />
              <BM l="New Followers" v={newFollowers > 0 ? newFollowers : null} pre="+" />
              <BM l="Posts" v={social.posts_published ? Number(social.posts_published) : null} />
              <BM l="Videos" v={social.videos_published ? Number(social.videos_published) : null} />
              <BM l="Web Clicks" v={social.web_clicks ? Number(social.web_clicks) : null} />
            </div>
          </BlueCard>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          {services.email !== false && (
            <BlueCard icon="✉️" label="Email">
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                <BM l="Campaigns" v={email.campaigns_sent ? Number(email.campaigns_sent) : null} />
                <BM l="Recipients" v={email.total_recipients ? Number(email.total_recipients) : null} />
                <BM l="Open Rate" v={email.avg_open_rate != null ? parseFloat(email.avg_open_rate).toFixed(1) : null} suf="%" />
                <BM l="Site Visits" v={email.site_visits ? Number(email.site_visits) : null} />
              </div>
            </BlueCard>
          )}
          {services.creative !== false && (
            <BlueCard icon="🎨" label="Creative">
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                <BM l="Delivered" v={creative.total_assets ? Number(creative.total_assets) : null} />
                <BM l="Videos" v={creative.videos ? Number(creative.videos) : null} />
                <BM l="Graphics" v={creative.graphics ? Number(creative.graphics) : null} />
                <BM l="Banners" v={creative.banners ? Number(creative.banners) : null} />
              </div>
            </BlueCard>
          )}
        </div>
      </div>

      {/* Key Highlights + Next Month */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {leads.notes && (
          <Card style={{ flex: 1, minWidth: 260 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.t, margin: "0 0 10px", fontFamily: F }}>Notes</h3>
            <div style={{ fontSize: 13, color: C.t, fontFamily: F, lineHeight: 1.6 }}>{leads.notes}</div>
          </Card>
        )}
      </div>
    </>
  );
}

/* ─── SEO PAGE ─── */
function SeoPage({ d }) {
  if (!d) return <NoData label="SEO data" />;
  const trendData = d._trend || [];

  return (
    <div>
      <SecWrap title="Key Metrics">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Organic Sessions" value={fmt(d.organic_sessions)} color={C.cyan} tip="Website visits from organic (unpaid) Google search."
            sub={d.total_sessions > 0
              ? `${Math.round((Number(d.organic_sessions) / Number(d.total_sessions)) * 1000) / 10}% of ${Number(d.total_sessions).toLocaleString()} total sessions`
              : null} />
          <KpiCard label="Impressions" value={fmt(d.impressions)} tip="Times your site appeared in Google Search results." />
          <KpiCard label="CTR" value={d.ctr != null ? parseFloat(d.ctr).toFixed(1) + "%" : "—"} tip="Click-through rate from Google Search. Higher = stronger title tags and meta descriptions." sub="Industry avg 2–4%" />
          <KpiCard label="Avg Position" value={d.avg_position != null ? parseFloat(d.avg_position).toFixed(1) : "—"} tip="Average ranking position across all tracked keywords." />
          <KpiCard label="Page 1 Keywords" value={fmt(d.page1_keywords)} tip="Number of target keywords ranking on Google page 1." color={C.cyan} />
          <KpiCard label="VDP Views" value={fmt(d.vdp_views)} tip="Vehicle Detail Page views — high-intent shoppers looking at specific inventory." />
        </div>
      </SecWrap>

      <SecWrap title="Conversions & Engagement">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Phone Calls (SEO)" value={fmt(d.phone_calls)} color={C.g} tip="Tracked calls attributed to organic search." />
          <KpiCard label="Form Submissions" value={fmt(d.form_submissions)} tip="Contact, trade-in, and finance forms via GA4." />
          <KpiCard label="Direction Requests" value={fmt(d.direction_requests)} tip="Users who requested directions from search." />
          <KpiCard label="Chat Conversations" value={fmt(d.chat_conversations)} tip="Chat sessions initiated on the website." />
          {d.bounce_rate != null && <KpiCard label="Bounce Rate" value={parseFloat(d.bounce_rate).toFixed(1) + "%"} tip="% of sessions that left without engaging. Lower is better." sub="Industry avg 40–55%" />}
          {d.avg_session_duration != null && <KpiCard label="Avg Session Duration" value={fmtDur(d.avg_session_duration)} tip="Average time visitors spend on the site." sub="2+ min is healthy" />}
        </div>
      </SecWrap>

      {trendData.length > 0 && (
        <SecWrap title="Organic Traffic Trend">
          <div style={{ background: C.white, border: `1px solid ${C.bd}`, borderRadius: 10, padding: 20, boxShadow: C.sh }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.bl2} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.tl }} />
                <YAxis tick={{ fontSize: 11, fill: C.tl }} />
                <Tooltip contentStyle={ts} />
                <Line type="monotone" dataKey="sessions" stroke={C.cyan} strokeWidth={2.5} dot={{ r: 3, fill: C.cyan, stroke: C.white, strokeWidth: 2 }} name="Sessions" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SecWrap>
      )}

      {d.top_query && (
        <SecWrap title="Top Performing Query">
          <div style={{ background: C.cyanL, border: `1px solid #a5f3fc`, borderRadius: 10, padding: "14px 20px", fontFamily: F, fontSize: 14, fontWeight: 700, color: C.navy }}>
            🔍 {d.top_query}
          </div>
        </SecWrap>
      )}

      <WorkDone text={d.work_completed} />
      <WinsLosses wins={d.wins} losses={d.losses} />
      <NextMonth text={d.next_month} />
    </div>
  );
}

/* ─── GBP PAGE ─── */
function GbpPage({ d }) {
  if (!d) return <NoData label="Google Business data" />;
  return (
    <div>
      <SecWrap title="Key Metrics">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Profile Views" value={fmt(d.profile_views)} tip="Total times your GBP profile was seen." />
          <KpiCard label="Search Appearances" value={fmt(d.search_appearances)} tip="Times your business appeared in Google Search." />
          <KpiCard label="Map Views" value={fmt(d.map_views)} tip="Times your location appeared in Google Maps." />
          <KpiCard label="Website Clicks" value={fmt(d.website_clicks)} tip="Clicks from GBP to your website." color={C.cyan} />
          <KpiCard label="Phone Calls" value={fmt(d.phone_calls)} tip="Calls made directly from the GBP listing." color={C.g} />
          <KpiCard label="Direction Requests" value={fmt(d.direction_requests)} tip="Users who requested directions to your dealership." />
        </div>
      </SecWrap>

      {(d.avg_rating != null || d.review_count != null) && (
        <SecWrap title="Reviews">
          <Card>
            <div style={{ display: "flex", gap: 32, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: C.t, fontFamily: F }}>{d.avg_rating ? parseFloat(d.avg_rating).toFixed(1) : "—"}</div>
                <div style={{ color: C.o, fontSize: 20 }}>{"★".repeat(Math.round(d.avg_rating || 0))}</div>
                <div style={{ fontSize: 12, color: C.tl, fontFamily: F }}>{d.review_count ? `${d.review_count} reviews` : ""}</div>
              </div>
              <div style={{ display: "flex", gap: 12, flex: 1, flexWrap: "wrap" }}>
                {d.new_reviews != null && <KpiCard label="New Reviews" value={`+${d.new_reviews}`} color={C.g} />}
                {d.photo_count != null && <KpiCard label="Photos" value={fmt(d.photo_count)} />}
                {d.posts_published != null && <KpiCard label="Posts Published" value={fmt(d.posts_published)} />}
              </div>
            </div>
          </Card>
        </SecWrap>
      )}

      <WorkDone text={d.work_completed} />
      <WinsLosses wins={d.wins} losses={d.losses} />
      <NextMonth text={d.next_month} />
    </div>
  );
}

/* ─── GOOGLE ADS PAGE ─── */
function GoogleAdsPage({ d }) {
  if (!d) return <NoData label="Google Ads data" />;
  return (
    <div>
      <SecWrap title="Key Metrics">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Conversions" value={fmt(d.conversions)} color={C.cyan} tip="Total tracked conversions from Google Ads." />
          <KpiCard label="Cost / Lead" value={d.cost_per_lead != null ? "$" + parseFloat(d.cost_per_lead).toFixed(2) : "—"} color={C.g} tip="Average cost per conversion. Industry avg: $25–$45." sub="Industry avg $25–$45" />
          <KpiCard label="Total Spend" value={d.total_spend != null ? "$" + Number(d.total_spend).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"} tip="Total ad spend this period." sub={d.budget ? `Budget: $${Number(d.budget).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : null} />
          <KpiCard label="CTR" value={d.ctr != null ? parseFloat(d.ctr).toFixed(1) + "%" : "—"} tip="Click-through rate. Industry avg: 8.29%." sub="Industry avg ~8.29%" />
          <KpiCard label="Avg CPC" value={d.cpc != null ? "$" + parseFloat(d.cpc).toFixed(2) : "—"} tip="Average cost per click. Industry avg: $2.41." sub="Industry avg ~$2.41" />
          <KpiCard label="Impression Share" value={d.impression_share != null ? parseFloat(d.impression_share).toFixed(0) + "%" : "—"} tip="% of eligible searches you appeared for." />
        </div>
      </SecWrap>

      <SecWrap title="Secondary Metrics">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {d.impressions != null && <KpiCard label="Impressions" value={fmt(d.impressions)} />}
          {d.clicks != null && <KpiCard label="Total Clicks" value={fmt(d.clicks)} />}
          {d.quality_score != null && <KpiCard label="Avg Quality Score" value={parseFloat(d.quality_score).toFixed(1) + " / 10"} tip="Quality score avg across active campaigns. 6+ is standard." sub="Scale: 1–10" />}
        </div>
      </SecWrap>

      {d.top_campaign && (
        <SecWrap title="Top Performing Campaign">
          <div style={{ background: C.cyanL, border: `1px solid #a5f3fc`, borderRadius: 10, padding: "14px 20px", fontFamily: F, fontSize: 14, fontWeight: 700, color: C.navy }}>
            📢 {d.top_campaign}
          </div>
        </SecWrap>
      )}

      <WorkDone text={d.work_completed} />
      <WinsLosses wins={d.wins} losses={d.losses} />
      <NextMonth text={d.next_month} />
    </div>
  );
}

/* ─── META ADS PAGE ─── */
function MetaAdsPage({ d }) {
  if (!d) return <NoData label="Meta Ads data" />;
  return (
    <div>
      <SecWrap title="Key Metrics">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Conversions" value={fmt(d.conversions)} color={C.cyan} tip="Total tracked conversions from Meta ads." />
          <KpiCard label="Cost / Lead" value={d.cost_per_lead != null ? "$" + parseFloat(d.cost_per_lead).toFixed(2) : "—"} color={C.g} tip="Average cost per lead. Industry avg: $25–$40." sub="Industry avg $25–$40" />
          <KpiCard label="Total Spend" value={d.total_spend != null ? "$" + Number(d.total_spend).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"} />
          <KpiCard label="Reach" value={fmt(d.reach)} tip="Unique people who saw your ads." />
          <KpiCard label="Avg CPC" value={d.cpc != null ? "$" + parseFloat(d.cpc).toFixed(2) : "—"} tip="Cost per click. Industry avg: ~$0.79." sub="Industry avg ~$0.79" />
          <KpiCard label="Frequency" value={d.frequency != null ? parseFloat(d.frequency).toFixed(1) : "—"} tip="Average times each person saw your ad. Over 3.0 = ad fatigue risk." />
        </div>
      </SecWrap>

      <SecWrap title="Secondary Metrics">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {d.impressions != null && <KpiCard label="Impressions" value={fmt(d.impressions)} />}
          {d.ctr != null && <KpiCard label="CTR" value={parseFloat(d.ctr).toFixed(1) + "%"} tip="Click-through rate across Meta placements." />}
          {d.engagement_rate != null && <KpiCard label="Engagement Rate" value={parseFloat(d.engagement_rate).toFixed(1) + "%"} tip="Likes, comments, and shares as a % of reach." />}
          {d.video_view_rate != null && <KpiCard label="Video View Rate" value={parseFloat(d.video_view_rate).toFixed(1) + "%"} tip="% of video ads watched to completion." />}
          {d.lead_form_completion != null && <KpiCard label="Lead Form Completion" value={parseFloat(d.lead_form_completion).toFixed(0) + "%"} tip="Of people who opened a Lead Ad form, how many submitted it." color={C.g} />}
        </div>
      </SecWrap>

      {d.top_ad && (
        <SecWrap title="Top Performing Ad">
          <div style={{ background: C.cyanL, border: `1px solid #a5f3fc`, borderRadius: 10, padding: "14px 20px", fontFamily: F, fontSize: 14, fontWeight: 700, color: C.navy }}>
            📱 {d.top_ad}
          </div>
        </SecWrap>
      )}

      <WorkDone text={d.work_completed} />
      <WinsLosses wins={d.wins} losses={d.losses} />
      <NextMonth text={d.next_month} />
    </div>
  );
}

/* ─── SOCIAL PAGE ─── */
function SocialPage({ d }) {
  if (!d) return <NoData label="Organic Social data" />;

  // Calculate totals from per-platform data
  const totalReach = (Number(d.fb_reach) || 0) + (Number(d.ig_reach) || 0) + (Number(d.tiktok_reach) || 0);
  const totalEngagement = (Number(d.fb_engagement) || 0) + (Number(d.ig_engagement) || 0) + (Number(d.tiktok_likes) || 0);
  const newFollowers = (Number(d.fb_new_followers) || 0) + (Number(d.ig_new_followers) || 0) + (Number(d.tiktok_followers) || 0);

  const platforms = [
    { name: "YouTube",   followers: d.yt_followers,  growth: d.yt_followers, views: d.yt_month_views,   color: "#ff0000",  posts: d.yt_month_videos },
    { name: "Facebook",  followers: d.fb_followers,  growth: d.fb_new_followers, views: d.fb_reach,    color: "#1877f2",  posts: null },
    { name: "Instagram", followers: d.ig_followers,  growth: d.ig_new_followers, views: d.ig_reach,    color: "#e1306c",  posts: null },
    { name: "TikTok",    followers: d.tiktok_followers, growth: d.tiktok_followers, views: d.tiktok_views, color: "#333",  posts: null },
  ].filter(p => p.followers != null || p.views != null);

  return (
    <div>
      <SecWrap title="Monthly Overview">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Total Reach" value={totalReach > 0 ? fmt(totalReach) : "—"} tip="Combined reach across FB, IG, and TikTok." />
          <KpiCard label="Total Engagement" value={totalEngagement > 0 ? fmt(totalEngagement) : "—"} tip="Likes, comments, shares, and saves." color={C.cyan} />
          <KpiCard label="New Followers" value={newFollowers > 0 ? "+" + fmt(newFollowers) : "—"} tip="Net new followers across all platforms." color={C.g} />
          <KpiCard label="Posts Published" value={fmt(d.posts_published)} tip="Total posts across all platforms this month." />
          <KpiCard label="Videos Published" value={fmt(d.videos_published)} tip="Video posts including Reels, TikTok, and YouTube." />
          {d.web_clicks != null && <KpiCard label="Social → Web Clicks" value={fmt(d.web_clicks)} tip="Clicks from social media to your website (from GA4)." />}
        </div>
      </SecWrap>

      {/* Platform breakdown cards */}
      {platforms.length > 0 && (
        <SecWrap title="Platform Breakdown">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {platforms.map((p, i) => (
              <div key={i} style={{ flex: 1, minWidth: 160, background: C.white, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "16px 18px", boxShadow: C.sh }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.t, fontFamily: F }}>{p.name}</span>
                </div>
                {p.followers != null && <div style={{ marginBottom: 6 }}><div style={{ fontSize: 10, color: C.tl, fontWeight: 600, textTransform: "uppercase", fontFamily: F }}>Followers</div><div style={{ fontSize: 20, fontWeight: 700, color: C.t, fontFamily: F }}>{Number(p.followers).toLocaleString()}</div></div>}
                {p.growth != null && p.name !== "YouTube" && p.name !== "TikTok" && <div style={{ fontSize: 12, color: C.g, fontWeight: 600, fontFamily: F }}>+{Number(p.growth).toLocaleString()} new</div>}
                {p.views != null && <div style={{ fontSize: 12, color: C.tl, fontFamily: F, marginTop: 4 }}>{p.name === "YouTube" ? "Views" : "Reach"}: {Number(p.views).toLocaleString()}</div>}
                {p.posts != null && <div style={{ fontSize: 12, color: C.tl, fontFamily: F }}>Videos: {p.posts}</div>}
              </div>
            ))}
          </div>
        </SecWrap>
      )}

      {/* YouTube specific */}
      {(d.yt_total_views != null || d.yt_month_likes != null) && (
        <SecWrap title="YouTube Highlights">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {d.yt_total_views != null && <KpiCard label="Total Channel Views" value={fmt(d.yt_total_views)} />}
            {d.yt_month_likes != null && <KpiCard label="Monthly Likes" value={fmt(d.yt_month_likes)} />}
            {d.yt_month_comments != null && <KpiCard label="Monthly Comments" value={fmt(d.yt_month_comments)} />}
          </div>
        </SecWrap>
      )}

      {d.top_video && (
        <SecWrap title="Top Performing Video">
          <div style={{ background: C.cyanL, border: `1px solid #a5f3fc`, borderRadius: 10, padding: "14px 20px", fontFamily: F, fontSize: 14, fontWeight: 700, color: C.navy }}>
            🎬 {d.top_video}{d.top_video_views ? ` — ${Number(d.top_video_views).toLocaleString()} views` : ""}
          </div>
        </SecWrap>
      )}

      {/* Instagram additional metrics */}
      {(d.ig_impressions != null || d.ig_profile_views != null) && (
        <SecWrap title="Instagram Details">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {d.ig_impressions != null && <KpiCard label="IG Impressions" value={fmt(d.ig_impressions)} />}
            {d.ig_profile_views != null && <KpiCard label="IG Profile Views" value={fmt(d.ig_profile_views)} />}
          </div>
        </SecWrap>
      )}

      {/* TikTok specific */}
      {(d.tiktok_views != null || d.tiktok_likes != null) && (
        <SecWrap title="TikTok Highlights">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {d.tiktok_views != null && <KpiCard label="TikTok Views" value={fmt(d.tiktok_views)} />}
            {d.tiktok_likes != null && <KpiCard label="TikTok Likes" value={fmt(d.tiktok_likes)} />}
            {d.tiktok_reach != null && <KpiCard label="TikTok Reach" value={fmt(d.tiktok_reach)} />}
          </div>
        </SecWrap>
      )}

      <WorkDone text={d.work_completed} />
      <WinsLosses wins={d.wins} losses={d.losses} />
      <NextMonth text={d.next_month} />
    </div>
  );
}

/* ─── EMAIL PAGE ─── */
function EmailPage({ d }) {
  if (!d) return <NoData label="Email data" />;
  return (
    <div>
      <SecWrap title="Monthly Summary">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Campaigns Sent" value={fmt(d.campaigns_sent)} tip="Total email campaigns deployed this month." />
          <KpiCard label="Total Recipients" value={fmt(d.total_recipients)} tip="Total emails delivered across all campaigns." />
          {d.avg_open_rate != null && <KpiCard label="Avg Open Rate" value={parseFloat(d.avg_open_rate).toFixed(1) + "%"} tip="Average open rate across all campaigns. Industry avg: 20–25%." sub="Industry avg 20–25%" color={C.cyan} />}
          {d.avg_click_rate != null && <KpiCard label="Avg Click Rate" value={parseFloat(d.avg_click_rate).toFixed(1) + "%"} tip="Average click rate across all campaigns. Industry avg: 2–4%." sub="Industry avg 2–4%" color={C.g} />}
          <KpiCard label="Site Visits from Email" value={fmt(d.site_visits)} tip="GA4-tracked sessions from email campaigns via UTM links." color={C.cyan} />
          {d.conversions != null && <KpiCard label="Conversions from Email" value={fmt(d.conversions)} color={C.g} />}
        </div>
      </SecWrap>

      {(d.unsubscribe_rate != null || d.list_size != null) && (
        <SecWrap title="List Health">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {d.list_size != null && <KpiCard label="List Size" value={fmt(d.list_size)} tip="Total active email subscribers." />}
            {d.unsubscribe_rate != null && <KpiCard label="Unsubscribe Rate" value={parseFloat(d.unsubscribe_rate).toFixed(2) + "%"} tip="Avg unsubscribe rate. Under 0.5% is healthy." sub="Healthy: under 0.5%" />}
          </div>
        </SecWrap>
      )}

      <WorkDone text={d.work_completed} />
      <WinsLosses wins={d.wins} losses={d.losses} />
      <NextMonth text={d.next_month} />
    </div>
  );
}

/* ─── CREATIVE PAGE ─── */
function CreativePage({ d }) {
  if (!d) return <NoData label="Creative data" />;
  return (
    <div>
      <SecWrap title="Monthly Summary">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Total Assets Delivered" value={fmt(d.total_assets)} />
          {d.videos != null && <KpiCard label="Videos" value={fmt(d.videos)} color={C.cyan} />}
          {d.graphics != null && <KpiCard label="Graphics / Statics" value={fmt(d.graphics)} />}
          {d.banners != null && <KpiCard label="Banners" value={fmt(d.banners)} />}
          {d.print != null && <KpiCard label="Print Pieces" value={fmt(d.print)} />}
          {d.ad_creative != null && <KpiCard label="Ad Creative Sets" value={fmt(d.ad_creative)} tip="Display, search, and social ad graphics." />}
          {d.email_headers != null && <KpiCard label="Email Headers / Templates" value={fmt(d.email_headers)} />}
        </div>
      </SecWrap>

      <WorkDone text={d.work_completed} />
      <NextMonth text={d.next_month} />
    </div>
  );
}

/* ─── DISABLED DEPT PLACEHOLDER ─── */
const DisabledDept = ({ label }) => (
  <div style={{ padding: "60px 24px", textAlign: "center", color: C.tl, fontFamily: F }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>🚫</div>
    <div style={{ fontSize: 15, fontWeight: 600, color: C.t }}>{label}</div>
    <div style={{ fontSize: 13, marginTop: 6 }}>This service isn't active for this client.</div>
  </div>
);

/* ─── LOGIN PAGE ─── */
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F }}>
      <div style={{ background: C.white, borderRadius: 16, padding: "48px 40px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", textAlign: "center" }}>
        <img src="/Taggart_Advertising_Logo.png" alt="Taggart Advertising" style={{ height: 56, width: "auto", marginBottom: 24 }} />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.navy, margin: "0 0 6px", fontFamily: F }}>Client Portal</h1>
        <p style={{ fontSize: 13, color: C.tl, margin: "0 0 28px", fontFamily: F }}>Sign in to view your report.</p>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: `1px solid ${C.bd}`, fontSize: 14, fontFamily: F, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: `1px solid ${C.bd}`, fontSize: 14, fontFamily: F, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
        {error && <p style={{ fontSize: 12, color: C.r, margin: "0 0 10px", fontFamily: F }}>{error}</p>}
        <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "12px", background: C.navy, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </div>
    </div>
  );
}

/* ─── ROOT APP ─── */
export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [clientMenuOpen, setClientMenuOpen] = useState(false);
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);

  // Month/year selection
  const now = new Date();
  const defaultYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const defaultMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // 1-based
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  // Report data per department
  const [reportData, setReportData] = useState({});
  const [services, setServices] = useState({});
  const [dataLoading, setDataLoading] = useState(false);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => { setSession(session); setAuthLoading(false); });
    return () => subscription.unsubscribe();
  }, []);

  // Load clients
  useEffect(() => {
    if (!session) return;
    const fetchClients = async () => {
      setClientsLoading(true);
      const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", session.user.id).single();
      const isAdmin = ["admin", "editor"].includes(profile?.role?.toLowerCase());
      let data, error;
      if (isAdmin) {
        ({ data, error } = await supabase.from("clients").select("id,name,group_name").eq("active", true));
      } else {
        const { data: access } = await supabase.from("user_client_access").select("client_id").eq("user_id", session.user.id);
        const ids = access?.map(r => r.client_id) || [];
        ({ data, error } = await supabase.from("clients").select("id,name,group_name").eq("active", true).in("id", ids));
      }
      if (!error && data) {
        const sorted = data.sort((a, b) => {
          const ai = CLIENT_ORDER.indexOf(a.name), bi = CLIENT_ORDER.indexOf(b.name);
          if (ai !== -1 && bi !== -1) return ai - bi;
          if (ai !== -1) return -1; if (bi !== -1) return 1;
          return a.name.localeCompare(b.name);
        });
        setClients(sorted);
        if (sorted.length > 0) setSelectedClient(sorted[0]);
      }
      setClientsLoading(false);
    };
    fetchClients();
  }, [session]);

  // Load report data + services when client or month changes
  useEffect(() => {
    if (!selectedClient) return;
    const load = async () => {
      setDataLoading(true);

      const month = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;

      // Load all dept data for this client/month
      const { data: rows } = await supabase
        .from("report_data")
        .select("department, data")
        .eq("client_id", selectedClient.id)
        .eq("month", month);

      const mapped = {};
      (rows || []).forEach(r => { mapped[r.department] = r.data || {}; });
      setReportData(mapped);

      // Load client_services
      const { data: svcRows } = await supabase
        .from("client_services")
        .select("department, enabled")
        .eq("client_id", selectedClient.id);

      const svcMap = {};
      (svcRows || []).forEach(r => { svcMap[r.department] = r.enabled; });
      setServices(svcMap);

      setDataLoading(false);
    };
    load();
  }, [selectedClient, selectedYear, selectedMonth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null); setClients([]); setSelectedClient(null);
  };

  const monthLabel = `${MONTHS[selectedMonth - 1]} ${selectedYear}`;

  // Build available months (last 24)
  const monthOptions = [];
  for (let i = 0; i < 24; i++) {
    let m = now.getMonth() - i; // 0-based
    let y = now.getFullYear();
    while (m < 0) { m += 12; y--; }
    monthOptions.push({ label: `${MONTHS[m]} ${y}`, year: y, month: m + 1 });
  }

  // Groups
  const groups = [...new Set(clients.map(c => c.group_name))];

  // Service check helper
  const svcEnabled = (dept) => services[dept] !== false;

  // Render dept page
  const renderPage = () => {
    if (dataLoading) return (
      <div style={{ padding: "60px 24px", textAlign: "center", color: C.tl, fontFamily: F }}>
        <div style={{ fontSize: 13 }}>Loading report data…</div>
      </div>
    );

    switch (activeTab) {
      case "dashboard":
        return <Dashboard data={reportData} services={services} clientName={selectedClient?.name} monthLabel={monthLabel} />;
      case "seo":
        return svcEnabled("seo") ? <SeoPage d={reportData.seo} /> : <DisabledDept label="SEO" />;
      case "gbp":
        return svcEnabled("gbp") ? <GbpPage d={reportData.gbp} /> : <DisabledDept label="Google Business Profile" />;
      case "google_ads":
        return svcEnabled("google_ads") ? <GoogleAdsPage d={reportData.google_ads} /> : <DisabledDept label="Google Ads" />;
      case "meta_ads":
        return svcEnabled("meta_ads") ? <MetaAdsPage d={reportData.meta_ads} /> : <DisabledDept label="Meta Ads" />;
      case "social":
        return svcEnabled("social") ? <SocialPage d={reportData.social} /> : <DisabledDept label="Organic Social" />;
      case "email":
        return svcEnabled("email") ? <EmailPage d={reportData.email} /> : <DisabledDept label="Email" />;
      case "creative":
        return svcEnabled("creative") ? <CreativePage d={reportData.creative} /> : <DisabledDept label="Creative" />;
      default:
        return <Dashboard data={reportData} services={services} clientName={selectedClient?.name} monthLabel={monthLabel} />;
    }
  };

  /* ── Loading / No session / No access states ── */
  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#fff", fontFamily: F, fontSize: 16 }}>Loading…</div>
    </div>
  );
  if (!session) return <LoginPage />;
  if (clientsLoading) return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#fff", fontFamily: F, fontSize: 16 }}>Loading clients…</div>
    </div>
  );
  if (clients.length === 0) return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.white, borderRadius: 16, padding: "48px 40px", maxWidth: 400, textAlign: "center", fontFamily: F }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2 style={{ color: C.navy, fontFamily: F }}>No Access</h2>
        <p style={{ color: C.tl, fontFamily: F }}>Your account doesn't have access to any clients. Contact Taggart Advertising.</p>
        <button onClick={handleLogout} style={{ marginTop: 16, padding: "10px 24px", background: C.navy, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: F }}>Sign Out</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: F, background: C.bg }}>

      {/* ── HEADER ── */}
      <div style={{ background: C.white, padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.bd}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/Taggart_Advertising_Logo.png" alt="Taggart" style={{ height: 44, width: "auto" }} />
          <span style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 22, color: C.navy }}>TAGGART</span>
          <span style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 22, color: C.cyan }}>ADVERTISING</span>

          {clients.length > 1 && (
            <>
              <div style={{ width: 1, height: 30, background: C.bd, margin: "0 8px" }} />
              <div style={{ position: "relative" }}>
                <button onClick={() => { setClientMenuOpen(!clientMenuOpen); setMonthMenuOpen(false); }} style={{ background: "#f0f2f5", border: `1px solid ${C.bd}`, borderRadius: 8, padding: "8px 16px", color: C.t, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: F }}>
                  {selectedClient?.name} <span style={{ fontSize: 10, color: C.tl }}>▼</span>
                </button>
                {clientMenuOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, background: C.white, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "6px 0", zIndex: 200, width: 260, maxHeight: 400, overflowY: "auto", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}>
                    {groups.map(g => (
                      <div key={g}>
                        <div style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.08em" }}>{g}</div>
                        {clients.filter(c => c.group_name === g).map(c => (
                          <button key={c.id} onClick={() => { setSelectedClient(c); setClientMenuOpen(false); setActiveTab("dashboard"); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", border: "none", cursor: "pointer", background: c.id === selectedClient?.id ? C.cyanL : "transparent", color: c.id === selectedClient?.id ? C.cyanD : C.t, fontSize: 13, fontWeight: 600, fontFamily: F }}>
                            {c.name}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: C.tl }}>{session?.user?.email}</span>

          {/* Month picker */}
          <div style={{ position: "relative" }}>
            <button onClick={() => { setMonthMenuOpen(!monthMenuOpen); setClientMenuOpen(false); }} style={{ background: "#f0f2f5", border: `1px solid ${C.bd}`, borderRadius: 8, padding: "8px 16px", color: C.t, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: F }}>
              📅 {monthLabel} <span style={{ fontSize: 10, color: C.tl }}>▼</span>
            </button>
            {monthMenuOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 5px)", right: 0, background: C.white, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "6px 0", zIndex: 200, width: 200, maxHeight: 300, overflowY: "auto", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}>
                {monthOptions.map((mo, i) => (
                  <button key={i} onClick={() => { setSelectedYear(mo.year); setSelectedMonth(mo.month); setMonthMenuOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", border: "none", cursor: "pointer", background: (mo.year === selectedYear && mo.month === selectedMonth) ? C.cyanL : "transparent", color: (mo.year === selectedYear && mo.month === selectedMonth) ? C.cyanD : C.t, fontSize: 13, fontWeight: 600, fontFamily: F }}>
                    {mo.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleLogout} style={{ background: "#f0f2f5", border: `1px solid ${C.bd}`, borderRadius: 8, padding: "8px 14px", color: C.t, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F }}>Sign Out</button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.bd}`, padding: "0 24px", display: "flex", overflowX: "auto", flexShrink: 0 }}>
        {DEPT_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "11px 16px", border: "none", cursor: "pointer", background: "transparent", fontSize: 13, fontWeight: 600, color: activeTab === t.id ? C.cyanD : C.tl, borderBottom: activeTab === t.id ? `2px solid ${C.cyan}` : "2px solid transparent", whiteSpace: "nowrap", fontFamily: F }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, padding: "22px 24px", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" }} onClick={() => { setClientMenuOpen(false); setMonthMenuOpen(false); }}>
        <div style={{ marginBottom: 18 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.t, margin: 0, fontFamily: F }}>{selectedClient?.name}</h1>
          <p style={{ fontSize: 13, color: C.tl, margin: "3px 0 0", fontFamily: F }}>Performance Report — {monthLabel}</p>
        </div>
        {renderPage()}
      </div>

      {/* ── FOOTER ── */}
      <div style={{ padding: "18px 24px", textAlign: "center", background: C.white, borderTop: `1px solid ${C.bd}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <img src="/Taggart_Advertising_Logo.png" alt="Taggart" style={{ height: 28, width: "auto" }} />
          <span style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 15, color: C.navy }}>TAGGART</span>
          <span style={{ fontFamily: "'Permanent Marker',cursive", fontSize: 15, color: C.cyan }}>ADVERTISING</span>
        </div>
        <p style={{ fontSize: 11, color: C.tl, margin: "6px 0 0", fontFamily: F }}>Confidential client report — {monthLabel}</p>
      </div>
    </div>
  );
}
