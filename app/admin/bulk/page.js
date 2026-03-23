'use client';
import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import { supabase } from "../supabase";

/* ─── CONSTANTS ─── */
const C = {
  white: "#fff",  navy: "#0c1a2e", cyan: "#00c9e8", cyanD: "#00a5bf", cyanL: "#e6f9fc",
  bc: "#1b3254",  bl: "#243e63",   bb: "#2d5080",
  t: "#1a1a2e",   tm: "#4a5568",   tl: "#6b7280",
  bd: "#d0d5dd",  bl2: "#e4e7ec",
  g: "#10b981",   gL: "#ecfdf5",   gB: "#d1fae5",
  r: "#ef4444",   rL: "#fef2f2",   rB: "#fecaca",
  o: "#f59e0b",   oL: "#fffbeb",   p: "#8b5cf6",
  sh: "0 2px 6px rgba(0,0,0,0.08)", bg: "#ebedf1",
};
const F  = "'DM Sans', system-ui, sans-serif";
const FS = "'Instrument Serif', Georgia, serif";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const CLIENT_ORDER = [
  "Goode Motor Group","Goode Motor Ford","Goode Motor Mazda","Twin Falls Volkswagen",
  "Juneau Auto Mall","Juneau Subaru","Juneau CDJR","Juneau Toyota",
  "Juneau Chevrolet","Juneau Honda","Juneau Powersports",
  "Cassia Car Rental","Explore Juneau",
];

// Lead-type detection — mirrors admin/page.js
const GOODE_MOTOR_GROUP = "Goode Motor Group";
const JUNEAU_OEM_LABEL = {
  "Juneau Auto Mall": "OEM", "Juneau Subaru": "Subaru",
  "Juneau CDJR": "CDJR", "Juneau Toyota": "Toyota",
  "Juneau Chevrolet": "Chevrolet", "Juneau Honda": "Honda",
};
const closePct = (sold, leads) => {
  const s = Number(sold), l = Number(leads);
  if (!s || !l || l === 0) return null;
  return Math.round((s / l) * 1000) / 10;
};

// Multi-listing GBP clients
const GBP_MULTI_LISTINGS = {
  "Goode Motor Ford": [
    { key: "ford",     label: "Goode Motor Ford",    color: "#1d4ed8" },
    { key: "overland", label: "Goode Motor Overland", color: "#059669" },
  ],
};
const GBP_LISTING_NUMERIC_FIELDS = [
  "profile_views","search_appearances","map_views",
  "website_clicks","phone_calls","direction_requests",
  "review_count","new_reviews","posts_published",
];
const DEPT_TABS = [
  { id: "dashboard",  label: "Dashboard" },
  { id: "seo",        label: "🔍 SEO" },
  { id: "gbp",        label: "📍 Google Business" },
  { id: "google_ads", label: "📢 Google Ads" },
  { id: "meta_ads",   label: "📱 Meta Ads" },
  { id: "social",     label: "🎬 Organic Social" },
  { id: "email",      label: "✉️ Email" },
  { id: "creative",   label: "🎨 Creative" },
];
const ttS = {
  background: C.white, border: `1px solid ${C.bd}`,
  borderRadius: 8, fontSize: 12, color: C.t, fontFamily: F,
};

/* ─── UTILITIES ─── */
const fmt = (v, type = "number") => {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (isNaN(n)) return v;
  if (type === "currency") return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (type === "pct")      return n.toFixed(1) + "%";
  if (type === "decimal")  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return n.toLocaleString();
};
const fmtDur = (s) => {
  if (!s) return "—";
  const n = Number(s);
  if (isNaN(n)) return s;
  return `${Math.floor(n / 60)}:${String(Math.round(n % 60)).padStart(2, "0")}`;
};
const lines = (str) => str ? str.split("\n").map(l => l.trim()).filter(Boolean) : [];

/** Returns % change (1 decimal) between curr and prev, or undefined if not computable. */
const pct = (curr, prev) => {
  const c = Number(curr), p = Number(prev);
  if (!curr || !prev || isNaN(c) || isNaN(p) || p === 0) return undefined;
  return Math.round(((c - p) / p) * 1000) / 10;
};

/* ─── DATE RANGE UTILITIES ─── */

function getLastComplete() {
  const now = new Date();
  const m0  = now.getMonth(); // 0-indexed
  if (m0 === 0) return { month: 12, year: now.getFullYear() - 1 };
  return { month: m0, year: now.getFullYear() }; // m0 is 1-based last month
}

function buildRange(sy, sm, ey, em) {
  const out = [];
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    out.push({ year: y, month: m });
    if (++m > 12) { m = 1; y++; }
  }
  return out;
}

function getQuarter(m) { return Math.ceil(m / 3); }
function qStart(q)     { return (q - 1) * 3 + 1; }
function qEnd(q)       { return q * 3; }

function getMonthRange(preset, customStart, customEnd) {
  const { month: lcm, year: lcy } = getLastComplete();
  const now  = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1; // 1-based current calendar month

  switch (preset) {
    case "last_month":
      return [{ year: lcy, month: lcm }];

    case "current_quarter": {
      const q  = getQuarter(curM);
      const qs = qStart(q);
      // Include from quarter start up to last complete month (capped at qEnd)
      const endM = Math.min(lcm, qEnd(q));
      const endY = curY;
      if (qs > endM && curY === lcy) return [{ year: lcy, month: lcm }];
      return buildRange(curY, qs, endY, endM);
    }

    case "last_quarter": {
      const q    = getQuarter(curM);
      const prevQ = q === 1 ? 4 : q - 1;
      const prevY = q === 1 ? curY - 1 : curY;
      return buildRange(prevY, qStart(prevQ), prevY, qEnd(prevQ));
    }

    case "ytd":
      return buildRange(curY, 1, lcy, lcm);

    case "last_year":
      return buildRange(curY - 1, 1, curY - 1, 12);

    case "custom": {
      const { year: sy, month: sm } = customStart;
      const { year: ey, month: em } = customEnd;
      // Guard: end must be >= start
      if (ey < sy || (ey === sy && em < sm)) return [customStart];
      return buildRange(sy, sm, ey, em);
    }

    default:
      return [{ year: lcy, month: lcm }];
  }
}

function shiftRange(range, months) {
  return range.map(({ year, month }) => {
    let m = month + months, y = year;
    while (m <= 0)  { m += 12; y--; }
    while (m > 12)  { m -= 12; y++; }
    return { year: y, month: m };
  });
}

/** Returns [priorEquivalentRange, sameRangeLastYear] */
function getCompRanges(range) {
  return [
    shiftRange(range, -range.length),
    shiftRange(range, -12),
  ];
}

function rangeToLabel(range) {
  if (!range.length) return "";
  const s = range[0], e = range[range.length - 1];
  if (range.length === 1) return `${MONTHS[s.month - 1]} ${s.year}`;
  if (s.year === e.year)
    return `${MONTHS[s.month - 1].slice(0, 3)}–${MONTHS[e.month - 1].slice(0, 3)} ${s.year}`;
  return `${MONTHS[s.month - 1].slice(0, 3)} ${s.year} – ${MONTHS[e.month - 1].slice(0, 3)} ${e.year}`;
}

function presetLabel(preset, range) {
  const now = new Date();
  const curY = now.getFullYear();
  switch (preset) {
    case "last_month":    return rangeToLabel(range);
    case "current_quarter": {
      const q = getQuarter(range[range.length - 1].month);
      return `Q${q} ${range[0].year} (to date)`;
    }
    case "last_quarter": {
      const q = getQuarter(range[0].month);
      return `Q${q} ${range[0].year}`;
    }
    case "ytd":           return `YTD ${range[0].year}`;
    case "last_year":     return `${range[0].year} (Full Year)`;
    case "custom":        return rangeToLabel(range);
    default:              return rangeToLabel(range);
  }
}

function toMonthStr({ year, month }) {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/* ─── AGGREGATION ENGINE ─── */

const SUM_FIELDS = {
  seo:        ["organic_sessions","total_sessions","impressions","vdp_views","phone_calls","form_submissions","direction_requests","chat_conversations"],
  gbp:        ["profile_views","search_appearances","map_views","website_clicks","phone_calls","direction_requests","new_reviews"],
  google_ads: ["conversions","total_spend","impressions","clicks"],
  meta_ads:   ["conversions","total_spend","reach","impressions"],
  social:     ["fb_visits","ig_reach","tiktok_profile_views","fb_engagement","ig_engagement","tiktok_likes","fb_new_followers","ig_new_followers","posts_published","videos_published","web_clicks","yt_month_views","yt_month_videos","yt_month_likes","yt_month_comments"],
  callrail:   ["total_calls","website_calls","ads_calls","gbp_calls"],
  leads:      ["total_leads","website_leads","third_party","facebook_leads","total_sold","website_sold","third_party_sold","facebook_sold","phone_sold",
               "ford_leads","ford_sold","mazda_leads","mazda_sold","vw_leads","vw_sold",
               "oem_leads","oem_sold"],
  email:      ["campaigns_sent","total_recipients","site_visits","conversions"],
  creative:   ["total_assets","videos","graphics","banners","print","ad_creative","email_headers"],
};

const AVG_FIELDS = {
  seo:        ["ctr","avg_position","bounce_rate","avg_session_duration"],
  gbp:        ["avg_rating"],
  google_ads: ["ctr","impression_share","quality_score"],
  meta_ads:   ["ctr","frequency","engagement_rate","video_view_rate","lead_form_completion"],
  social:     [],
  callrail:   [],
  leads:      [],
  email:      ["avg_open_rate","avg_click_rate","unsubscribe_rate"],
  creative:   [],
};

function aggregateDept(dataArr, dept) {
  if (!dataArr.length) return {};
  if (dataArr.length === 1) return dataArr[0];

  // Start with last month's values (captures text/snapshot fields like top_query, work_completed, etc.)
  const result = { ...dataArr[dataArr.length - 1] };

  (SUM_FIELDS[dept] || []).forEach(f => {
    const total = dataArr.reduce((acc, d) => acc + (Number(d[f]) || 0), 0);
    result[f] = total > 0 ? total : null;
  });

  (AVG_FIELDS[dept] || []).forEach(f => {
    const vals = dataArr.map(d => d[f]).filter(v => v != null && !isNaN(Number(v)));
    result[f] = vals.length ? vals.reduce((a, b) => a + Number(b), 0) / vals.length : null;
  });

  // Derived CPL and CPC from aggregated totals (more accurate than averaging)
  if (["google_ads","meta_ads"].includes(dept) && result.total_spend && result.conversions) {
    result.cost_per_lead = Number(result.total_spend) / Number(result.conversions);
  }
  if (dept === "google_ads" && result.total_spend && result.clicks) {
    result.cpc = Number(result.total_spend) / Number(result.clicks);
  }

  return result;
}

/** Given a range and a byMonth lookup, return aggregated {dept: data} map */
function aggregateRange(range, byMonth) {
  const allDepts = new Set();
  range.forEach(m => { const key = toMonthStr(m); Object.keys(byMonth[key] || {}).forEach(d => allDepts.add(d)); });

  const result = {};
  allDepts.forEach(dept => {
    const rows = range
      .map(m => byMonth[toMonthStr(m)]?.[dept])
      .filter(Boolean);
    result[dept] = aggregateDept(rows, dept);
  });
  return result;
}

/* ─── SHARED COMPONENTS ─── */

/** Arrow change indicator. Pass invert=true for cost metrics (lower = better). */
function Arr({ v, suf = "%", sz = 13, invert = false }) {
  if (v === undefined || v === null) return null;
  const isGood = invert ? v < 0 : v > 0;
  const color  = v === 0 ? C.tl : isGood ? C.g : C.r;
  const arrow  = v > 0 ? "▲" : v < 0 ? "▼" : "—";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color, fontSize: sz, fontWeight: 700, fontFamily: F }}>
      {arrow} {Math.abs(v)}{suf}
    </span>
  );
}

function Tip({ text }) {
  const [s, ss] = useState(false);
  return (
    <span onMouseEnter={() => ss(true)} onMouseLeave={() => ss(false)}
      style={{ position: "relative", cursor: "help", marginLeft: 4, color: C.tl, fontSize: 12 }}>
      &#9432;
      {s && (
        <span style={{
          position: "absolute", bottom: "130%", left: "50%", transform: "translateX(-50%)",
          background: C.navy, color: "#fff", padding: "6px 10px", borderRadius: 6,
          fontSize: 11, width: 200, textAlign: "center", zIndex: 99, pointerEvents: "none",
          fontWeight: 400, lineHeight: 1.4, fontFamily: F,
        }}>{text}</span>
      )}
    </span>
  );
}

/** Section heading — Instrument Serif title + optional subtitle. */
function SH({ title, sub, style: s }) {
  return (
    <div style={{ marginBottom: 10, ...s }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: C.t, margin: 0, fontFamily: FS }}>{title}</h2>
      {sub && <p style={{ fontSize: 11, color: C.tl, margin: "2px 0 0", fontFamily: F }}>{sub}</p>}
    </div>
  );
}

/** White KPI card with Instrument Serif number and optional change arrow. */
function KpiCard({ label, value, sub, color, tip, change, invert }) {
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.bd}`, borderRadius: 10,
      padding: "16px 20px", flex: 1, minWidth: 140, boxShadow: C.sh, textAlign: "center",
    }}>
      <div style={{ fontSize: 11, color: C.tl, fontWeight: 700, marginBottom: 6,
        textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: F,
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        {label}{tip && <Tip text={tip} />}
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color: color || C.t, fontFamily: FS, lineHeight: 1.1, marginBottom: 4 }}>
        {value || "—"}
      </div>
      {change !== undefined && <Arr v={change} invert={invert} sz={12} />}
      {sub && <div style={{ fontSize: 11, color: C.tl, marginTop: 4, fontFamily: F }}>{sub}</div>}
    </div>
  );
}

/** Metric pill inside a BlueCard. */
function BM({ l, v, pre = "", suf = "", change, invert }) {
  const display = (v === null || v === undefined || v === "")
    ? "—"
    : `${pre}${typeof v === "number" ? v.toLocaleString() : v}${suf}`;
  return (
    <div style={{ flex: 1, minWidth: 100, textAlign: "center", padding: "12px 8px" }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4, fontFamily: F }}>
        {l}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", fontFamily: FS, lineHeight: 1.1, marginBottom: 3 }}>
        {display}
      </div>
      {change !== undefined && <Arr v={change} invert={invert} sz={11} />}
    </div>
  );
}

/** Dark navy gradient summary card. */
function BlueCard({ icon, label, highlight, children }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.bc}, ${C.bl})`,
      borderRadius: 12, padding: "18px 22px",
      border: `1px solid ${C.bb}`, overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: FS }}>{label}</span>
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
}

function SecWrap({ title, sub, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <SH title={title} sub={sub} style={{ marginBottom: 12 }} />
      {children}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: C.white, borderRadius: 10, padding: "16px 18px",
      border: `1px solid ${C.bd}`, boxShadow: C.sh, marginBottom: 16, ...style }}>
      {children}
    </div>
  );
}

const thS = {
  textAlign: "left", padding: "8px 12px", fontSize: 10, color: C.tl,
  fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
  borderBottom: `2px solid ${C.bd}`, fontFamily: F, whiteSpace: "nowrap",
};
const tdS = {
  padding: "10px 12px", fontSize: 13, color: C.t,
  borderBottom: `1px solid ${C.bl2}`, fontFamily: F,
};

function WinsLosses({ wins, losses }) {
  const w = lines(wins), l = lines(losses);
  if (!w.length && !l.length) return null;
  return (
    <SecWrap title="Wins & Watch Items">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
        {w.map((x, i) => (
          <div key={i} style={{ background: C.gL, border: `1px solid ${C.gB}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, fontFamily: F, color: "#065f46", lineHeight: 1.5 }}>
            ✅ {x}
          </div>
        ))}
        {l.map((x, i) => (
          <div key={i} style={{ background: C.rL, border: `1px solid ${C.rB}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, fontFamily: F, color: "#991b1b", lineHeight: 1.5 }}>
            ⚠️ {x}
          </div>
        ))}
      </div>
    </SecWrap>
  );
}

function WorkDone({ text }) {
  const items = lines(text);
  if (!items.length) return null;
  return (
    <SecWrap title="Work Completed">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={{ background: "#f8fafc", border: `1px solid ${C.bd}`, borderRadius: 8,
            padding: "10px 14px", fontSize: 13, fontFamily: F, display: "flex", alignItems: "flex-start", gap: 8, lineHeight: 1.5 }}>
            <span style={{ color: C.cyanD, fontWeight: 700, flexShrink: 0 }}>✓</span>{it}
          </div>
        ))}
      </div>
    </SecWrap>
  );
}

function NextMonth({ text }) {
  const items = lines(text);
  if (!items.length) return null;
  return (
    <SecWrap title="What's Coming Next Month">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10,
            fontSize: 13, fontFamily: F, padding: "8px 12px", background: "#f8fafc",
            borderRadius: 8, border: `1px solid ${C.bd}`, lineHeight: 1.5 }}>
            <span style={{ color: C.cyan, fontWeight: 700, flexShrink: 0 }}>→</span>{it}
          </div>
        ))}
      </div>
    </SecWrap>
  );
}

function NoData({ label }) {
  return (
    <div style={{ padding: "60px 24px", textAlign: "center", color: C.tl, fontFamily: F, fontSize: 14 }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
      No {label || "data"} entered for this period yet.
    </div>
  );
}

/* ─── DASHBOARD ─── */
function Dashboard({ data, cd, services, clientName, leadTrend }) {
  const leads  = data.leads      || {};
  const lcmp   = cd.leads        || {};
  const cr     = data.callrail   || {};
  const crcmp  = cd.callrail     || {};
  const seo    = data.seo        || {};
  const scmp   = cd.seo          || {};
  const gbp    = data.gbp        || {};
  const gcmp   = cd.gbp          || {};
  const gads   = data.google_ads || {};
  const gacmp  = cd.google_ads   || {};
  const meta   = data.meta_ads   || {};
  const mcmp   = cd.meta_ads     || {};
  const social = data.social     || {};
  const socmp  = cd.social       || {};
  const email  = data.email      || {};
  const ecmp   = cd.email        || {};
  const creat  = data.creative   || {};

  const totalReach    = (Number(social.fb_visits) || 0)         + (Number(social.ig_reach) || 0)         + (Number(social.tiktok_profile_views) || 0);
  const totalEngage   = (Number(social.fb_engagement) || 0)    + (Number(social.ig_engagement) || 0)    + (Number(social.tiktok_likes) || 0);
  const newFollowers  = (Number(social.fb_new_followers) || 0) + (Number(social.ig_new_followers) || 0) + (Number(social.tiktok_followers) || 0);
  const prevReach     = (Number(socmp.fb_visits) || 0)          + (Number(socmp.ig_reach) || 0)          + (Number(socmp.tiktok_profile_views) || 0);
  const prevEngage    = (Number(socmp.fb_engagement) || 0)     + (Number(socmp.ig_engagement) || 0)     + (Number(socmp.tiktok_likes) || 0);
  const prevFollowers = (Number(socmp.fb_new_followers) || 0)  + (Number(socmp.ig_new_followers) || 0)  + (Number(socmp.tiktok_followers) || 0);

  // ── Lead type detection ──
  const isGoode      = clientName === GOODE_MOTOR_GROUP;
  const oemLabel     = JUNEAU_OEM_LABEL[clientName] || null;
  const leadsEnabled = services.leads !== false;

  // close % sub label helper
  const soldSub = (sold, src) => {
    const p = closePct(sold, src);
    return p !== null ? `${p}% close rate` : null;
  };

  // ── Lead summary — three layouts ──
  const renderLeads = () => {
    if (!leadsEnabled) return null;

    // Goode Motor Group — per-brand
    if (isGoode) {
      if (leads.total_leads == null && leads.ford_leads == null) return null;
      return (
        <SecWrap title="Lead Summary" sub="Total leads by brand — Goode Motor Group">
          {/* Row 1: Leads */}
          <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <KpiCard label="Total Leads"      value={fmt(leads.total_leads)} change={pct(leads.total_leads, lcmp.total_leads)} />
            <KpiCard label="Ford Leads"       value={fmt(leads.ford_leads)}  change={pct(leads.ford_leads,  lcmp.ford_leads)} />
            <KpiCard label="Mazda Leads"      value={fmt(leads.mazda_leads)} change={pct(leads.mazda_leads, lcmp.mazda_leads)} />
            <KpiCard label="Volkswagen Leads" value={fmt(leads.vw_leads)}    change={pct(leads.vw_leads,    lcmp.vw_leads)} />
          </div>
          {/* Row 2: Sold */}
          <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <KpiCard label="Total Sold"  value={fmt(leads.total_sold)}  color={C.g} change={pct(leads.total_sold,  lcmp.total_sold)} />
            <KpiCard label="Ford Sold"   value={fmt(leads.ford_sold)}   change={pct(leads.ford_sold,   lcmp.ford_sold)} />
            <KpiCard label="Mazda Sold"  value={fmt(leads.mazda_sold)}  change={pct(leads.mazda_sold,  lcmp.mazda_sold)} />
            <KpiCard label="VW Sold"     value={fmt(leads.vw_sold)}     change={pct(leads.vw_sold,     lcmp.vw_sold)} />
          </div>
          {/* Row 3: Close % */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <KpiCard label="Overall Close %"
              value={closePct(leads.total_sold, leads.total_leads) !== null ? closePct(leads.total_sold, leads.total_leads) + "%" : "—"}
              color={C.cyanD}
              change={pct(closePct(leads.total_sold, leads.total_leads), closePct(lcmp.total_sold, lcmp.total_leads))}
              tip="Total sold ÷ total leads" />
            <KpiCard label="Ford Close %"
              value={closePct(leads.ford_sold, leads.ford_leads) !== null ? closePct(leads.ford_sold, leads.ford_leads) + "%" : "—"}
              change={pct(closePct(leads.ford_sold, leads.ford_leads), closePct(lcmp.ford_sold, lcmp.ford_leads))} />
            <KpiCard label="Mazda Close %"
              value={closePct(leads.mazda_sold, leads.mazda_leads) !== null ? closePct(leads.mazda_sold, leads.mazda_leads) + "%" : "—"}
              change={pct(closePct(leads.mazda_sold, leads.mazda_leads), closePct(lcmp.mazda_sold, lcmp.mazda_leads))} />
            <KpiCard label="VW Close %"
              value={closePct(leads.vw_sold, leads.vw_leads) !== null ? closePct(leads.vw_sold, leads.vw_leads) + "%" : "—"}
              change={pct(closePct(leads.vw_sold, leads.vw_leads), closePct(lcmp.vw_sold, lcmp.vw_leads))} />
          </div>
        </SecWrap>
      );
    }

    // Juneau OEM clients
    if (oemLabel) {
      if (leads.total_leads == null) return null;
      return (
        <SecWrap title="Lead Summary" sub="Total leads across all sources">
          {/* Row 1: Leads */}
          <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <KpiCard label="Total Leads"           value={fmt(leads.total_leads)}    change={pct(leads.total_leads,    lcmp.total_leads)} />
            <KpiCard label="Website Leads"         value={fmt(leads.website_leads)}  change={pct(leads.website_leads,  lcmp.website_leads)}  tip="Leads from the dealership website." />
            <KpiCard label={`${oemLabel} Leads`}   value={fmt(leads.oem_leads)}      change={pct(leads.oem_leads,      lcmp.oem_leads)}      tip={`Leads from ${oemLabel} OEM sources.`} />
            <KpiCard label="Facebook Leads"        value={fmt(leads.facebook_leads)} change={pct(leads.facebook_leads, lcmp.facebook_leads)} />
          </div>
          {/* Row 2: Sold */}
          <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <KpiCard label="Total Sold"           value={fmt(leads.total_sold)}    color={C.g} change={pct(leads.total_sold,    lcmp.total_sold)} />
            <KpiCard label="Website Sold"         value={fmt(leads.website_sold)}  change={pct(leads.website_sold,  lcmp.website_sold)} />
            <KpiCard label={`${oemLabel} Sold`}   value={fmt(leads.oem_sold)}      change={pct(leads.oem_sold,      lcmp.oem_sold)} />
            <KpiCard label="Facebook Sold"        value={fmt(leads.facebook_sold)} change={pct(leads.facebook_sold, lcmp.facebook_sold)} />
          </div>
          {/* Row 3: Close % */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <KpiCard label="Overall Close %"
              value={closePct(leads.total_sold, leads.total_leads) !== null ? closePct(leads.total_sold, leads.total_leads) + "%" : "—"}
              color={C.cyanD}
              change={pct(closePct(leads.total_sold, leads.total_leads), closePct(lcmp.total_sold, lcmp.total_leads))}
              tip="Total sold ÷ total leads" />
            <KpiCard label="Website Close %"
              value={closePct(leads.website_sold, leads.website_leads) !== null ? closePct(leads.website_sold, leads.website_leads) + "%" : "—"}
              change={pct(closePct(leads.website_sold, leads.website_leads), closePct(lcmp.website_sold, lcmp.website_leads))} />
            <KpiCard label={`${oemLabel} Close %`}
              value={closePct(leads.oem_sold, leads.oem_leads) !== null ? closePct(leads.oem_sold, leads.oem_leads) + "%" : "—"}
              change={pct(closePct(leads.oem_sold, leads.oem_leads), closePct(lcmp.oem_sold, lcmp.oem_leads))} />
            <KpiCard label="Facebook Close %"
              value={closePct(leads.facebook_sold, leads.facebook_leads) !== null ? closePct(leads.facebook_sold, leads.facebook_leads) + "%" : "—"}
              change={pct(closePct(leads.facebook_sold, leads.facebook_leads), closePct(lcmp.facebook_sold, lcmp.facebook_leads))} />
          </div>
        </SecWrap>
      );
    }

    // Standard layout
    if (leads.total_leads == null) return null;
    return (
      <SecWrap title="Lead Summary" sub="Total leads across all channels">
        {/* Row 1: Leads */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <KpiCard label="Total Leads"    value={fmt(leads.total_leads)}    change={pct(leads.total_leads,    lcmp.total_leads)} />
          <KpiCard label="Website Leads"  value={fmt(leads.website_leads)}  change={pct(leads.website_leads,  lcmp.website_leads)}  tip="Leads from the dealership website." />
          <KpiCard label="Third Party"    value={fmt(leads.third_party)}    change={pct(leads.third_party,    lcmp.third_party)}    tip="Cars.com, AutoTrader, etc." />
          <KpiCard label="Facebook Leads" value={fmt(leads.facebook_leads)} change={pct(leads.facebook_leads, lcmp.facebook_leads)} />
        </div>
        {/* Row 2: Sold */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <KpiCard label="Total Sold"       value={fmt(leads.total_sold)}         color={C.g} change={pct(leads.total_sold,        lcmp.total_sold)} />
          <KpiCard label="Website Sold"     value={fmt(leads.website_sold)}       change={pct(leads.website_sold,     lcmp.website_sold)} />
          <KpiCard label="Third Party Sold" value={fmt(leads.third_party_sold)}   change={pct(leads.third_party_sold, lcmp.third_party_sold)} />
          <KpiCard label="Facebook Sold"    value={fmt(leads.facebook_sold)}      change={pct(leads.facebook_sold,    lcmp.facebook_sold)} />
        </div>
        {/* Row 3: Close % */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Overall Close %"
            value={closePct(leads.total_sold, leads.total_leads) !== null ? closePct(leads.total_sold, leads.total_leads) + "%" : "—"}
            color={C.cyanD}
            change={pct(closePct(leads.total_sold, leads.total_leads), closePct(lcmp.total_sold, lcmp.total_leads))}
            tip="Total sold ÷ total leads" />
          <KpiCard label="Website Close %"
            value={closePct(leads.website_sold, leads.website_leads) !== null ? closePct(leads.website_sold, leads.website_leads) + "%" : "—"}
            change={pct(closePct(leads.website_sold, leads.website_leads), closePct(lcmp.website_sold, lcmp.website_leads))} />
          <KpiCard label="3rd Party Close %"
            value={closePct(leads.third_party_sold, leads.third_party) !== null ? closePct(leads.third_party_sold, leads.third_party) + "%" : "—"}
            change={pct(closePct(leads.third_party_sold, leads.third_party), closePct(lcmp.third_party_sold, lcmp.third_party))} />
          <KpiCard label="Facebook Close %"
            value={closePct(leads.facebook_sold, leads.facebook_leads) !== null ? closePct(leads.facebook_sold, leads.facebook_leads) + "%" : "—"}
            change={pct(closePct(leads.facebook_sold, leads.facebook_leads), closePct(lcmp.facebook_sold, lcmp.facebook_leads))} />
        </div>
        {leads.phone_sold != null && (
          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            <KpiCard label="Phone Sold" value={fmt(leads.phone_sold)} change={pct(leads.phone_sold, lcmp.phone_sold)} />
          </div>
        )}
      </SecWrap>
    );
  };

  // Build lead + sold trend from historical data
  const trendLine = leadTrend
    .filter(t => t.total_leads != null || t.total_sold != null)
    .map(t => ({
      label:  t.label,
      leads:  t.total_leads != null ? Number(t.total_leads) : null,
      sold:   t.total_sold  != null ? Number(t.total_sold)  : null,
    }));

  // Build callrail trend
  const callTrend = leadTrend.length > 0
    ? null // callrail is a separate dept — use trendData.callrail if we had it
    : null;

  return (
    <>
      {renderLeads()}

      {/* Lead Trend Chart — only show when we have 3+ months of data */}
      {trendLine.length >= 3 && leadsEnabled && (
        <SecWrap title="Lead & Sales Trend" sub="Month-over-month leads and sold">
          <Card style={{ marginBottom: 0 }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendLine}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.bl2} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.tl }} />
                <YAxis tick={{ fontSize: 11, fill: C.tl }} allowDecimals={false} />
                <Tooltip contentStyle={ttS} />
                <Line type="monotone" dataKey="leads" stroke={C.cyan}  strokeWidth={2.5}
                  dot={{ r: 3, fill: C.cyan,  stroke: C.white, strokeWidth: 2 }} name="Leads" connectNulls />
                <Line type="monotone" dataKey="sold"  stroke={C.g}     strokeWidth={2.5}
                  dot={{ r: 3, fill: C.g,     stroke: C.white, strokeWidth: 2 }} name="Sold"  connectNulls />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 20, marginTop: 10, justifyContent: "center" }}>
              {[{ label: "Leads", color: C.cyan }, { label: "Sold", color: C.g }].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: F, color: C.tm }}>
                  <span style={{ width: 18, height: 3, background: s.color, borderRadius: 2, display: "inline-block" }} />
                  {s.label}
                </div>
              ))}
            </div>
          </Card>
        </SecWrap>
      )}

      {/* CallRail */}
      {services.callrail !== false && (cr.total_calls != null) && (
        <SecWrap title="Phone Calls" sub="Tracked via CallRail">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <KpiCard label="Total Calls"         value={fmt(cr.total_calls)}   change={pct(cr.total_calls,   crcmp.total_calls)} tip="Total tracked calls." />
            <KpiCard label="From Website"        value={fmt(cr.website_calls)} change={pct(cr.website_calls, crcmp.website_calls)} tip="Calls from website visits." />
            <KpiCard label="From Ads"            value={fmt(cr.ads_calls)}     change={pct(cr.ads_calls,     crcmp.ads_calls)} tip="Calls from paid campaigns." />
            <KpiCard label="From Google Business" value={fmt(cr.gbp_calls)}   change={pct(cr.gbp_calls,     crcmp.gbp_calls)} tip="Calls from GBP call button." />
          </div>
        </SecWrap>
      )}

      {/* Department BlueCards */}
      <SH title="Department Performance" style={{ marginBottom: 12 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>

        {services.seo !== false && (
          <BlueCard icon="🔍" label="SEO" highlight={seo.top_query ? `Top Query: ${seo.top_query}` : null}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <BM l="Org. Sessions" v={seo.organic_sessions ? Number(seo.organic_sessions) : null} change={pct(seo.organic_sessions, scmp.organic_sessions)} />
              <BM l="Impressions"   v={seo.impressions      ? Number(seo.impressions)      : null} change={pct(seo.impressions,      scmp.impressions)} />
              <BM l="Page 1 KWs"   v={seo.page1_keywords   ? Number(seo.page1_keywords)   : null} change={pct(seo.page1_keywords,   scmp.page1_keywords)} />
              <BM l="CTR"          v={seo.ctr != null ? parseFloat(seo.ctr).toFixed(1) : null} suf="%" change={pct(seo.ctr, scmp.ctr)} />
              <BM l="Avg Position" v={seo.avg_position != null ? parseFloat(seo.avg_position).toFixed(1) : null} change={pct(seo.avg_position, scmp.avg_position)} invert />
              <BM l="VDP Views"    v={seo.vdp_views ? Number(seo.vdp_views) : null} change={pct(seo.vdp_views, scmp.vdp_views)} />
            </div>
          </BlueCard>
        )}

        {services.gbp !== false && (
          <BlueCard icon="📍" label="Google Business Profile" highlight={gbp.avg_rating ? `★ ${gbp.avg_rating} avg rating · ${gbp.new_reviews || 0} new reviews` : null}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <BM l="Profile Views"    v={gbp.profile_views    ? Number(gbp.profile_views)    : null} change={pct(gbp.profile_views,    gcmp.profile_views)} />
              <BM l="Search Views"     v={gbp.search_appearances ? Number(gbp.search_appearances) : null} change={pct(gbp.search_appearances, gcmp.search_appearances)} />
              <BM l="Map Views"        v={gbp.map_views        ? Number(gbp.map_views)        : null} change={pct(gbp.map_views,        gcmp.map_views)} />
              <BM l="Web Clicks"       v={gbp.website_clicks   ? Number(gbp.website_clicks)   : null} change={pct(gbp.website_clicks,   gcmp.website_clicks)} />
              <BM l="Calls"            v={gbp.phone_calls      ? Number(gbp.phone_calls)      : null} change={pct(gbp.phone_calls,      gcmp.phone_calls)} />
              <BM l="Directions"       v={gbp.direction_requests ? Number(gbp.direction_requests) : null} change={pct(gbp.direction_requests, gcmp.direction_requests)} />
            </div>
          </BlueCard>
        )}

        {services.google_ads !== false && (
          <BlueCard icon="📢" label="Google Ads" highlight={gads.top_campaign ? `Top: ${gads.top_campaign}` : null}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <BM l="Conversions"  v={gads.conversions   ? Number(gads.conversions)                    : null} change={pct(gads.conversions,   gacmp.conversions)} />
              <BM l="Cost/Lead"    v={gads.cost_per_lead != null ? parseFloat(gads.cost_per_lead).toFixed(2) : null} pre="$" change={pct(gads.cost_per_lead, gacmp.cost_per_lead)} invert />
              <BM l="Spend"        v={gads.total_spend   ? Number(gads.total_spend)                    : null} pre="$" />
              <BM l="CTR"          v={gads.ctr != null ? parseFloat(gads.ctr).toFixed(1) : null} suf="%" change={pct(gads.ctr, gacmp.ctr)} />
              <BM l="CPC"          v={gads.cpc != null ? parseFloat(gads.cpc).toFixed(2) : null} pre="$" change={pct(gads.cpc, gacmp.cpc)} invert />
              <BM l="Imp. Share"   v={gads.impression_share != null ? parseFloat(gads.impression_share).toFixed(0) : null} suf="%" change={pct(gads.impression_share, gacmp.impression_share)} />
            </div>
          </BlueCard>
        )}

        {services.meta_ads !== false && (
          <BlueCard icon="📱" label="Meta Ads" highlight={meta.top_ad ? `Top: ${meta.top_ad}` : null}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <BM l="Conversions" v={meta.conversions   ? Number(meta.conversions)                    : null} change={pct(meta.conversions,   mcmp.conversions)} />
              <BM l="Cost/Lead"   v={meta.cost_per_lead != null ? parseFloat(meta.cost_per_lead).toFixed(2) : null} pre="$" change={pct(meta.cost_per_lead, mcmp.cost_per_lead)} invert />
              <BM l="Reach"       v={meta.reach         ? Number(meta.reach)                          : null} change={pct(meta.reach,         mcmp.reach)} />
              <BM l="CPC"         v={meta.cpc != null ? parseFloat(meta.cpc).toFixed(2) : null} pre="$" change={pct(meta.cpc, mcmp.cpc)} invert />
              <BM l="Frequency"   v={meta.frequency != null ? parseFloat(meta.frequency).toFixed(1) : null} />
              <BM l="Eng. Rate"   v={meta.engagement_rate != null ? parseFloat(meta.engagement_rate).toFixed(1) : null} suf="%" change={pct(meta.engagement_rate, mcmp.engagement_rate)} />
            </div>
          </BlueCard>
        )}

        {services.social !== false && (
          <BlueCard icon="🎬" label="Organic Social"
            highlight={social.top_video ? `🎬 ${social.top_video}${social.top_video_views ? " — " + Number(social.top_video_views).toLocaleString() + " views" : ""}` : null}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <BM l="Total Reach"    v={totalReach    > 0 ? totalReach    : null} change={pct(totalReach,    prevReach)} />
              <BM l="Engagement"     v={totalEngage   > 0 ? totalEngage   : null} change={pct(totalEngage,   prevEngage)} />
              <BM l="New Followers"  v={newFollowers  > 0 ? newFollowers  : null} pre="+" change={pct(newFollowers, prevFollowers)} />
              <BM l="Posts"          v={social.posts_published ? Number(social.posts_published) : null} />
              <BM l="Videos"         v={social.videos_published ? Number(social.videos_published) : null} />
              <BM l="Web Clicks"     v={social.web_clicks ? Number(social.web_clicks) : null} change={pct(social.web_clicks, socmp.web_clicks)} />
            </div>
          </BlueCard>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {services.email !== false && (
            <BlueCard icon="✉️" label="Email">
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                <BM l="Campaigns"  v={email.campaigns_sent    ? Number(email.campaigns_sent)    : null} />
                <BM l="Recipients" v={email.total_recipients  ? Number(email.total_recipients)  : null} />
                <BM l="Open Rate"  v={email.avg_open_rate != null ? parseFloat(email.avg_open_rate).toFixed(1) : null} suf="%" change={pct(email.avg_open_rate, ecmp.avg_open_rate)} />
                <BM l="Site Visits" v={email.site_visits ? Number(email.site_visits) : null} change={pct(email.site_visits, ecmp.site_visits)} />
              </div>
            </BlueCard>
          )}
          {services.creative !== false && (
            <BlueCard icon="🎨" label="Creative">
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                <BM l="Delivered" v={creat.total_assets ? Number(creat.total_assets) : null} />
                <BM l="Videos"    v={creat.videos       ? Number(creat.videos)       : null} />
                <BM l="Graphics"  v={creat.graphics     ? Number(creat.graphics)     : null} />
                <BM l="Banners"   v={creat.banners      ? Number(creat.banners)      : null} />
              </div>
            </BlueCard>
          )}
        </div>
      </div>

      {/* Notes */}
      {(data.leads?.notes) && (
        <Card>
          <SH title="Notes" />
          <div style={{ fontSize: 13, color: C.t, fontFamily: F, lineHeight: 1.7 }}>{data.leads.notes}</div>
        </Card>
      )}
    </>
  );
}

/* ─── SEO PAGE ─── */
function SeoPage({ d, cd, trend }) {
  if (!d) return <NoData label="SEO data" />;

  // Trend line data from real historical fetch
  const trendLine = trend
    .filter(t => t.organic_sessions != null)
    .map(t => ({ month: t.label, sessions: Number(t.organic_sessions) || 0 }));

  // Traffic channel donut
  const organic = Number(d.organic_sessions) || 0;
  const direct  = Number(d.direct_sessions)  || 0;
  const paid    = Number(d.paid_sessions)    || 0;
  const social  = Number(d.social_sessions)  || 0;
  const totalSessions = organic + direct + paid + social;
  const channelData = totalSessions > 0 ? [
    { name: "Organic", value: organic, color: C.cyan },
    { name: "Direct",  value: direct,  color: C.navy },
    { name: "Paid",    value: paid,    color: C.o },
    { name: "Social",  value: social,  color: C.p },
  ].filter(ch => ch.value > 0) : [];

  // Keyword position distribution from tracked_keywords
  const keywords = Array.isArray(d.tracked_keywords) ? d.tracked_keywords : [];
  const positionBrackets = [
    { p: "Pos 1",    range: [1, 1],   color: C.g },
    { p: "Pos 2–3",  range: [2, 3],   color: C.cyan },
    { p: "Pos 4–10", range: [4, 10],  color: C.p },
    { p: "Pos 11–20",range: [11, 20], color: C.o },
    { p: "Pos 20+",  range: [21, 999],color: C.tl },
  ].map(b => ({
    ...b,
    count: keywords.filter(k => {
      const pos = k.current_position ?? k.position;
      return pos != null && pos >= b.range[0] && pos <= b.range[1];
    }).length,
  })).filter(b => b.count > 0);

  return (
    <div>
      <SecWrap title="Key Metrics" sub="Organic search performance from GA4 + Search Console">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Organic Sessions" value={fmt(d.organic_sessions)} color={C.cyanD}
            change={pct(d.organic_sessions, cd.organic_sessions)}
            tip="Website visits from organic Google search."
            sub={totalSessions > 0 ? `${Math.round((organic / totalSessions) * 1000) / 10}% of ${totalSessions.toLocaleString()} total` : null} />
          <KpiCard label="Impressions" value={fmt(d.impressions)}
            change={pct(d.impressions, cd.impressions)}
            tip="Times your site appeared in Google results." />
          <KpiCard label="CTR" value={d.ctr != null ? parseFloat(d.ctr).toFixed(1) + "%" : "—"}
            change={pct(d.ctr, cd.ctr)} tip="Click-through rate from search." sub="Industry avg 2–4%" />
          <KpiCard label="Avg Position" value={d.avg_position != null ? parseFloat(d.avg_position).toFixed(1) : "—"}
            change={pct(d.avg_position, cd.avg_position)} invert
            tip="Average ranking across all tracked keywords." />
          <KpiCard label="Page 1 Keywords" value={fmt(d.page1_keywords)} color={C.cyanD}
            change={pct(d.page1_keywords, cd.page1_keywords)}
            tip="Target keywords ranking on Google page 1." />
          <KpiCard label="VDP Views" value={fmt(d.vdp_views)}
            change={pct(d.vdp_views, cd.vdp_views)}
            tip="Vehicle Detail Page views — high-intent shoppers." />
        </div>
      </SecWrap>

      <SecWrap title="Conversions & Engagement">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Phone Calls (SEO)" value={fmt(d.phone_calls)} color={C.g}
            change={pct(d.phone_calls, cd.phone_calls)} tip="Calls attributed to organic search." />
          <KpiCard label="Form Submissions" value={fmt(d.form_submissions)}
            change={pct(d.form_submissions, cd.form_submissions)}
            tip="Contact, trade-in, and finance forms via GA4." />
          <KpiCard label="Direction Requests" value={fmt(d.direction_requests)}
            change={pct(d.direction_requests, cd.direction_requests)}
            tip="Users who requested directions via search." />
          {d.chat_conversations != null && (
            <KpiCard label="Chat Conversations" value={fmt(d.chat_conversations)}
              change={pct(d.chat_conversations, cd.chat_conversations)} />
          )}
          {d.bounce_rate != null && (
            <KpiCard label="Bounce Rate" value={parseFloat(d.bounce_rate).toFixed(1) + "%"}
              change={pct(d.bounce_rate, cd.bounce_rate)} invert sub="Industry avg 40–55%" />
          )}
          {d.avg_session_duration != null && (
            <KpiCard label="Avg Session" value={fmtDur(d.avg_session_duration)} sub="2+ min is healthy" />
          )}
        </div>
      </SecWrap>

      {/* Organic Traffic Trend + Channel Split */}
      {(trendLine.length > 0 || channelData.length > 0) && (
        <SecWrap title="Organic Traffic" sub="Trend over time and channel breakdown">
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "stretch" }}>
            {trendLine.length > 0 && (
              <Card style={{ flex: 3, minWidth: 300, marginBottom: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.t, marginBottom: 8, fontFamily: F }}>Traffic Trend</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendLine}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.bl2} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: C.tl }} />
                    <YAxis tick={{ fontSize: 10, fill: C.tl }} />
                    <Tooltip contentStyle={ttS} />
                    <Line type="monotone" dataKey="sessions" stroke={C.cyan} strokeWidth={2.5}
                      dot={{ r: 3, fill: C.cyan, stroke: C.white, strokeWidth: 2 }} name="Sessions" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}
            {channelData.length > 0 && (
              <Card style={{ flex: 1.4, minWidth: 200, marginBottom: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.t, marginBottom: 8, fontFamily: F }}>Channel Split</div>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={channelData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" innerRadius={36} outerRadius={56} strokeWidth={0}>
                      {channelData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={ttS} formatter={(v) => v.toLocaleString()} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                  {channelData.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontFamily: F }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                      <span style={{ color: C.tm, flex: 1 }}>{s.name}</span>
                      <span style={{ fontWeight: 700, color: i === 0 ? C.cyanD : C.t }}>
                        {Math.round((s.value / totalSessions) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </SecWrap>
      )}

      {/* Keyword Position Distribution */}
      {positionBrackets.length > 0 && (
        <SecWrap title="Keyword Position Distribution" sub={`${keywords.length} tracked keywords`}>
          <Card style={{ marginBottom: 0 }}>
            <ResponsiveContainer width="100%" height={positionBrackets.length * 36 + 20}>
              <BarChart data={positionBrackets} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={C.bl2} />
                <XAxis type="number" tick={{ fontSize: 10, fill: C.tl }} allowDecimals={false} />
                <YAxis dataKey="p" type="category" tick={{ fontSize: 11, fill: C.tm }} width={68} />
                <Tooltip contentStyle={ttS} formatter={(v) => [v, "Keywords"]} />
                <Bar dataKey="count" name="Keywords" radius={[0, 4, 4, 0]}>
                  {positionBrackets.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </SecWrap>
      )}

      {d.top_query && (
        <SecWrap title="Top Performing Query">
          <div style={{ background: C.cyanL, border: `1px solid #a5f3fc`, borderRadius: 10,
            padding: "14px 20px", fontFamily: F, fontSize: 14, fontWeight: 700, color: C.navy }}>
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
function GbpPage({ d, cd, trend, clientName }) {
  if (!d) return <NoData label="Google Business data" />;

  const listings = GBP_MULTI_LISTINGS[clientName] || null;

  // Views trend
  const viewsTrend = trend
    .filter(t => t.profile_views != null)
    .map(t => ({ label: t.label, views: Number(t.profile_views) || 0 }));

  // Actions trend
  const actionsTrend = trend
    .filter(t => t.phone_calls != null || t.direction_requests != null || t.website_clicks != null)
    .map(t => ({
      label: t.label,
      calls:      Number(t.phone_calls)        || 0,
      directions: Number(t.direction_requests) || 0,
      clicks:     Number(t.website_clicks)     || 0,
    }));

  const hasCharts = viewsTrend.length > 1 || actionsTrend.length > 1;

  // Per-listing stat card helper
  const listingStat = (listingKey, field) => {
    const v = d[`gbp_${listingKey}_${field}`];
    return v != null ? Number(v) : null;
  };

  return (
    <div>
      {/* Combined KPIs */}
      <SecWrap title="Key Metrics" sub={listings ? "Combined totals across all listings" : "Google Business Profile visibility and actions"}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Profile Views"       value={fmt(d.profile_views)}      change={pct(d.profile_views,      cd.profile_views)}      tip="Total times your GBP profile was seen." />
          <KpiCard label="Search Appearances"  value={fmt(d.search_appearances)} change={pct(d.search_appearances, cd.search_appearances)} tip="Times your business appeared in Google Search." />
          <KpiCard label="Map Views"           value={fmt(d.map_views)}          change={pct(d.map_views,          cd.map_views)}          tip="Times your location appeared in Google Maps." />
          <KpiCard label="Website Clicks"      value={fmt(d.website_clicks)}     change={pct(d.website_clicks,     cd.website_clicks)}     color={C.cyanD} tip="Clicks from GBP to your website." />
          <KpiCard label="Phone Calls"         value={fmt(d.phone_calls)}        change={pct(d.phone_calls,        cd.phone_calls)}        color={C.g} tip="Calls made directly from the GBP listing." />
          <KpiCard label="Direction Requests"  value={fmt(d.direction_requests)} change={pct(d.direction_requests, cd.direction_requests)} tip="Users who requested directions." />
        </div>
      </SecWrap>

      {/* Per-listing breakdown — only for multi-listing clients */}
      {listings && listings.some(l => listingStat(l.key, "profile_views") != null) && (
        <SecWrap title="Listing Breakdown" sub="Performance by individual Google Business Profile">
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {listings.map(l => {
              const views    = listingStat(l.key, "profile_views");
              const searches = listingStat(l.key, "search_appearances");
              const mapV     = listingStat(l.key, "map_views");
              const clicks   = listingStat(l.key, "website_clicks");
              const calls    = listingStat(l.key, "phone_calls");
              const dirs     = listingStat(l.key, "direction_requests");
              const rating   = d[`gbp_${l.key}_avg_rating`];
              const reviews  = listingStat(l.key, "review_count");
              const newRev   = listingStat(l.key, "new_reviews");
              const posts    = listingStat(l.key, "posts_published");

              return (
                <div key={l.key} style={{
                  flex: 1, minWidth: 300, background: C.white,
                  border: `2px solid ${l.color}33`, borderRadius: 12,
                  padding: "18px 20px", boxShadow: C.sh,
                }}>
                  {/* Listing header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                    paddingBottom: 10, borderBottom: `2px solid ${l.color}22` }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.t, fontFamily: FS }}>📍 {l.label}</span>
                  </div>

                  {/* Stats grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Profile Views",    value: views   },
                      { label: "Web Clicks",       value: clicks,  color: l.color },
                      { label: "Phone Calls",      value: calls,   color: C.g },
                      { label: "Directions",       value: dirs    },
                      { label: "Map Views",        value: mapV    },
                      { label: "Search Views",     value: searches },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: "center", background: "#f8fafc",
                        borderRadius: 8, padding: "10px 6px", border: `1px solid ${C.bl2}` }}>
                        <div style={{ fontSize: 10, color: C.tl, fontWeight: 700, textTransform: "uppercase",
                          letterSpacing: "0.05em", fontFamily: F, marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: s.color || C.t, fontFamily: FS }}>
                          {s.value != null ? s.value.toLocaleString() : "—"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reviews for this listing */}
                  {(rating != null || reviews != null) && (
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.bl2}`,
                      display: "flex", gap: 12, alignItems: "center" }}>
                      {rating != null && (
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: C.t, fontFamily: FS }}>{parseFloat(rating).toFixed(1)}</div>
                          <div style={{ color: C.o, fontSize: 14 }}>{"★".repeat(Math.round(rating))}</div>
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 10 }}>
                        {reviews != null && <div style={{ fontSize: 12, color: C.tl, fontFamily: F }}>{reviews.toLocaleString()} reviews</div>}
                        {newRev  != null && <div style={{ fontSize: 12, color: C.g,  fontFamily: F, fontWeight: 700 }}>+{newRev} new</div>}
                        {posts   != null && <div style={{ fontSize: 12, color: C.tl, fontFamily: F }}>{posts} posts</div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SecWrap>
      )}

      {/* Trend charts */}
      {hasCharts && (
        <SecWrap title="Performance Trends" sub="Profile views and customer actions over time">
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {viewsTrend.length > 1 && (
              <Card style={{ flex: 1, minWidth: 280, marginBottom: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.t, marginBottom: 8, fontFamily: F }}>Profile Views</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={viewsTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.bl2} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.tl }} />
                    <YAxis tick={{ fontSize: 10, fill: C.tl }} />
                    <Tooltip contentStyle={ttS} />
                    <Line type="monotone" dataKey="views" stroke={C.cyan} strokeWidth={2.5}
                      dot={{ r: 3, fill: C.cyan, stroke: C.white, strokeWidth: 2 }} name="Views" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}
            {actionsTrend.length > 1 && (
              <Card style={{ flex: 1.5, minWidth: 320, marginBottom: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.t, marginBottom: 8, fontFamily: F }}>Customer Actions</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={actionsTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.bl2} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.tl }} />
                    <YAxis tick={{ fontSize: 10, fill: C.tl }} />
                    <Tooltip contentStyle={ttS} />
                    <Line type="monotone" dataKey="calls"      stroke={C.g}    strokeWidth={2} dot={false} name="Calls" />
                    <Line type="monotone" dataKey="directions" stroke={C.o}    strokeWidth={2} dot={false} name="Directions" />
                    <Line type="monotone" dataKey="clicks"     stroke={C.cyan} strokeWidth={2} dot={false} name="Web Clicks" />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                  {[{label:"Calls",color:C.g},{label:"Directions",color:C.o},{label:"Web Clicks",color:C.cyan}].map(s => (
                    <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: F, color: C.tm }}>
                      <span style={{ width: 16, height: 3, background: s.color, borderRadius: 2, display: "inline-block" }} />
                      {s.label}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </SecWrap>
      )}

      {/* Reviews — only for single-listing clients */}
      {!listings && (d.avg_rating != null || d.review_count != null) && (
        <SecWrap title="Reviews">
          <Card>
            <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center", minWidth: 100 }}>
                <div style={{ fontSize: 52, fontWeight: 700, color: C.t, fontFamily: FS, lineHeight: 1 }}>
                  {d.avg_rating ? parseFloat(d.avg_rating).toFixed(1) : "—"}
                </div>
                <div style={{ color: C.o, fontSize: 22, margin: "4px 0" }}>
                  {"★".repeat(Math.round(d.avg_rating || 0))}
                </div>
                <div style={{ fontSize: 12, color: C.tl, fontFamily: F }}>
                  {d.review_count ? `${d.review_count} reviews` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, flex: 1, flexWrap: "wrap" }}>
                {d.new_reviews    != null && <KpiCard label="New Reviews"     value={`+${d.new_reviews}`} color={C.g} />}
                {d.photo_count    != null && <KpiCard label="Photos"          value={fmt(d.photo_count)} />}
                {d.posts_published!= null && <KpiCard label="Posts Published" value={fmt(d.posts_published)} />}
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
function GoogleAdsPage({ d, cd, trend }) {
  if (!d) return <NoData label="Google Ads data" />;

  const convTrend = trend
    .filter(t => t.conversions != null)
    .map(t => ({ label: t.label, conversions: Number(t.conversions) || 0 }));

  const spend  = d.total_spend != null ? Number(d.total_spend)  : null;
  const budget = d.budget      != null ? Number(d.budget)       : null;
  const spendPct = spend && budget && budget > 0
    ? Math.min(Math.round((spend / budget) * 100), 100) : null;

  return (
    <div>
      <SecWrap title="Key Metrics" sub="Campaign performance from Google Ads">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Conversions"     value={fmt(d.conversions)}   color={C.cyanD}
            change={pct(d.conversions, cd.conversions)} tip="Total tracked conversions from Google Ads." />
          <KpiCard label="Cost / Lead"
            value={d.cost_per_lead != null ? "$" + parseFloat(d.cost_per_lead).toFixed(2) : "—"}
            color={C.g} invert change={pct(d.cost_per_lead, cd.cost_per_lead)}
            tip="Average cost per conversion." sub="Industry avg $25–$45" />
          <KpiCard label="Total Spend"
            value={spend != null ? "$" + spend.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
            tip="Total ad spend this period."
            sub={budget ? `Budget: $${budget.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : null} />
          <KpiCard label="CTR"
            value={d.ctr != null ? parseFloat(d.ctr).toFixed(1) + "%" : "—"}
            change={pct(d.ctr, cd.ctr)} tip="Click-through rate." sub="Industry avg ~8.29%" />
          <KpiCard label="Avg CPC"
            value={d.cpc != null ? "$" + parseFloat(d.cpc).toFixed(2) : "—"}
            invert change={pct(d.cpc, cd.cpc)} tip="Average cost per click." sub="Industry avg ~$2.41" />
          <KpiCard label="Impression Share"
            value={d.impression_share != null ? parseFloat(d.impression_share).toFixed(0) + "%" : "—"}
            change={pct(d.impression_share, cd.impression_share)} tip="% of eligible searches you appeared for." />
        </div>
      </SecWrap>

      {/* Spend vs Budget + Conversions Trend */}
      {(spendPct !== null || convTrend.length > 1) && (
        <SecWrap title="Spend & Trend">
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {spendPct !== null && (
              <Card style={{ flex: 1, minWidth: 240, marginBottom: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.t, marginBottom: 12, fontFamily: F }}>Spend vs Budget</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 26, fontWeight: 700, color: C.t, fontFamily: FS }}>${spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span style={{ fontSize: 12, color: C.tl, marginLeft: 6, fontFamily: F }}>of ${budget.toLocaleString(undefined, { maximumFractionDigits: 0 })} budget</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: spendPct >= 90 ? C.g : spendPct >= 70 ? C.o : C.r, fontFamily: F }}>{spendPct}% utilized</span>
                </div>
                <div style={{ height: 10, background: C.bl2, borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${spendPct}%`, background: `linear-gradient(90deg, ${C.cyan}, ${C.cyanD})`, borderRadius: 5, transition: "width 0.6s" }} />
                </div>
              </Card>
            )}
            {convTrend.length > 1 && (
              <Card style={{ flex: 1.8, minWidth: 300, marginBottom: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.t, marginBottom: 8, fontFamily: F }}>Monthly Conversions Trend</div>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={convTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.bl2} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.tl }} />
                    <YAxis tick={{ fontSize: 10, fill: C.tl }} allowDecimals={false} />
                    <Tooltip contentStyle={ttS} />
                    <Line type="monotone" dataKey="conversions" stroke={C.cyan} strokeWidth={2.5}
                      dot={{ r: 3, fill: C.cyan, stroke: C.white, strokeWidth: 2 }} name="Conversions" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        </SecWrap>
      )}

      {(d.impressions != null || d.clicks != null || d.quality_score != null) && (
        <SecWrap title="Secondary Metrics">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {d.impressions   != null && <KpiCard label="Impressions"       value={fmt(d.impressions)} change={pct(d.impressions, cd.impressions)} />}
            {d.clicks        != null && <KpiCard label="Total Clicks"      value={fmt(d.clicks)} change={pct(d.clicks, cd.clicks)} />}
            {d.quality_score != null && <KpiCard label="Avg Quality Score" value={parseFloat(d.quality_score).toFixed(1) + " / 10"} tip="6+ is standard." sub="Scale: 1–10" />}
          </div>
        </SecWrap>
      )}

      {d.top_campaign && (
        <SecWrap title="Top Performing Campaign">
          <div style={{ background: C.cyanL, border: `1px solid #a5f3fc`, borderRadius: 10,
            padding: "14px 20px", fontFamily: F, fontSize: 14, fontWeight: 700, color: C.navy }}>
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
function MetaAdsPage({ d, cd, trend }) {
  if (!d) return <NoData label="Meta Ads data" />;

  const convTrend = trend
    .filter(t => t.conversions != null)
    .map(t => ({ label: t.label, conversions: Number(t.conversions) || 0 }));

  return (
    <div>
      <SecWrap title="Key Metrics" sub="Facebook & Instagram ad performance">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Conversions"  value={fmt(d.conversions)} color={C.cyanD}
            change={pct(d.conversions, cd.conversions)} tip="Total tracked conversions from Meta ads." />
          <KpiCard label="Cost / Lead"
            value={d.cost_per_lead != null ? "$" + parseFloat(d.cost_per_lead).toFixed(2) : "—"}
            color={C.g} invert change={pct(d.cost_per_lead, cd.cost_per_lead)}
            tip="Average cost per lead." sub="Industry avg $25–$40" />
          <KpiCard label="Total Spend"
            value={d.total_spend != null ? "$" + Number(d.total_spend).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"} />
          <KpiCard label="Reach" value={fmt(d.reach)}
            change={pct(d.reach, cd.reach)} tip="Unique people who saw your ads." />
          <KpiCard label="Avg CPC"
            value={d.cpc != null ? "$" + parseFloat(d.cpc).toFixed(2) : "—"}
            invert change={pct(d.cpc, cd.cpc)} tip="Cost per click." sub="Industry avg ~$0.79" />
          <KpiCard label="Frequency"
            value={d.frequency != null ? parseFloat(d.frequency).toFixed(1) : "—"}
            tip="Avg times each person saw your ad. Over 3.0 = fatigue risk." />
        </div>
      </SecWrap>

      {/* Conversions trend */}
      {convTrend.length > 1 && (
        <SecWrap title="Monthly Conversions Trend">
          <Card style={{ marginBottom: 0 }}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={convTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.bl2} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.tl }} />
                <YAxis tick={{ fontSize: 10, fill: C.tl }} allowDecimals={false} />
                <Tooltip contentStyle={ttS} />
                <Line type="monotone" dataKey="conversions" stroke={C.p} strokeWidth={2.5}
                  dot={{ r: 3, fill: C.p, stroke: C.white, strokeWidth: 2 }} name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </SecWrap>
      )}

      {(d.impressions != null || d.ctr != null || d.engagement_rate != null || d.video_view_rate != null || d.lead_form_completion != null) && (
        <SecWrap title="Secondary Metrics">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {d.impressions          != null && <KpiCard label="Impressions"          value={fmt(d.impressions)} change={pct(d.impressions, cd.impressions)} />}
            {d.ctr                  != null && <KpiCard label="CTR"                  value={parseFloat(d.ctr).toFixed(1) + "%"} change={pct(d.ctr, cd.ctr)} tip="Click-through rate across Meta placements." />}
            {d.engagement_rate      != null && <KpiCard label="Engagement Rate"      value={parseFloat(d.engagement_rate).toFixed(1) + "%"} change={pct(d.engagement_rate, cd.engagement_rate)} tip="Likes, comments, and shares as % of reach." />}
            {d.video_view_rate      != null && <KpiCard label="Video View Rate"      value={parseFloat(d.video_view_rate).toFixed(1) + "%"} change={pct(d.video_view_rate, cd.video_view_rate)} tip="% of video ads watched to completion." />}
            {d.lead_form_completion != null && <KpiCard label="Lead Form Completion" value={parseFloat(d.lead_form_completion).toFixed(0) + "%"} color={C.g} tip="Of people who opened a form, how many submitted." />}
          </div>
        </SecWrap>
      )}

      {d.top_ad && (
        <SecWrap title="Top Performing Ad">
          <div style={{ background: C.cyanL, border: `1px solid #a5f3fc`, borderRadius: 10,
            padding: "14px 20px", fontFamily: F, fontSize: 14, fontWeight: 700, color: C.navy }}>
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
function SocialPage({ d, cd, trend }) {
  if (!d) return <NoData label="Organic Social data" />;

  const totalReach    = (Number(d.fb_visits) || 0)          + (Number(d.ig_reach) || 0)          + (Number(d.tiktok_profile_views) || 0);
  const totalEngage   = (Number(d.fb_engagement) || 0)     + (Number(d.ig_engagement) || 0)     + (Number(d.tiktok_likes) || 0);
  const newFollowers  = (Number(d.fb_new_followers) || 0)  + (Number(d.ig_new_followers) || 0)  + (Number(d.tiktok_followers) || 0);
  const prevReach     = (Number(cd.fb_visits) || 0)         + (Number(cd.ig_reach) || 0)         + (Number(cd.tiktok_profile_views) || 0);
  const prevEngage    = (Number(cd.fb_engagement) || 0)    + (Number(cd.ig_engagement) || 0)    + (Number(cd.tiktok_likes) || 0);
  const prevFollowers = (Number(cd.fb_new_followers) || 0) + (Number(cd.ig_new_followers) || 0) + (Number(cd.tiktok_followers) || 0);

  const platforms = [
    { name: "YouTube",   followers: d.yt_followers,     growth: null,               views: d.yt_month_views, color: "#ff0000", posts: d.yt_month_videos },
    { name: "Facebook",  followers: d.fb_followers,     growth: d.fb_new_followers,  views: d.fb_visits,       color: "#1877f2", posts: null },
    { name: "Instagram", followers: d.ig_followers,     growth: d.ig_new_followers,  views: d.ig_reach,       color: "#e1306c", posts: null },
    { name: "TikTok",    followers: d.tiktok_followers, growth: null,               views: d.tiktok_views,   color: "#333",    posts: null },
  ].filter(p => p.followers != null || p.views != null);

  // Reach trend from historical data
  const reachTrend = trend
    .map(t => {
      const r = (Number(t.fb_visits) || 0) + (Number(t.ig_reach) || 0) + (Number(t.tiktok_profile_views) || 0);
      return r > 0 ? { label: t.label, reach: r } : null;
    })
    .filter(Boolean);

  // Platform reach bar chart for current month
  const platformReach = [
    { name: "Facebook",  reach: Number(d.fb_visits)      || 0, color: "#1877f2" },
    { name: "Instagram", reach: Number(d.ig_reach)      || 0, color: "#e1306c" },
    { name: "TikTok",    reach: Number(d.tiktok_profile_views)  || 0, color: "#333" },
    { name: "YouTube",   reach: Number(d.yt_month_views)|| 0, color: "#ff0000" },
  ].filter(p => p.reach > 0);

  return (
    <div>
      <SecWrap title="Monthly Overview">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Total Reach"      value={totalReach   > 0 ? fmt(totalReach)   : "—"} change={pct(totalReach,   prevReach)}    tip="Combined reach across FB, IG, and TikTok." />
          <KpiCard label="Total Engagement" value={totalEngage  > 0 ? fmt(totalEngage)  : "—"} change={pct(totalEngage,  prevEngage)}   color={C.cyanD} tip="Likes, comments, shares, and saves." />
          <KpiCard label="New Followers"    value={newFollowers > 0 ? "+" + fmt(newFollowers) : "—"} change={pct(newFollowers, prevFollowers)} color={C.g} tip="Net new followers across all platforms." />
          <KpiCard label="Posts Published"  value={fmt(d.posts_published)}  tip="Total posts across all platforms." />
          <KpiCard label="Videos Published" value={fmt(d.videos_published)} tip="Reels, TikTok, and YouTube videos." />
          {d.web_clicks != null && <KpiCard label="Social → Web" value={fmt(d.web_clicks)} change={pct(d.web_clicks, cd.web_clicks)} tip="Clicks from social to your website (GA4)." />}
        </div>
      </SecWrap>

      {/* Reach Trend + Platform Breakdown side by side */}
      {(reachTrend.length > 1 || platformReach.length > 0) && (
        <SecWrap title="Reach Overview" sub="Trend and platform breakdown">
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {reachTrend.length > 1 && (
              <Card style={{ flex: 2, minWidth: 300, marginBottom: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.t, marginBottom: 8, fontFamily: F }}>Monthly Reach Trend</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={reachTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.bl2} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.tl }} />
                    <YAxis tick={{ fontSize: 10, fill: C.tl }} />
                    <Tooltip contentStyle={ttS} formatter={(v) => [v.toLocaleString(), "Reach"]} />
                    <Bar dataKey="reach" fill={C.cyan} radius={[3, 3, 0, 0]} name="Reach" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
            {platformReach.length > 0 && (
              <Card style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.t, marginBottom: 8, fontFamily: F }}>Reach by Platform</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={platformReach} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.bl2} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: C.tl }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: C.tm }} width={72} />
                    <Tooltip contentStyle={ttS} formatter={(v) => [v.toLocaleString(), "Reach"]} />
                    <Bar dataKey="reach" radius={[0, 3, 3, 0]} name="Reach">
                      {platformReach.map((p, i) => <Cell key={i} fill={p.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        </SecWrap>
      )}

      {platforms.length > 0 && (
        <SecWrap title="Platform Breakdown">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {platforms.map((p, i) => (
              <div key={i} style={{ flex: 1, minWidth: 160, background: C.white, border: `1px solid ${C.bd}`,
                borderRadius: 10, padding: "16px 18px", boxShadow: C.sh }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.t, fontFamily: FS }}>{p.name}</span>
                </div>
                {p.followers != null && (
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 10, color: C.tl, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: F }}>Followers</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: C.t, fontFamily: FS }}>{Number(p.followers).toLocaleString()}</div>
                  </div>
                )}
                {p.growth != null && <div style={{ fontSize: 12, color: C.g, fontWeight: 700, fontFamily: F }}>+{Number(p.growth).toLocaleString()} new</div>}
                {p.views  != null && <div style={{ fontSize: 12, color: C.tl, fontFamily: F, marginTop: 4 }}>{p.name === "YouTube" ? "Views" : "Reach"}: {Number(p.views).toLocaleString()}</div>}
                {p.posts  != null && <div style={{ fontSize: 12, color: C.tl, fontFamily: F }}>Videos: {p.posts}</div>}
              </div>
            ))}
          </div>
        </SecWrap>
      )}

      {(d.yt_total_views != null || d.yt_month_likes != null) && (
        <SecWrap title="YouTube Highlights">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {d.yt_total_views    != null && <KpiCard label="Total Channel Views" value={fmt(d.yt_total_views)} />}
            {d.yt_month_likes    != null && <KpiCard label="Monthly Likes"       value={fmt(d.yt_month_likes)} />}
            {d.yt_month_comments != null && <KpiCard label="Monthly Comments"    value={fmt(d.yt_month_comments)} />}
          </div>
        </SecWrap>
      )}

      {d.top_video && (
        <SecWrap title="Top Performing Video">
          <div style={{ background: C.cyanL, border: `1px solid #a5f3fc`, borderRadius: 10,
            padding: "14px 20px", fontFamily: F, fontSize: 14, fontWeight: 700, color: C.navy }}>
            🎬 {d.top_video}{d.top_video_views ? ` — ${Number(d.top_video_views).toLocaleString()} views` : ""}
          </div>
        </SecWrap>
      )}

      {(d.ig_impressions != null || d.ig_profile_views != null) && (
        <SecWrap title="Instagram Details">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {d.ig_impressions   != null && <KpiCard label="IG Impressions"   value={fmt(d.ig_impressions)} />}
            {d.ig_profile_views != null && <KpiCard label="IG Profile Views" value={fmt(d.ig_profile_views)} />}
          </div>
        </SecWrap>
      )}

      {(d.tiktok_views != null || d.tiktok_likes != null) && (
        <SecWrap title="TikTok Highlights">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {d.tiktok_views != null && <KpiCard label="TikTok Views" value={fmt(d.tiktok_views)} />}
            {d.tiktok_likes != null && <KpiCard label="TikTok Likes" value={fmt(d.tiktok_likes)} />}
            {d.tiktok_profile_views != null && <KpiCard label="TikTok Profile Views" value={fmt(d.tiktok_profile_views)} />}
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
function EmailPage({ d, cd }) {
  if (!d) return <NoData label="Email data" />;
  return (
    <div>
      <SecWrap title="Monthly Summary">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Campaigns Sent"        value={fmt(d.campaigns_sent)}   tip="Total campaigns deployed this month." />
          <KpiCard label="Total Recipients"       value={fmt(d.total_recipients)} tip="Total emails delivered." />
          {d.avg_open_rate != null && (
            <KpiCard label="Avg Open Rate" color={C.cyanD}
              value={parseFloat(d.avg_open_rate).toFixed(1) + "%"}
              change={pct(d.avg_open_rate, cd.avg_open_rate)}
              tip="Average open rate. Industry avg: 20–25%." sub="Industry avg 20–25%" />
          )}
          {d.avg_click_rate != null && (
            <KpiCard label="Avg Click Rate" color={C.g}
              value={parseFloat(d.avg_click_rate).toFixed(1) + "%"}
              change={pct(d.avg_click_rate, cd.avg_click_rate)}
              tip="Average click rate. Industry avg: 2–4%." sub="Industry avg 2–4%" />
          )}
          <KpiCard label="Site Visits from Email" color={C.cyanD}
            value={fmt(d.site_visits)}
            change={pct(d.site_visits, cd.site_visits)}
            tip="GA4 sessions from email campaigns via UTM links." />
          {d.conversions != null && (
            <KpiCard label="Conversions from Email" color={C.g}
              value={fmt(d.conversions)}
              change={pct(d.conversions, cd.conversions)} />
          )}
        </div>
      </SecWrap>

      {(d.unsubscribe_rate != null || d.list_size != null) && (
        <SecWrap title="List Health">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {d.list_size        != null && <KpiCard label="List Size"         value={fmt(d.list_size)} tip="Total active email subscribers." />}
            {d.unsubscribe_rate != null && <KpiCard label="Unsubscribe Rate"  value={parseFloat(d.unsubscribe_rate).toFixed(2) + "%"} tip="Under 0.5% is healthy." sub="Healthy: under 0.5%" invert change={pct(d.unsubscribe_rate, cd.unsubscribe_rate)} />}
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
          {d.videos        != null && <KpiCard label="Videos"                value={fmt(d.videos)}        color={C.cyanD} />}
          {d.graphics      != null && <KpiCard label="Graphics / Statics"    value={fmt(d.graphics)} />}
          {d.banners       != null && <KpiCard label="Banners"               value={fmt(d.banners)} />}
          {d.print         != null && <KpiCard label="Print Pieces"          value={fmt(d.print)} />}
          {d.ad_creative   != null && <KpiCard label="Ad Creative Sets"      value={fmt(d.ad_creative)}   tip="Display, search, and social ad graphics." />}
          {d.email_headers != null && <KpiCard label="Email Headers"         value={fmt(d.email_headers)} />}
        </div>
      </SecWrap>
      <WorkDone text={d.work_completed} />
      <NextMonth text={d.next_month} />
    </div>
  );
}

/* ─── DISABLED / NO ACCESS ─── */
const DisabledDept = ({ label }) => (
  <div style={{ padding: "60px 24px", textAlign: "center", color: C.tl, fontFamily: F }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>🚫</div>
    <div style={{ fontSize: 15, fontWeight: 600, color: C.t }}>{label}</div>
    <div style={{ fontSize: 13, marginTop: 6 }}>This service isn't active for this client.</div>
  </div>
);

/* ─── LOGIN ─── */
function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F }}>
      <div style={{ background: C.white, borderRadius: 16, padding: "48px 40px", width: "100%",
        maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", textAlign: "center" }}>
        <img src="/Taggart_Advertising_Logo.png" alt="Taggart Advertising" style={{ height: 56, width: "auto", marginBottom: 24 }} />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.navy, margin: "0 0 6px", fontFamily: FS }}>Client Portal</h1>
        <p style={{ fontSize: 13, color: C.tl, margin: "0 0 28px", fontFamily: F }}>Sign in to view your report.</p>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: `1px solid ${C.bd}`,
            fontSize: 14, fontFamily: F, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: `1px solid ${C.bd}`,
            fontSize: 14, fontFamily: F, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
        {error && <p style={{ fontSize: 12, color: C.r, margin: "0 0 10px", fontFamily: F }}>{error}</p>}
        <button onClick={handleLogin} disabled={loading}
          style={{ width: "100%", padding: "13px", background: C.navy, color: "#fff",
            border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </div>
    </div>
  );
}

/* ─── DATE PICKER COMPONENT ─── */
function DatePicker({ preset, setPreset, customStart, setCustomStart, customEnd, setCustomEnd, rangeLabel, open, setOpen }) {
  const PRESETS = [
    { id: "last_month",      label: "Last Month" },
    { id: "current_quarter", label: "Current Quarter" },
    { id: "last_quarter",    label: "Last Quarter" },
    { id: "ytd",             label: "Year to Date" },
    { id: "last_year",       label: "Last Year" },
    { id: "custom",          label: "Custom Range…" },
  ];

  // Build month/year options for custom pickers (last 3 years)
  const now = new Date();
  const monthYearOpts = [];
  for (let i = 0; i < 36; i++) {
    let m = now.getMonth() - i;
    let y = now.getFullYear();
    while (m < 0) { m += 12; y--; }
    monthYearOpts.push({ label: `${MONTHS[m].slice(0, 3)} ${y}`, year: y, month: m + 1 });
  }

  const selStyle = {
    padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.bd}`,
    fontSize: 12, fontFamily: F, fontWeight: 600, color: C.t,
    background: C.white, cursor: "pointer", outline: "none",
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ background: "#f0f2f5", border: `1px solid ${C.bd}`, borderRadius: 8, padding: "7px 14px",
          color: C.t, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: F }}>
        📅 {rangeLabel} <span style={{ fontSize: 10, color: C.tl }}>▼</span>
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: C.white,
          border: `1px solid ${C.bd}`, borderRadius: 12, padding: "8px 0", zIndex: 300,
          width: 240, boxShadow: "0 8px 30px rgba(0,0,0,0.14)" }}>

          {/* Preset options */}
          {PRESETS.map(p => (
            <button key={p.id}
              onClick={() => { setPreset(p.id); if (p.id !== "custom") setOpen(false); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", textAlign: "left", padding: "9px 16px", border: "none", cursor: "pointer",
                background: preset === p.id ? C.cyanL : "transparent",
                color: preset === p.id ? C.cyanD : C.t,
                fontSize: 13, fontWeight: 600, fontFamily: F }}>
              {p.label}
              {preset === p.id && <span style={{ fontSize: 11, color: C.cyanD }}>✓</span>}
            </button>
          ))}

          {/* Custom range UI */}
          {preset === "custom" && (
            <div style={{ margin: "10px 16px 8px", padding: "12px", background: "#f8fafc",
              borderRadius: 8, border: `1px solid ${C.bd}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.tl, textTransform: "uppercase",
                letterSpacing: "0.06em", fontFamily: F, marginBottom: 8 }}>Select Range</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.tl, fontFamily: F, marginBottom: 3 }}>Start</div>
                  <select
                    value={`${customStart.year}-${customStart.month}`}
                    onChange={e => {
                      const [y, m] = e.target.value.split("-").map(Number);
                      setCustomStart({ year: y, month: m });
                      // Auto-correct end if before start
                      if (customEnd.year < y || (customEnd.year === y && customEnd.month < m)) {
                        setCustomEnd({ year: y, month: m });
                      }
                    }}
                    style={selStyle}>
                    {monthYearOpts.map((o, i) => (
                      <option key={i} value={`${o.year}-${o.month}`}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.tl, fontFamily: F, marginBottom: 3 }}>End</div>
                  <select
                    value={`${customEnd.year}-${customEnd.month}`}
                    onChange={e => {
                      const [y, m] = e.target.value.split("-").map(Number);
                      setCustomEnd({ year: y, month: m });
                    }}
                    style={selStyle}>
                    {monthYearOpts
                      .filter(o => o.year > customStart.year || (o.year === customStart.year && o.month >= customStart.month))
                      .map((o, i) => (
                        <option key={i} value={`${o.year}-${o.month}`}>{o.label}</option>
                      ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ marginTop: 10, width: "100%", padding: "7px", background: C.cyanD,
                  color: "#fff", border: "none", borderRadius: 6, fontSize: 12,
                  fontWeight: 700, cursor: "pointer", fontFamily: F }}>
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── ROOT APP ─── */
export default function App() {
  const [session, setSession]               = useState(null);
  const [authLoading, setAuthLoading]       = useState(true);
  const [clients, setClients]               = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTab, setActiveTab]           = useState("dashboard");
  const [clientMenuOpen, setClientMenuOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Date range state
  const { month: lcm, year: lcy } = getLastComplete();
  const [preset, setPreset]           = useState("last_month");
  const [customStart, setCustomStart] = useState({ year: lcy, month: lcm });
  const [customEnd, setCustomEnd]     = useState({ year: lcy, month: lcm });

  // Comparison
  const [compIdx, setCompIdx] = useState(0);

  // Report data
  const [reportData, setReportData]   = useState({});
  const [compData, setCompData]       = useState([{}, {}]);
  const [services, setServices]       = useState({});
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError]     = useState(null);
  const [trendData, setTrendData]     = useState({});

  // Derived range (recomputed on every render when deps change — stable because preset/custom are primitives)
  const range       = getMonthRange(preset, customStart, customEnd);
  const [cr0, cr1]  = getCompRanges(range);
  const rangeKey    = range.map(toMonthStr).join(",");
  const rangeLabel  = presetLabel(preset, range);
  const compLabels  = [`vs ${rangeToLabel(cr0)}`, `vs ${rangeToLabel(cr1)}`];

  /* Auth */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => { setSession(s); setAuthLoading(false); });
    return () => subscription.unsubscribe();
  }, []);

  /* Load clients */
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
          if (ai !== -1) return -1;
          if (bi !== -1) return 1;
          return a.name.localeCompare(b.name);
        });
        setClients(sorted);
        if (sorted.length > 0) setSelectedClient(sorted[0]);
      }
      setClientsLoading(false);
    };
    fetchClients();
  }, [session]);

  /* Load report + comparison data whenever client or range changes */
  useEffect(() => {
    if (!selectedClient) return;
    const load = async () => {
      setDataLoading(true);
      setDataError(null);
      try {

      // Always fetch last 12 months for trend charts (regardless of selected range)
      const nowD = new Date();
      const trendMonths = Array.from({ length: 12 }, (_, i) => {
        let m = nowD.getMonth() - 11 + i;
        let y = nowD.getFullYear();
        while (m < 0) { m += 12; y--; }
        return { year: y, month: m + 1 };
      });

      // Collect all unique months: range + comp ranges + trend
      const allMonths = [...range, ...cr0, ...cr1, ...trendMonths];
      const unique = [...new Map(allMonths.map(m => [toMonthStr(m), m])).values()];
      const monthStrs = unique.map(toMonthStr);

      const [{ data: allRows }, { data: svcRows }] = await Promise.all([
        supabase.from("report_data")
          .select("department, data, month")
          .eq("client_id", selectedClient.id)
          .in("month", monthStrs),
        supabase.from("client_services")
          .select("department, enabled")
          .eq("client_id", selectedClient.id),
      ]);

      // Index rows by month string → dept → data
      // Normalize r.month to "YYYY-MM-DD" to handle both date and timestamptz returns
      const byMonth = {};
      (allRows || []).forEach(r => {
        const key = typeof r.month === "string" ? r.month.substring(0, 10) : toMonthStr(r);
        if (!byMonth[key]) byMonth[key] = {};
        byMonth[key][r.department] = r.data || {};
      });

      setReportData(aggregateRange(range, byMonth));
      setCompData([aggregateRange(cr0, byMonth), aggregateRange(cr1, byMonth)]);

      // Build per-dept trend arrays (chronological, 12 months)
      const TREND_DEPTS = ["seo", "gbp", "google_ads", "meta_ads", "social", "callrail", "leads"];
      const builtTrend = {};
      TREND_DEPTS.forEach(dept => {
        builtTrend[dept] = trendMonths.map(({ year, month }) => {
          const key = toMonthStr({ year, month });
          const d = byMonth[key]?.[dept] || {};
          return { label: MONTHS[month - 1].slice(0, 3), year, month, ...d };
        });
      });
      setTrendData(builtTrend);

      const svcMap = {};
      (svcRows || []).forEach(r => { svcMap[r.department] = r.enabled; });
      setServices(svcMap);

        setDataLoading(false);
      } catch (err) {
        console.error("Report data load error:", err);
        setDataError(err.message || "Failed to load report data.");
        setDataLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient?.id, rangeKey]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null); setClients([]); setSelectedClient(null);
  };

  const closeMenus  = () => { setClientMenuOpen(false); setDatePickerOpen(false); };
  const groups      = [...new Set(clients.map(c => c.group_name))];
  const svcEnabled  = (dept) => services[dept] !== false;
  const cd          = compData[compIdx] || {};

  const renderPage = () => {
    if (dataError) return (
      <div style={{ padding: "40px 24px", textAlign: "center", color: C.r, fontFamily: F }}>
        <div style={{ fontSize: 24, marginBottom: 10 }}>⚠️</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Error loading report data</div>
        <div style={{ fontSize: 12, color: C.tl, marginTop: 6, fontFamily: "monospace" }}>{dataError}</div>
      </div>
    );
    if (dataLoading) return (
      <div style={{ padding: "60px 24px", textAlign: "center", color: C.tl, fontFamily: F }}>
        <div style={{ fontSize: 13 }}>Loading…</div>
      </div>
    );
    switch (activeTab) {
      case "dashboard":  return <Dashboard data={reportData} cd={cd} services={services} clientName={selectedClient?.name} leadTrend={trendData.leads || []} />;
      case "seo":        return svcEnabled("seo")        ? <SeoPage       d={reportData.seo}        cd={cd.seo        || {}} trend={trendData.seo        || []} /> : <DisabledDept label="SEO" />;
      case "gbp":        return svcEnabled("gbp")        ? <GbpPage       d={reportData.gbp}        cd={cd.gbp        || {}} trend={trendData.gbp        || []} clientName={selectedClient?.name} /> : <DisabledDept label="Google Business Profile" />;
      case "google_ads": return svcEnabled("google_ads") ? <GoogleAdsPage d={reportData.google_ads} cd={cd.google_ads || {}} trend={trendData.google_ads || []} /> : <DisabledDept label="Google Ads" />;
      case "meta_ads":   return svcEnabled("meta_ads")   ? <MetaAdsPage   d={reportData.meta_ads}   cd={cd.meta_ads   || {}} trend={trendData.meta_ads   || []} /> : <DisabledDept label="Meta Ads" />;
      case "social":     return svcEnabled("social")     ? <SocialPage    d={reportData.social}     cd={cd.social     || {}} trend={trendData.social     || []} /> : <DisabledDept label="Organic Social" />;
      case "email":      return svcEnabled("email")      ? <EmailPage     d={reportData.email}      cd={cd.email      || {}} /> : <DisabledDept label="Email" />;
      case "creative":   return svcEnabled("creative")   ? <CreativePage  d={reportData.creative} />                          : <DisabledDept label="Creative" />;
      default:           return <Dashboard data={reportData} cd={cd} services={services} />;
    }
  };

  /* ── Loading / auth states ── */
  const loadingScreen = (msg) => (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#fff", fontFamily: F, fontSize: 16 }}>{msg}</div>
    </div>
  );

  if (authLoading)    return loadingScreen("Loading…");
  if (!session)       return <LoginPage />;
  if (clientsLoading) return loadingScreen("Loading clients…");
  if (clients.length === 0) return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.white, borderRadius: 16, padding: "48px 40px", maxWidth: 400, textAlign: "center", fontFamily: F }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2 style={{ color: C.navy, fontFamily: FS }}>No Access</h2>
        <p style={{ color: C.tl, fontFamily: F }}>Your account doesn't have access to any clients. Contact Taggart Advertising.</p>
        <button onClick={handleLogout} style={{ marginTop: 16, padding: "10px 24px", background: C.navy, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: F }}>Sign Out</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: F, background: C.bg }}>

      {/* ── HEADER ── */}
      <div style={{ background: C.white, padding: "0 24px", height: 64, display: "flex", alignItems: "center",
        justifyContent: "space-between", borderBottom: `1px solid ${C.bd}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", flexShrink: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/Taggart_Advertising_Logo.png" alt="Taggart" style={{ height: 44, width: "auto" }} />
          <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 22, color: C.navy, letterSpacing: "-0.5px" }}>TAGGART</span>
          <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 22, color: C.cyan, letterSpacing: "-0.5px" }}>ADVERTISING</span>

          {clients.length > 1 && (
            <>
              <div style={{ width: 1, height: 30, background: C.bd, margin: "0 6px" }} />
              <div style={{ position: "relative" }}>
                <button onClick={() => { setClientMenuOpen(!clientMenuOpen); setDatePickerOpen(false); }}
                  style={{ background: "#f0f2f5", border: `1px solid ${C.bd}`, borderRadius: 8, padding: "7px 14px",
                    color: C.t, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: F }}>
                  {selectedClient?.name} <span style={{ fontSize: 10, color: C.tl }}>▼</span>
                </button>
                {clientMenuOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, background: C.white,
                    border: `1px solid ${C.bd}`, borderRadius: 10, padding: "6px 0", zIndex: 200,
                    width: 260, maxHeight: 400, overflowY: "auto", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}>
                    {groups.map(g => (
                      <div key={g}>
                        <div style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: F }}>{g}</div>
                        {clients.filter(c => c.group_name === g).map(c => (
                          <button key={c.id} onClick={() => { setSelectedClient(c); setClientMenuOpen(false); setActiveTab("dashboard"); }}
                            style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", border: "none", cursor: "pointer",
                              background: c.id === selectedClient?.id ? C.cyanL : "transparent",
                              color: c.id === selectedClient?.id ? C.cyanD : C.t,
                              fontSize: 13, fontWeight: 600, fontFamily: F }}>
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
          <span style={{ fontSize: 12, color: C.tl, fontFamily: F }}>{session?.user?.email}</span>

          {/* Date range picker */}
          <DatePicker
            preset={preset} setPreset={setPreset}
            customStart={customStart} setCustomStart={setCustomStart}
            customEnd={customEnd} setCustomEnd={setCustomEnd}
            rangeLabel={rangeLabel}
            open={datePickerOpen} setOpen={(v) => { setDatePickerOpen(v); if (v) setClientMenuOpen(false); }}
          />

          <button onClick={handleLogout}
            style={{ background: "#f0f2f5", border: `1px solid ${C.bd}`, borderRadius: 8,
              padding: "7px 14px", color: C.t, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.bd}`, padding: "0 24px",
        display: "flex", overflowX: "auto", flexShrink: 0, zIndex: 40 }}>
        {DEPT_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: "11px 16px", border: "none", cursor: "pointer", background: "transparent",
              fontSize: 13, fontWeight: 600, fontFamily: F,
              color: activeTab === t.id ? C.cyanD : C.tl,
              borderBottom: activeTab === t.id ? `2.5px solid ${C.cyan}` : "2.5px solid transparent",
              whiteSpace: "nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── COMPARISON BAR ── */}
      <div style={{ background: "rgba(230,249,252,0.92)", padding: "7px 24px", borderBottom: `1px solid #b2e9f5`,
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: C.cyanD, fontFamily: F, fontWeight: 700 }}>📊 Comparing:</span>
        {compLabels.map((label, i) => (
          <button key={i} onClick={() => setCompIdx(i)}
            style={{ fontSize: 12, fontFamily: F, fontWeight: 600, padding: "4px 12px", borderRadius: 6, cursor: "pointer",
              background: compIdx === i ? C.cyanD : C.white,
              color: compIdx === i ? "#fff" : C.t,
              border: `1px solid ${compIdx === i ? C.cyanD : C.bd}` }}>
            {label}
          </button>
        ))}
        <span style={{ fontSize: 11, color: C.tl, fontFamily: F, marginLeft: 4 }}>
          Arrows appear once comparison period data is entered.
        </span>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, padding: "24px 24px", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" }}
        onClick={closeMenus}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.t, margin: 0, fontFamily: FS }}>{selectedClient?.name}</h1>
          <p style={{ fontSize: 13, color: C.tl, margin: "3px 0 0", fontFamily: F }}>Performance Report — {rangeLabel}</p>
        </div>
        {renderPage()}
      </div>

      {/* ── FOOTER ── */}
      <div style={{ padding: "18px 24px", textAlign: "center", background: C.white, borderTop: `1px solid ${C.bd}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <img src="/Taggart_Advertising_Logo.png" alt="Taggart" style={{ height: 28, width: "auto" }} />
          <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 15, color: C.navy }}>TAGGART</span>
          <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 15, color: C.cyan }}>ADVERTISING</span>
        </div>
        <p style={{ fontSize: 11, color: C.tl, margin: "6px 0 0", fontFamily: F }}>Confidential client report — {rangeLabel}</p>
      </div>
    </div>
  );
}
