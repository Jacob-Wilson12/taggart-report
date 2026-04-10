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
const DEPT_ACCENT = { seo: "#2563EB", gbp: "#059669", google_ads: "#D97706", meta_ads: "#7C3AED", social: "#E1306C", email: "#0891B2", creative: "#8b5cf6" };

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

const GBP_MULTI_LISTINGS = {
  "Goode Motor Ford": [
    { key: "ford",     label: "Goode Motor Ford",    color: "#1d4ed8" },
    { key: "overland", label: "Goode Motor Overland", color: "#059669" },
  ],
};

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
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const sec = Math.round(n % 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};
const lines = (str) => str ? str.split("\n").map(l => l.trim()).filter(Boolean) : [];
const pct = (curr, prev) => {
  const c = Number(curr), p = Number(prev);
  if (!curr || !prev || isNaN(c) || isNaN(p) || p === 0) return undefined;
  return Math.round(((c - p) / p) * 1000) / 10;
};

/* ─── DATE RANGE UTILITIES ─── */
function getLastComplete() {
  const now = new Date();
  const m0  = now.getMonth();
  if (m0 === 0) return { month: 12, year: now.getFullYear() - 1 };
  return { month: m0, year: now.getFullYear() };
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
  const curM = now.getMonth() + 1;
  switch (preset) {
    case "last_month": return [{ year: lcy, month: lcm }];
    case "current_quarter": {
      const q = getQuarter(curM), qs = qStart(q);
      const endM = Math.min(lcm, qEnd(q)), endY = curY;
      if (qs > endM && curY === lcy) return [{ year: lcy, month: lcm }];
      return buildRange(curY, qs, endY, endM);
    }
    case "last_quarter": {
      const q = getQuarter(curM), prevQ = q === 1 ? 4 : q - 1, prevY = q === 1 ? curY - 1 : curY;
      return buildRange(prevY, qStart(prevQ), prevY, qEnd(prevQ));
    }
    case "ytd":       return buildRange(curY, 1, lcy, lcm);
    case "last_year": return buildRange(curY - 1, 1, curY - 1, 12);
    case "custom": {
      const { year: sy, month: sm } = customStart, { year: ey, month: em } = customEnd;
      if (ey < sy || (ey === sy && em < sm)) return [customStart];
      return buildRange(sy, sm, ey, em);
    }
    default: return [{ year: lcy, month: lcm }];
  }
}
function shiftRange(range, months) {
  return range.map(({ year, month }) => {
    let m = month + months, y = year;
    while (m <= 0) { m += 12; y--; }
    while (m > 12) { m -= 12; y++; }
    return { year: y, month: m };
  });
}
function getCompRanges(range) {
  return [shiftRange(range, -range.length), shiftRange(range, -12)];
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
  switch (preset) {
    case "last_month":        return rangeToLabel(range);
    case "current_quarter": { const q = getQuarter(range[range.length - 1].month); return `Q${q} ${range[0].year} (to date)`; }
    case "last_quarter":    { const q = getQuarter(range[0].month); return `Q${q} ${range[0].year}`; }
    case "ytd":               return `YTD ${range[0].year}`;
    case "last_year":         return `${range[0].year} (Full Year)`;
    case "custom":            return rangeToLabel(range);
    default:                  return rangeToLabel(range);
  }
}
function toMonthStr({ year, month }) {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/* ─── AGGREGATION ENGINE ─── */
const SUM_FIELDS = {
  seo:        ["organic_sessions","total_sessions","impressions","vdp_views","phone_calls","form_submissions","direction_requests","chat_conversations","site_visits_from_email"],
  gbp:        ["profile_views","search_appearances","map_views","website_clicks","phone_calls","direction_requests","new_reviews"],
  google_ads: ["conversions","total_spend","impressions","clicks"],
  meta_ads:   ["conversions","total_spend","reach","impressions"],
  social:     ["fb_visits","ig_reach","tiktok_profile_views","fb_engagement","ig_engagement","tiktok_likes","fb_new_followers","ig_new_followers","total_published","fb_published","ig_published","yt_long_form_published","yt_shorts_published","tiktok_published","web_clicks","yt_month_views","yt_month_videos","yt_month_likes","yt_month_comments","tiktok_views","fb_followers","ig_followers","yt_followers","tiktok_followers"],
  callrail:   ["total_calls","website_calls","ads_calls","gbp_calls"],
  leads:      ["total_leads","website_leads","third_party","facebook_leads","total_sold","website_sold","third_party_sold","facebook_sold",
               "ford_leads","ford_sold","mazda_leads","mazda_sold","vw_leads","vw_sold","oem_leads","oem_sold"],
  email:      ["campaigns_sent","audience_size"],
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
  email:      [],
  creative:   [],
};

function aggregateDept(dataArr, dept) {
  if (!dataArr.length) return {};
  if (dataArr.length === 1) return dataArr[0];
  const result = { ...dataArr[dataArr.length - 1] };
  (SUM_FIELDS[dept] || []).forEach(f => {
    const total = dataArr.reduce((acc, d) => acc + (Number(d[f]) || 0), 0);
    result[f] = total > 0 ? total : null;
  });
  (AVG_FIELDS[dept] || []).forEach(f => {
    const vals = dataArr.map(d => d[f]).filter(v => v != null && !isNaN(Number(v)));
    result[f] = vals.length ? vals.reduce((a, b) => a + Number(b), 0) / vals.length : null;
  });
  if (["google_ads","meta_ads"].includes(dept) && result.total_spend && result.conversions)
    result.cost_per_lead = Number(result.total_spend) / Number(result.conversions);
  if (dept === "google_ads" && result.total_spend && result.clicks)
    result.cpc = Number(result.total_spend) / Number(result.clicks);
  return result;
}

function aggregateRange(range, byMonth) {
  const allDepts = new Set();
  range.forEach(m => { const key = toMonthStr(m); Object.keys(byMonth[key] || {}).forEach(d => allDepts.add(d)); });
  const result = {};
  allDepts.forEach(dept => {
    const rows = range.map(m => byMonth[toMonthStr(m)]?.[dept]).filter(Boolean);
    result[dept] = aggregateDept(rows, dept);
  });
  return result;
}

/* ─── SHARED COMPONENTS ─── */
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

function SH({ title, sub, style: s }) {
  return (
    <div style={{ marginBottom: 10, paddingLeft: 12, borderLeft: `3px solid ${C.cyan}`, ...s }}>
      <h2 style={{ fontSize: 11, fontWeight: 700, color: C.tl, margin: 0, fontFamily: F, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</h2>
      {sub && <p style={{ fontSize: 11, color: C.tl, margin: "2px 0 0", fontFamily: F, fontWeight: 400 }}>{sub}</p>}
    </div>
  );
}

function KpiCard({ label, value, sub, color, tip, change, invert, prior }) {
  const hasPrior = prior !== null && prior !== undefined && prior !== "";
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.bd}`, borderRadius: 10,
      padding: "12px 16px", flex: 1, minWidth: 130, boxShadow: C.sh, textAlign: "left",
    }}>
      <div style={{ fontSize: 10, color: C.tl, fontWeight: 700, marginBottom: 4,
        textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: F,
        display: "flex", alignItems: "center" }}>
        {label}{tip && <Tip text={tip} />}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: color || C.t, fontFamily: FS, lineHeight: 1.1 }}>
          {value || "—"}
        </div>
        {change !== undefined && <Arr v={change} invert={invert} sz={11} />}
      </div>
      {hasPrior && <div style={{ fontSize: 10, color: C.tl, marginTop: 2, fontFamily: F }}>vs {typeof prior === "number" ? prior.toLocaleString() : prior}</div>}
      {sub && !hasPrior && <div style={{ fontSize: 11, color: C.tl, marginTop: 2, fontFamily: F }}>{sub}</div>}
    </div>
  );
}

/* ─── BM: metric pill inside DeptCard ─── */
function BM({ l, v, pre = "", suf = "", change, invert, prior }) {
  const display = (v === null || v === undefined || v === "")
    ? "—"
    : `${pre}${typeof v === "number" ? v.toLocaleString() : v}${suf}`;
  const hasPrior = prior !== null && prior !== undefined && prior !== "";
  const priorDisplay = hasPrior
    ? `${pre}${typeof prior === "number" ? Number(prior).toLocaleString() : prior}${suf}`
    : null;
  return (
    <div style={{ flex: 1, minWidth: 100, textAlign: "center", padding: "12px 8px" }}>
      <div style={{ fontSize: 10, color: C.tl, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4, fontFamily: F }}>
        {l}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: C.t, fontFamily: FS, lineHeight: 1.1, marginBottom: 3 }}>
        {display}
      </div>
      {change !== undefined && <Arr v={change} invert={invert} sz={11} />}
      {priorDisplay && change === undefined && (
        <div style={{ fontSize: 10, color: C.tl, fontFamily: F, marginTop: 2 }}>
          was {priorDisplay}
        </div>
      )}
      {priorDisplay && change !== undefined && (
        <div style={{ fontSize: 10, color: C.tl, fontFamily: F, marginTop: 2 }}>
          vs {priorDisplay}
        </div>
      )}
    </div>
  );
}

function BlueCard({ icon, label, badge, children, onClick, accent = C.cyan }) {
  if (badge) {
    /* ── No data state: dashed border, light background ── */
    return (
      <div onClick={onClick} style={{
        background: C.white, borderRadius: 12, padding: "18px 22px",
        border: `1px dashed ${C.bd}`, borderLeft: `3px dashed ${accent}`,
        overflow: "hidden", boxShadow: C.sh,
        cursor: onClick ? "pointer" : "default",
        opacity: 0.8,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.t, fontFamily: FS }}>{label}</span>
          </div>
          {onClick && <span style={{ fontSize: 11, color: C.cyanD, fontWeight: 600, fontFamily: F }}>View details →</span>}
        </div>
        <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.tl, fontFamily: F }}>
            No data for this period yet
          </span>
        </div>
      </div>
    );
  }

  /* ── Normal state: white card with colored left accent ── */
  return (
    <div onClick={onClick} style={{
      background: C.white, borderRadius: 12, padding: "18px 22px",
      border: `1px solid ${C.bd}`, borderLeft: `3px solid ${accent}`,
      overflow: "hidden", boxShadow: C.sh,
      cursor: onClick ? "pointer" : "default",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.t, fontFamily: FS }}>{label}</span>
      </div>
      {children}
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

function HeroMetric({ icon, label, value, change, invert, sub, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 0", marginBottom: 8 }}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.tl, fontFamily: F, marginBottom: 2 }}>{label}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 48, fontWeight: 700, color: color || C.t, fontFamily: FS, lineHeight: 1 }}>{value || "—"}</span>
          {change !== undefined && <Arr v={change} invert={invert} sz={14} />}
        </div>
        {sub && <div style={{ fontSize: 12, color: C.tl, fontFamily: F, marginTop: 2 }}>{sub}</div>}
      </div>
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

function EmptyPlaceholder({ text }) {
  return (
    <div style={{ padding: "16px 14px", fontSize: 13, fontFamily: F, color: C.tl, fontStyle: "italic", background: "#f8fafc", borderRadius: 8, border: `1px dashed ${C.bd}` }}>
      {text || "Nothing entered yet."}
    </div>
  );
}

function WinsLosses({ wins, losses }) {
  const w = lines(wins), l = lines(losses);
  return (
    <SecWrap title="Wins & Watch Items">
      {(!w.length && !l.length) ? <EmptyPlaceholder text="No wins or watch items entered for this period." /> : (
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
      )}
    </SecWrap>
  );
}

function WorkDone({ text }) {
  const items = lines(text);
  return (
    <SecWrap title="Work Completed This Month">
      {!items.length ? <EmptyPlaceholder text="No work items entered for this period." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((it, i) => (
            <div key={i} style={{ background: "#f8fafc", border: `1px solid ${C.bd}`, borderRadius: 8,
              padding: "10px 14px", fontSize: 13, fontFamily: F, display: "flex", alignItems: "flex-start", gap: 8, lineHeight: 1.5 }}>
              <span style={{ color: C.cyanD, fontWeight: 700, flexShrink: 0 }}>✓</span>{it}
            </div>
          ))}
        </div>
      )}
    </SecWrap>
  );
}

function NextMonth({ text }) {
  const items = lines(text);
  return (
    <SecWrap title="What's Coming Next Month">
      {!items.length ? <EmptyPlaceholder text="No upcoming items entered yet." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10,
              fontSize: 13, fontFamily: F, padding: "8px 12px", background: "#f8fafc",
              borderRadius: 8, border: `1px solid ${C.bd}`, lineHeight: 1.5 }}>
              <span style={{ color: C.cyan, fontWeight: 700, flexShrink: 0 }}>→</span>{it}
            </div>
          ))}
        </div>
      )}
    </SecWrap>
  );
}

function NoData({ label, period }) {
  return (
    <div style={{ padding: "60px 24px", textAlign: "center", color: C.tl, fontFamily: F, fontSize: 14 }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
      No {label || "data"} reported{period ? ` for ${period}` : " for this period"} yet.
    </div>
  );
}

/* ─── BUDGET PACING BAR ─── */
function BudgetPacingBar({ spend, budget }) {
  if (!spend || !budget || Number(budget) === 0) return null;
  const spendN  = Number(spend);
  const budgetN = Number(budget);
  const spendPct = Math.min(Math.round((spendN / budgetN) * 100), 100);
  const color = spendPct >= 85 ? C.g : spendPct >= 60 ? C.o : C.r;
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.bl2}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontSize: 10, color: C.tl, fontFamily: F, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Budget Pacing</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: F }}>{spendPct}%</span>
      </div>
      <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${spendPct}%`, background: color, borderRadius: 3, transition: "width 0.6s" }} />
      </div>
      <div style={{ fontSize: 10, color: C.tl, fontFamily: F, marginTop: 4 }}>
        ${spendN.toLocaleString(undefined, { maximumFractionDigits: 0 })} of ${budgetN.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
    </div>
  );
}

/* ─── MINI CHANNEL BAR (Social dashboard card) ─── */
function MiniChannelBar({ fb, ig, ytLong, ytShort, tiktok }) {
  const segs = [
    { label: "FB",      value: Number(fb)      || 0, color: "#1877F2" },
    { label: "IG",      value: Number(ig)      || 0, color: "#E1306C" },
    { label: "YT",      value: (Number(ytLong) || 0) + (Number(ytShort) || 0), color: "#FF0000" },
    { label: "TikTok",  value: Number(tiktok)  || 0, color: "#69C9D0" },
  ].filter(s => s.value > 0);
  const total = segs.reduce((a, s) => a + s.value, 0);
  if (total === 0) return null;
  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.bl2}` }}>
      <div style={{ height: 4, borderRadius: 2, overflow: "hidden", display: "flex", gap: 1, marginBottom: 5 }}>
        {segs.map(s => (
          <div key={s.label} style={{ width: `${Math.round((s.value / total) * 100)}%`, background: s.color, borderRadius: 2 }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {segs.map(s => (
          <span key={s.label} style={{ fontSize: 10, color: C.tl, fontFamily: F }}>
            {s.label} <strong style={{ color: C.tm }}>{s.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── CREATIVE BREAKDOWN BAR ─── */
function CreativeBreakdownBar({ videos, graphics, banners, adCreative, emailHeaders, print }) {
  const segs = [
    { label: "Videos",   value: Number(videos)       || 0, color: "#7C3AED" },
    { label: "Graphics", value: Number(graphics)     || 0, color: "#2563EB" },
    { label: "Banners",  value: Number(banners)      || 0, color: "#0891B2" },
    { label: "Ad Sets",  value: Number(adCreative)   || 0, color: "#059669" },
    { label: "Email",    value: Number(emailHeaders) || 0, color: "#D97706" },
    { label: "Print",    value: Number(print)        || 0, color: "#6B7280" },
  ].filter(s => s.value > 0);
  const total = segs.reduce((a, s) => a + s.value, 0);
  if (total === 0) return null;
  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.bl2}` }}>
      <div style={{ height: 5, borderRadius: 3, overflow: "hidden", display: "flex", gap: 1, marginBottom: 5 }}>
        {segs.map(s => (
          <div key={s.label} style={{ width: `${Math.round((s.value / total) * 100)}%`, background: s.color, borderRadius: 2 }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {segs.map(s => (
          <span key={s.label} style={{ fontSize: 10, color: C.tl, fontFamily: F }}>
            {s.label} <strong style={{ color: C.tm }}>{s.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── DASHBOARD ─── */
function Dashboard({ data, cd, services, clientName, leadTrend, setActiveTab, isMobile }) {
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

  // Social totals — views-based
  const totalViews     = (Number(social.yt_month_views) || 0) + (Number(social.ig_reach) || 0) + (Number(social.fb_visits) || 0) + (Number(social.tiktok_profile_views) || 0);
  const prevTotalViews = (Number(socmp.yt_month_views) || 0) + (Number(socmp.ig_reach) || 0) + (Number(socmp.fb_visits) || 0) + (Number(socmp.tiktok_profile_views) || 0);
  const totalPublished = Number(social.total_published) || 0;
  const prevPublished  = Number(socmp.total_published)  || 0;

  // SEO site visits from email (for Email card)
  const seoEmailVisits     = Number(seo.site_visits_from_email)     || null;
  const seoEmailVisitsPrev = Number(scmp.site_visits_from_email)    || null;

  // Audience size growth for email
  const audienceSize     = Number(email.audience_size)     || null;
  const audienceSizePrev = Number(ecmp.audience_size)      || null;
  const audienceGrowth   = audienceSize && audienceSizePrev ? audienceSize - audienceSizePrev : null;

  const isGoode      = clientName === GOODE_MOTOR_GROUP;
  const oemLabel     = JUNEAU_OEM_LABEL[clientName] || null;
  const leadsEnabled = services.leads !== false;

  const renderLeads = () => {
    if (!leadsEnabled) return null;
    if (isGoode) {
      return (
        <SecWrap title="Lead Summary" sub="Total leads by brand — Goode Motor Group">
          <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <KpiCard label="Total Leads"      value={fmt(leads.total_leads)} change={pct(leads.total_leads, lcmp.total_leads)} prior={lcmp.total_leads} />
            <KpiCard label="Ford Leads"       value={fmt(leads.ford_leads)}  change={pct(leads.ford_leads,  lcmp.ford_leads)} prior={lcmp.ford_leads} />
            <KpiCard label="Mazda Leads"      value={fmt(leads.mazda_leads)} change={pct(leads.mazda_leads, lcmp.mazda_leads)} prior={lcmp.mazda_leads} />
            <KpiCard label="Volkswagen Leads" value={fmt(leads.vw_leads)}    change={pct(leads.vw_leads,    lcmp.vw_leads)} prior={lcmp.vw_leads} />
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <KpiCard label="Total Sold"  value={fmt(leads.total_sold)}  color={C.g} change={pct(leads.total_sold,  lcmp.total_sold)} prior={lcmp.total_sold} />
            <KpiCard label="Ford Sold"   value={fmt(leads.ford_sold)}   change={pct(leads.ford_sold,   lcmp.ford_sold)} prior={lcmp.ford_sold} />
            <KpiCard label="Mazda Sold"  value={fmt(leads.mazda_sold)}  change={pct(leads.mazda_sold,  lcmp.mazda_sold)} prior={lcmp.mazda_sold} />
            <KpiCard label="VW Sold"     value={fmt(leads.vw_sold)}     change={pct(leads.vw_sold,     lcmp.vw_sold)} prior={lcmp.vw_sold} />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <KpiCard label="Overall Close %" value={closePct(leads.total_sold, leads.total_leads) !== null ? closePct(leads.total_sold, leads.total_leads) + "%" : "—"} color={C.cyanD} change={pct(closePct(leads.total_sold, leads.total_leads), closePct(lcmp.total_sold, lcmp.total_leads))} prior={closePct(lcmp.total_sold, lcmp.total_leads) !== null ? closePct(lcmp.total_sold, lcmp.total_leads) + "%" : null} tip="Total sold ÷ total leads" />
            <KpiCard label="Ford Close %"    value={closePct(leads.ford_sold, leads.ford_leads)   !== null ? closePct(leads.ford_sold, leads.ford_leads)   + "%" : "—"} change={pct(closePct(leads.ford_sold, leads.ford_leads),   closePct(lcmp.ford_sold, lcmp.ford_leads))} prior={closePct(lcmp.ford_sold, lcmp.ford_leads) !== null ? closePct(lcmp.ford_sold, lcmp.ford_leads) + "%" : null} />
            <KpiCard label="Mazda Close %"   value={closePct(leads.mazda_sold, leads.mazda_leads) !== null ? closePct(leads.mazda_sold, leads.mazda_leads) + "%" : "—"} change={pct(closePct(leads.mazda_sold, leads.mazda_leads), closePct(lcmp.mazda_sold, lcmp.mazda_leads))} prior={closePct(lcmp.mazda_sold, lcmp.mazda_leads) !== null ? closePct(lcmp.mazda_sold, lcmp.mazda_leads) + "%" : null} />
            <KpiCard label="VW Close %"      value={closePct(leads.vw_sold, leads.vw_leads)       !== null ? closePct(leads.vw_sold, leads.vw_leads)       + "%" : "—"} change={pct(closePct(leads.vw_sold, leads.vw_leads),       closePct(lcmp.vw_sold, lcmp.vw_leads))} prior={closePct(lcmp.vw_sold, lcmp.vw_leads) !== null ? closePct(lcmp.vw_sold, lcmp.vw_leads) + "%" : null} />
          </div>
        </SecWrap>
      );
    }
    if (oemLabel) {
      if (leads.total_leads == null) return null;
      return (
        <SecWrap title="Lead Summary" sub="Total leads across all sources">
          <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <KpiCard label="Total Leads"         value={fmt(leads.total_leads)}    change={pct(leads.total_leads,    lcmp.total_leads)} prior={lcmp.total_leads} />
            <KpiCard label="Website Leads"       value={fmt(leads.website_leads)}  change={pct(leads.website_leads,  lcmp.website_leads)} prior={lcmp.website_leads} tip="Leads from the dealership website." />
            <KpiCard label={`${oemLabel} Leads`} value={fmt(leads.oem_leads)}      change={pct(leads.oem_leads,      lcmp.oem_leads)} prior={lcmp.oem_leads} tip={`Leads from ${oemLabel} OEM sources.`} />
            <KpiCard label="Facebook Leads"      value={fmt(leads.facebook_leads)} change={pct(leads.facebook_leads, lcmp.facebook_leads)} prior={lcmp.facebook_leads} />
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <KpiCard label="Total Sold"          value={fmt(leads.total_sold)}    color={C.g} change={pct(leads.total_sold,    lcmp.total_sold)} prior={lcmp.total_sold} />
            <KpiCard label="Website Sold"        value={fmt(leads.website_sold)}  change={pct(leads.website_sold,  lcmp.website_sold)} prior={lcmp.website_sold} />
            <KpiCard label={`${oemLabel} Sold`}  value={fmt(leads.oem_sold)}      change={pct(leads.oem_sold,      lcmp.oem_sold)} prior={lcmp.oem_sold} />
            <KpiCard label="Facebook Sold"       value={fmt(leads.facebook_sold)} change={pct(leads.facebook_sold, lcmp.facebook_sold)} prior={lcmp.facebook_sold} />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <KpiCard label="Overall Close %"     value={closePct(leads.total_sold, leads.total_leads)   !== null ? closePct(leads.total_sold, leads.total_leads)   + "%" : "—"} color={C.cyanD} tip="Total sold ÷ total leads" change={pct(closePct(leads.total_sold, leads.total_leads), closePct(lcmp.total_sold, lcmp.total_leads))} prior={closePct(lcmp.total_sold, lcmp.total_leads) !== null ? closePct(lcmp.total_sold, lcmp.total_leads) + "%" : null} />
            <KpiCard label="Website Close %"     value={closePct(leads.website_sold, leads.website_leads) !== null ? closePct(leads.website_sold, leads.website_leads) + "%" : "—"} change={pct(closePct(leads.website_sold, leads.website_leads), closePct(lcmp.website_sold, lcmp.website_leads))} prior={closePct(lcmp.website_sold, lcmp.website_leads) !== null ? closePct(lcmp.website_sold, lcmp.website_leads) + "%" : null} />
            <KpiCard label={`${oemLabel} Close %`} value={closePct(leads.oem_sold, leads.oem_leads)     !== null ? closePct(leads.oem_sold, leads.oem_leads)     + "%" : "—"} change={pct(closePct(leads.oem_sold, leads.oem_leads), closePct(lcmp.oem_sold, lcmp.oem_leads))} prior={closePct(lcmp.oem_sold, lcmp.oem_leads) !== null ? closePct(lcmp.oem_sold, lcmp.oem_leads) + "%" : null} />
            <KpiCard label="Facebook Close %"    value={closePct(leads.facebook_sold, leads.facebook_leads) !== null ? closePct(leads.facebook_sold, leads.facebook_leads) + "%" : "—"} change={pct(closePct(leads.facebook_sold, leads.facebook_leads), closePct(lcmp.facebook_sold, lcmp.facebook_leads))} prior={closePct(lcmp.facebook_sold, lcmp.facebook_leads) !== null ? closePct(lcmp.facebook_sold, lcmp.facebook_leads) + "%" : null} />
          </div>
        </SecWrap>
      );
    }
    if (leads.total_leads == null) return null;
    return (
      <SecWrap title="Lead Summary" sub="Total leads across all channels">
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <KpiCard label="Total Leads"    value={fmt(leads.total_leads)}    change={pct(leads.total_leads,    lcmp.total_leads)} prior={lcmp.total_leads} />
          <KpiCard label="Website Leads"  value={fmt(leads.website_leads)}  change={pct(leads.website_leads,  lcmp.website_leads)} prior={lcmp.website_leads}  tip="Leads from the dealership website." />
          <KpiCard label="Third Party"    value={fmt(leads.third_party)}    change={pct(leads.third_party,    lcmp.third_party)} prior={lcmp.third_party}    tip="Cars.com, AutoTrader, etc." />
          <KpiCard label="Facebook Leads" value={fmt(leads.facebook_leads)} change={pct(leads.facebook_leads, lcmp.facebook_leads)} prior={lcmp.facebook_leads} />
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <KpiCard label="Total Sold"       value={fmt(leads.total_sold)}       color={C.g} change={pct(leads.total_sold,        lcmp.total_sold)} prior={lcmp.total_sold} />
          <KpiCard label="Website Sold"     value={fmt(leads.website_sold)}     change={pct(leads.website_sold,     lcmp.website_sold)} prior={lcmp.website_sold} />
          <KpiCard label="Third Party Sold" value={fmt(leads.third_party_sold)} change={pct(leads.third_party_sold, lcmp.third_party_sold)} prior={lcmp.third_party_sold} />
          <KpiCard label="Facebook Sold"    value={fmt(leads.facebook_sold)}    change={pct(leads.facebook_sold,    lcmp.facebook_sold)} prior={lcmp.facebook_sold} />
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Overall Close %"    value={closePct(leads.total_sold, leads.total_leads)         !== null ? closePct(leads.total_sold, leads.total_leads)         + "%" : "—"} color={C.cyanD} tip="Total sold ÷ total leads" change={pct(closePct(leads.total_sold, leads.total_leads), closePct(lcmp.total_sold, lcmp.total_leads))} prior={closePct(lcmp.total_sold, lcmp.total_leads) !== null ? closePct(lcmp.total_sold, lcmp.total_leads) + "%" : null} />
          <KpiCard label="Website Close %"    value={closePct(leads.website_sold, leads.website_leads)     !== null ? closePct(leads.website_sold, leads.website_leads)     + "%" : "—"} change={pct(closePct(leads.website_sold, leads.website_leads), closePct(lcmp.website_sold, lcmp.website_leads))} prior={closePct(lcmp.website_sold, lcmp.website_leads) !== null ? closePct(lcmp.website_sold, lcmp.website_leads) + "%" : null} />
          <KpiCard label="3rd Party Close %"  value={closePct(leads.third_party_sold, leads.third_party)   !== null ? closePct(leads.third_party_sold, leads.third_party)   + "%" : "—"} change={pct(closePct(leads.third_party_sold, leads.third_party), closePct(lcmp.third_party_sold, lcmp.third_party))} prior={closePct(lcmp.third_party_sold, lcmp.third_party) !== null ? closePct(lcmp.third_party_sold, lcmp.third_party) + "%" : null} />
          <KpiCard label="Facebook Close %"   value={closePct(leads.facebook_sold, leads.facebook_leads)   !== null ? closePct(leads.facebook_sold, leads.facebook_leads)   + "%" : "—"} change={pct(closePct(leads.facebook_sold, leads.facebook_leads), closePct(lcmp.facebook_sold, lcmp.facebook_leads))} prior={closePct(lcmp.facebook_sold, lcmp.facebook_leads) !== null ? closePct(lcmp.facebook_sold, lcmp.facebook_leads) + "%" : null} />
        </div>
      </SecWrap>
    );
  };

  const trendLine = leadTrend
    .filter(t => t.total_leads != null || t.total_sold != null)
    .map(t => ({ label: t.label, leads: t.total_leads != null ? Number(t.total_leads) : null, sold: t.total_sold != null ? Number(t.total_sold) : null }));

  // SEO total leads = phone_calls + form_submissions
  const seoTotalLeads     = (Number(seo.phone_calls) || 0) + (Number(seo.form_submissions) || 0) || null;
  const seoTotalLeadsPrev = (Number(scmp.phone_calls) || 0) + (Number(scmp.form_submissions) || 0) || null;

  // Check if all departments have zero data
  const allEmpty = leads.total_leads == null
    && !seo.organic_sessions && !seo.impressions
    && !gbp.phone_calls && !gbp.website_clicks
    && !gads.conversions && !gads.total_spend
    && !meta.conversions && !meta.total_spend
    && totalViews === 0 && totalPublished === 0
    && !email.campaigns_sent && !audienceSize
    && !creat.total_assets
    && !cr.total_calls;

  if (allEmpty) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", fontFamily: F }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.t, margin: "0 0 8px", fontFamily: FS }}>Your report is being prepared</h2>
        <p style={{ fontSize: 14, color: C.tl, margin: 0, maxWidth: 400, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
          Data for {clientName} hasn't been entered for this period yet. Check back soon — your marketing team is working on it.
        </p>
      </div>
    );
  }

  return (
    <>
      {renderLeads()}

      {trendLine.length >= 3 && leadsEnabled && (
        <SecWrap title="Lead & Sales Trend" sub="Month-over-month leads and sold">
          <Card style={{ marginBottom: 0 }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendLine}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.bl2} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.tl }} />
                <YAxis tick={{ fontSize: 11, fill: C.tl }} allowDecimals={false} />
                <Tooltip contentStyle={ttS} />
                <Line type="monotone" dataKey="leads" stroke={C.cyan}  strokeWidth={2.5} dot={{ r: 3, fill: C.cyan,  stroke: C.white, strokeWidth: 2 }} name="Leads" connectNulls />
                <Line type="monotone" dataKey="sold"  stroke={C.g}     strokeWidth={2.5} dot={{ r: 3, fill: C.g,     stroke: C.white, strokeWidth: 2 }} name="Sold"  connectNulls />
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
            <KpiCard label="Total Calls"          value={fmt(cr.total_calls)}   change={pct(cr.total_calls,   crcmp.total_calls)}   prior={crcmp.total_calls} tip="Total tracked calls." />
            <KpiCard label="From Website"         value={fmt(cr.website_calls)} change={pct(cr.website_calls, crcmp.website_calls)} prior={crcmp.website_calls} tip="Calls from website visits." />
            <KpiCard label="From Ads"             value={fmt(cr.ads_calls)}     change={pct(cr.ads_calls,     crcmp.ads_calls)}     prior={crcmp.ads_calls} tip="Calls from paid campaigns." />
            <KpiCard label="From Google Business" value={fmt(cr.gbp_calls)}     change={pct(cr.gbp_calls,     crcmp.gbp_calls)}     prior={crcmp.gbp_calls} tip="Calls from GBP call button." />
          </div>
        </SecWrap>
      )}

      {/* Department cards — 2-col grid */}
      <SH title="Department Performance" style={{ marginBottom: 12 }} />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(400px, 1fr))", gap: 16, marginBottom: 24 }}>

        {/* SEO */}
        {services.seo !== false && (
          <BlueCard icon="🔍" label="SEO" accent={DEPT_ACCENT.seo} badge={!seo.organic_sessions && !seo.impressions} onClick={() => setActiveTab("seo")}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <BM l="Org. Sessions" v={seo.organic_sessions ? Number(seo.organic_sessions) : null} change={pct(seo.organic_sessions, scmp.organic_sessions)} prior={scmp.organic_sessions} />
              <BM l="Total Leads"   v={seoTotalLeads}     change={pct(seoTotalLeads, seoTotalLeadsPrev)}     prior={seoTotalLeadsPrev} />
              <BM l="VDP Views"     v={seo.vdp_views      ? Number(seo.vdp_views)      : null} change={pct(seo.vdp_views,     scmp.vdp_views)}     prior={scmp.vdp_views} />
              <BM l="Avg Position"  v={seo.avg_position   != null ? parseFloat(seo.avg_position).toFixed(1)   : null} change={pct(seo.avg_position,  scmp.avg_position)}  invert prior={scmp.avg_position != null ? parseFloat(scmp.avg_position).toFixed(1) : null} />
              <BM l="Impressions"   v={seo.impressions     ? Number(seo.impressions)     : null} change={pct(seo.impressions,   scmp.impressions)}   prior={scmp.impressions} />
            </div>
          </BlueCard>
        )}

        {/* GBP */}
        {services.gbp !== false && (
          <BlueCard icon="📍" label="Google Business" accent={DEPT_ACCENT.gbp} badge={!gbp.phone_calls && !gbp.website_clicks} onClick={() => setActiveTab("gbp")}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <BM l="Calls"       v={gbp.phone_calls        ? Number(gbp.phone_calls)        : null} change={pct(gbp.phone_calls,        gcmp.phone_calls)}        prior={gcmp.phone_calls} />
              <BM l="Directions"  v={gbp.direction_requests  ? Number(gbp.direction_requests)  : null} change={pct(gbp.direction_requests,  gcmp.direction_requests)}  prior={gcmp.direction_requests} />
              <BM l="Web Clicks"  v={gbp.website_clicks      ? Number(gbp.website_clicks)      : null} change={pct(gbp.website_clicks,      gcmp.website_clicks)}      prior={gcmp.website_clicks} />
              <BM l="Avg Rating"  v={gbp.avg_rating          != null ? `${parseFloat(gbp.avg_rating).toFixed(1)} ★` : null} />
              <BM l="New Reviews" v={gbp.new_reviews         ? Number(gbp.new_reviews)         : null} change={pct(gbp.new_reviews,         gcmp.new_reviews)}         prior={gcmp.new_reviews} />
            </div>
          </BlueCard>
        )}

        {/* Google Ads */}
        {services.google_ads !== false && (
          <BlueCard icon="📢" label="Google Ads" accent={DEPT_ACCENT.google_ads} badge={!gads.conversions && !gads.total_spend} onClick={() => setActiveTab("google_ads")}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <BM l="Conversions" v={gads.conversions   ? Number(gads.conversions)                    : null} change={pct(gads.conversions,   gacmp.conversions)}   prior={gacmp.conversions} />
              <BM l="Cost/Lead"   v={gads.cost_per_lead != null ? parseFloat(gads.cost_per_lead).toFixed(2) : null} pre="$" change={pct(gads.cost_per_lead, gacmp.cost_per_lead)} invert prior={gacmp.cost_per_lead != null ? parseFloat(gacmp.cost_per_lead).toFixed(2) : null} />
              <BM l="Spend"       v={gads.total_spend   ? Number(gads.total_spend)                    : null} pre="$" prior={gacmp.total_spend} />
              <BM l="CTR"         v={gads.ctr           != null ? parseFloat(gads.ctr).toFixed(1)           : null} suf="%" change={pct(gads.ctr,           gacmp.ctr)}           prior={gacmp.ctr != null ? parseFloat(gacmp.ctr).toFixed(1) : null} />
              <BM l="Avg CPC"     v={gads.cpc           != null ? parseFloat(gads.cpc).toFixed(2)           : null} pre="$" change={pct(gads.cpc,           gacmp.cpc)}           invert prior={gacmp.cpc != null ? parseFloat(gacmp.cpc).toFixed(2) : null} />
            </div>
            <BudgetPacingBar spend={gads.total_spend} budget={gads.budget} />
          </BlueCard>
        )}

        {/* Meta Ads */}
        {services.meta_ads !== false && (
          <BlueCard icon="📱" label="Meta Ads" accent={DEPT_ACCENT.meta_ads} badge={!meta.conversions && !meta.total_spend} onClick={() => setActiveTab("meta_ads")}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <BM l="Conversions" v={meta.conversions   ? Number(meta.conversions)                    : null} change={pct(meta.conversions,   mcmp.conversions)}   prior={mcmp.conversions} />
              <BM l="Cost/Lead"   v={meta.cost_per_lead != null ? parseFloat(meta.cost_per_lead).toFixed(2) : null} pre="$" change={pct(meta.cost_per_lead, mcmp.cost_per_lead)} invert prior={mcmp.cost_per_lead != null ? parseFloat(mcmp.cost_per_lead).toFixed(2) : null} />
              <BM l="CTR"         v={meta.ctr           != null ? parseFloat(meta.ctr).toFixed(1)           : null} suf="%" change={pct(meta.ctr,           mcmp.ctr)}           prior={mcmp.ctr != null ? parseFloat(mcmp.ctr).toFixed(1) : null} />
              <BM l="Avg CPC"     v={meta.cpc           != null ? parseFloat(meta.cpc).toFixed(2)           : null} pre="$" change={pct(meta.cpc,           mcmp.cpc)}           invert prior={mcmp.cpc != null ? parseFloat(mcmp.cpc).toFixed(2) : null} />
              <BM l="Spend"       v={meta.total_spend   ? Number(meta.total_spend)                    : null} pre="$" prior={mcmp.total_spend} />
            </div>
            <BudgetPacingBar spend={meta.total_spend} budget={meta.monthly_budget} />
          </BlueCard>
        )}

        {/* Social */}
        {services.social !== false && (
          <BlueCard icon="🎬" label="Organic Social" accent={DEPT_ACCENT.social} badge={totalViews === 0 && totalPublished === 0} onClick={() => setActiveTab("social")}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <BM l="Total Views"     v={totalViews     > 0 ? totalViews     : null} change={pct(totalViews,     prevTotalViews)}    prior={prevTotalViews > 0 ? prevTotalViews : null} />
              <BM l="Total Published" v={totalPublished > 0 ? totalPublished : null} change={pct(totalPublished, prevPublished)}      prior={prevPublished  > 0 ? prevPublished  : null} />
              <BM l="Web Clicks"      v={social.web_clicks  ? Number(social.web_clicks)  : null} change={pct(social.web_clicks, socmp.web_clicks)} prior={socmp.web_clicks} />
            </div>
            <MiniChannelBar fb={social.fb_published} ig={social.ig_published} ytLong={social.yt_long_form_published} ytShort={social.yt_shorts_published} tiktok={social.tiktok_published} />
          </BlueCard>
        )}

        {/* Email */}
        {services.email !== false && (
          <BlueCard icon="✉️" label="Email" accent={DEPT_ACCENT.email} badge={!email.campaigns_sent && !email.total_recipients} onClick={() => setActiveTab("email")}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <BM l="Campaigns"      v={email.campaigns_sent ? Number(email.campaigns_sent) : null} prior={ecmp.campaigns_sent} />
              <BM l="Audience Size"  v={email.total_recipients ? Number(email.total_recipients) : null} change={pct(email.total_recipients, ecmp.total_recipients)} prior={ecmp.total_recipients} />
            </div>
          </BlueCard>
        )}
      </div>

      {/* Creative — full width */}
      {services.creative !== false && (
        <BlueCard icon="🎨" label="Creative" accent={DEPT_ACCENT.creative} badge={!creat.total_assets} onClick={() => setActiveTab("creative")}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, color: C.tl, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, fontFamily: F, marginBottom: 4 }}>Assets Delivered</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: C.t, fontFamily: FS, lineHeight: 1 }}>
                {creat.total_assets ? Number(creat.total_assets).toLocaleString() : "—"}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <CreativeBreakdownBar videos={creat.videos} graphics={creat.graphics} banners={creat.banners} adCreative={creat.ad_creative} emailHeaders={creat.email_headers} print={creat.print} />
            </div>
          </div>
        </BlueCard>
      )}

      {data.leads?.notes && (
        <Card style={{ marginTop: 16 }}>
          <SH title="Notes" />
          <div style={{ fontSize: 13, color: C.t, fontFamily: F, lineHeight: 1.7 }}>{data.leads.notes}</div>
        </Card>
      )}
    </>
  );
}

/* ─── SEO PAGE ─── */
function SeoPage({ d: _d, cd: _cd, trend }) {
  const d = _d || {};
  const cd = _cd || {};

  const trendLine = trend
    .filter(t => t.organic_sessions != null)
    .map(t => ({ month: t.label, sessions: Number(t.organic_sessions) || 0 }));

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

  // Total leads = phone_calls + form_submissions
  const totalLeads     = (Number(d.phone_calls) || 0) + (Number(d.form_submissions) || 0) || null;
  const totalLeadsPrev = (Number(cd.phone_calls) || 0) + (Number(cd.form_submissions) || 0) || null;

  // Top queries — prefer new array, fall back to legacy top_query
  const topQueries = Array.isArray(d.top_queries) && d.top_queries.length > 0
    ? d.top_queries
    : (d.top_query ? [{ query: d.top_query, clicks: null, impressions: null, position: null }] : []);

  return (
    <div>
      <HeroMetric icon="🔍" label="Organic Sessions" value={fmt(d.organic_sessions)} color={C.cyanD}
        change={pct(d.organic_sessions, cd.organic_sessions)}
        sub={totalSessions > 0 ? `${Math.round((organic / totalSessions) * 100)}% of ${totalSessions.toLocaleString()} total sessions` : null} />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <KpiCard label="Total Leads" value={fmt(totalLeads)} color={C.g}
          change={pct(totalLeads, totalLeadsPrev)} prior={totalLeadsPrev != null ? fmt(totalLeadsPrev) : null}
          tip="Phone calls + form submissions from organic search." />
        <KpiCard label="VDP Views" value={fmt(d.vdp_views)}
          change={pct(d.vdp_views, cd.vdp_views)} prior={cd.vdp_views}
          tip="Vehicle Detail Page views — high-intent shoppers." />
        <KpiCard label="Avg Position" value={d.avg_position != null ? parseFloat(d.avg_position).toFixed(1) : "—"}
          change={pct(d.avg_position, cd.avg_position)} invert
          prior={cd.avg_position != null ? parseFloat(cd.avg_position).toFixed(1) : null}
          tip="Average ranking across all tracked keywords." />
        <KpiCard label="Impressions" value={fmt(d.impressions)}
          change={pct(d.impressions, cd.impressions)} prior={cd.impressions}
          tip="Times your site appeared in Google results." />
      </div>

      <SecWrap title="Organic Traffic" sub="Trend over time and channel breakdown">
        {trendLine.length > 0 || channelData.length > 0 ? (
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
                    <Pie data={channelData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={36} outerRadius={56} strokeWidth={0}>
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
                      <span style={{ fontWeight: 700, color: i === 0 ? C.cyanD : C.t }}>{Math.round((s.value / totalSessions) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        ) : <EmptyPlaceholder text="Traffic trend and channel breakdown — appears when session data is entered." />}
      </SecWrap>

      {/* Top Queries table */}
      <SecWrap title="Top Organic Queries" sub="Top performing search queries this period">
        {topQueries.length > 0 ? (
          <Card style={{ marginBottom: 0, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={thS}>#</th>
                  <th style={thS}>Query</th>
                  <th style={{ ...thS, textAlign: "right" }}>Clicks</th>
                  <th style={{ ...thS, textAlign: "right" }}>Impressions</th>
                  <th style={{ ...thS, textAlign: "right" }}>Position</th>
                </tr>
              </thead>
              <tbody>
                {topQueries.map((q, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.white : "#fafafa" }}>
                    <td style={{ ...tdS, color: C.tl, width: 32 }}>{i + 1}</td>
                    <td style={{ ...tdS, fontWeight: 600 }}>{q.query}</td>
                    <td style={{ ...tdS, textAlign: "right" }}>{q.clicks != null ? Number(q.clicks).toLocaleString() : "—"}</td>
                    <td style={{ ...tdS, textAlign: "right", color: C.tl }}>{q.impressions != null ? Number(q.impressions).toLocaleString() : "—"}</td>
                    <td style={{ ...tdS, textAlign: "right" }}>
                      {q.position != null ? (
                        <span style={{
                          background: q.position <= 3 ? C.gL : q.position <= 10 ? C.cyanL : "#f0f2f5",
                          color: q.position <= 3 ? "#059669" : q.position <= 10 ? C.cyanD : C.tl,
                          padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700,
                        }}>{Number(q.position).toFixed(1)}</span>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : <EmptyPlaceholder text="No top queries entered for this period." />}
      </SecWrap>

      <SecWrap title="Conversions & Engagement">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Phone Calls (SEO)"    value={fmt(d.phone_calls)}      color={C.g}   change={pct(d.phone_calls, cd.phone_calls)} prior={cd.phone_calls} tip="Calls attributed to organic search." />
          <KpiCard label="Form Submissions"     value={fmt(d.form_submissions)} change={pct(d.form_submissions, cd.form_submissions)} prior={cd.form_submissions} tip="Contact, trade-in, and finance forms." />
          <KpiCard label="Bounce Rate"          value={d.bounce_rate != null ? parseFloat(d.bounce_rate).toFixed(1) + "%" : "—"} change={pct(d.bounce_rate, cd.bounce_rate)} invert prior={cd.bounce_rate != null ? parseFloat(cd.bounce_rate).toFixed(1) + "%" : null} sub="Industry avg 40–55%" />
          <KpiCard label="Avg Session"          value={d.avg_session_duration != null ? fmtDur(d.avg_session_duration) : "—"} sub="2+ min is healthy" />
        </div>
      </SecWrap>

      <WorkDone text={d.work_completed} />
      <WinsLosses wins={d.wins} losses={d.losses} />
      <NextMonth text={d.next_month} />
    </div>
  );
}

/* ─── GBP PAGE ─── */
function GbpPage({ d: _d, cd: _cd, trend, clientName }) {
  const d = _d || {};
  const cd = _cd || {};

  const listings = GBP_MULTI_LISTINGS[clientName] || null;

  const viewsTrend = trend
    .filter(t => t.profile_views != null)
    .map(t => ({ label: t.label, views: Number(t.profile_views) || 0 }));

  const actionsTrend = trend
    .filter(t => t.phone_calls != null || t.direction_requests != null || t.website_clicks != null)
    .map(t => ({
      label: t.label,
      calls:      Number(t.phone_calls)        || 0,
      directions: Number(t.direction_requests) || 0,
      clicks:     Number(t.website_clicks)     || 0,
    }));

  const listingStat = (listingKey, field) => {
    const v = d[`gbp_${listingKey}_${field}`];
    return v != null ? Number(v) : null;
  };

  return (
    <div>
      <HeroMetric icon="📍" label="Website Clicks" value={fmt(d.website_clicks)} color={C.cyanD}
        change={pct(d.website_clicks, cd.website_clicks)}
        sub={listings ? "Combined totals across all listings" : "From Google Business Profile"} />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <KpiCard label="Calls"               value={fmt(d.phone_calls)}        change={pct(d.phone_calls,        cd.phone_calls)}        prior={cd.phone_calls} color={C.g} tip="Calls made directly from the GBP listing." />
        <KpiCard label="Direction Requests"  value={fmt(d.direction_requests)} change={pct(d.direction_requests, cd.direction_requests)} prior={cd.direction_requests} tip="Users who requested directions." />
        <KpiCard label="Searches"            value={fmt(d.search_appearances)} change={pct(d.search_appearances, cd.search_appearances)} prior={cd.search_appearances} tip="Times your business appeared in Google Search." />
        <KpiCard label="Avg Rating"   value={d.avg_rating != null ? `${parseFloat(d.avg_rating).toFixed(1)} ★` : "—"} />
        <KpiCard label="New Reviews"  value={d.new_reviews != null ? `+${d.new_reviews}` : "—"} color={C.g} change={pct(d.new_reviews, cd.new_reviews)} prior={cd.new_reviews} />
      </div>

      {listings && (
        <SecWrap title="Listing Breakdown" sub="Performance by individual Google Business Profile">
          {listings.some(l => listingStat(l.key, "profile_views") != null) ? (
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
                  <div key={l.key} style={{ flex: 1, minWidth: 300, background: C.white, border: `2px solid ${l.color}33`, borderRadius: 12, padding: "18px 20px", boxShadow: C.sh }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${l.color}22` }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.t, fontFamily: FS }}>📍 {l.label}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      {[{ label: "Calls", value: calls, color: C.g }, { label: "Directions", value: dirs }, { label: "Web Clicks", value: clicks, color: l.color }, { label: "Searches", value: searches }, { label: "Map Views", value: mapV }, { label: "Profile Views", value: views }].map(s => (
                        <div key={s.label} style={{ textAlign: "center", background: "#f8fafc", borderRadius: 8, padding: "10px 6px", border: `1px solid ${C.bl2}` }}>
                          <div style={{ fontSize: 10, color: C.tl, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: F, marginBottom: 4 }}>{s.label}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: s.color || C.t, fontFamily: FS }}>{s.value != null ? s.value.toLocaleString() : "—"}</div>
                        </div>
                      ))}
                    </div>
                    {(rating != null || reviews != null) && (
                      <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.bl2}`, display: "flex", gap: 12, alignItems: "center" }}>
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
          ) : <EmptyPlaceholder text="Per-listing data not yet entered for this period." />}
        </SecWrap>
      )}

      <SecWrap title="Performance Trends" sub="Profile views and customer actions over time">
        {viewsTrend.length > 1 || actionsTrend.length > 1 ? (
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
                    <Line type="monotone" dataKey="views" stroke={C.cyan} strokeWidth={2.5} dot={{ r: 3, fill: C.cyan, stroke: C.white, strokeWidth: 2 }} name="Views" />
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
        ) : <EmptyPlaceholder text="Trend charts appear with 2+ months of data." />}
      </SecWrap>

      {!listings && (
        <SecWrap title="Reviews">
          <Card>
            <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center", minWidth: 100 }}>
                <div style={{ fontSize: 52, fontWeight: 700, color: C.t, fontFamily: FS, lineHeight: 1 }}>{d.avg_rating ? parseFloat(d.avg_rating).toFixed(1) : "—"}</div>
                <div style={{ color: C.o, fontSize: 22, margin: "4px 0" }}>{"★".repeat(Math.round(d.avg_rating || 0))}</div>
                <div style={{ fontSize: 12, color: C.tl, fontFamily: F }}>{d.review_count ? `${d.review_count} reviews` : ""}</div>
              </div>
              <div style={{ display: "flex", gap: 12, flex: 1, flexWrap: "wrap" }}>
                <KpiCard label="New Reviews"     value={d.new_reviews != null ? `+${d.new_reviews}` : "—"} color={C.g} />
                <KpiCard label="Photos"          value={fmt(d.photo_count)} />
                <KpiCard label="Posts Published" value={fmt(d.posts_published)} />
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
function GoogleAdsPage({ d: _d, cd: _cd, trend }) {
  const d = _d || {};
  const cd = _cd || {};

  const convTrend = trend.filter(t => t.conversions != null).map(t => ({ label: t.label, conversions: Number(t.conversions) || 0 }));
  const spend  = d.total_spend != null ? Number(d.total_spend) : null;
  const budget = d.budget      != null ? Number(d.budget)      : null;
  const spendPct = spend && budget && budget > 0 ? Math.min(Math.round((spend / budget) * 100), 100) : null;

  return (
    <div>
      <HeroMetric icon="📢" label="Conversions" value={fmt(d.conversions)} color={C.cyanD}
        change={pct(d.conversions, cd.conversions)}
        sub={d.cost_per_lead != null ? `$${parseFloat(d.cost_per_lead).toFixed(2)} cost per lead` : null} />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <KpiCard label="Cost / Lead"
          value={d.cost_per_lead != null ? "$" + parseFloat(d.cost_per_lead).toFixed(2) : "—"}
          color={C.g} invert change={pct(d.cost_per_lead, cd.cost_per_lead)}
          prior={cd.cost_per_lead != null ? "$" + parseFloat(cd.cost_per_lead).toFixed(2) : null}
          tip="Average cost per conversion." sub="Industry avg $25–$45" />
        <KpiCard label="Total Clicks" value={fmt(d.clicks)} change={pct(d.clicks, cd.clicks)} prior={cd.clicks} />
        <KpiCard label="CTR"
          value={d.ctr != null ? parseFloat(d.ctr).toFixed(1) + "%" : "—"}
          change={pct(d.ctr, cd.ctr)} prior={cd.ctr != null ? parseFloat(cd.ctr).toFixed(1) + "%" : null}
          tip="Click-through rate." sub="Industry avg ~8.29%" />
        <KpiCard label="Avg CPC"
          value={d.cpc != null ? "$" + parseFloat(d.cpc).toFixed(2) : "—"}
          invert change={pct(d.cpc, cd.cpc)} prior={cd.cpc != null ? "$" + parseFloat(cd.cpc).toFixed(2) : null}
          tip="Average cost per click." sub="Industry avg ~$2.41" />
        <KpiCard label="Impressions" value={fmt(d.impressions)} change={pct(d.impressions, cd.impressions)} prior={cd.impressions} />
      </div>

      <SecWrap title="Budget">
        {spendPct !== null ? (
          <Card style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 26, fontWeight: 700, color: C.t, fontFamily: FS }}>${spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span style={{ fontSize: 12, color: C.tl, marginLeft: 6, fontFamily: F }}>of ${budget.toLocaleString(undefined, { maximumFractionDigits: 0 })} budget</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: spendPct >= 85 ? C.g : spendPct >= 60 ? C.o : C.r, fontFamily: F }}>{spendPct}% utilized</span>
            </div>
            <div style={{ height: 10, background: C.bl2, borderRadius: 5, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${spendPct}%`, background: `linear-gradient(90deg, ${C.cyan}, ${C.cyanD})`, borderRadius: 5, transition: "width 0.6s" }} />
            </div>
          </Card>
        ) : <EmptyPlaceholder text="Budget pacing appears when spend and budget data are entered." />}
      </SecWrap>

      <SecWrap title="Monthly Conversions Trend">
        {convTrend.length > 1 ? (
          <Card style={{ marginBottom: 0 }}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={convTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.bl2} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.tl }} />
                <YAxis tick={{ fontSize: 10, fill: C.tl }} allowDecimals={false} />
                <Tooltip contentStyle={ttS} />
                <Line type="monotone" dataKey="conversions" stroke={C.cyan} strokeWidth={2.5} dot={{ r: 3, fill: C.cyan, stroke: C.white, strokeWidth: 2 }} name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        ) : <EmptyPlaceholder text="Conversions trend — chart appears with 2+ months of data." />}
      </SecWrap>

      <SecWrap title="Quality">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Avg Quality Score" value={d.quality_score != null ? parseFloat(d.quality_score).toFixed(1) + " / 10" : "—"} tip="6+ is standard." sub="Scale: 1–10" />
        </div>
      </SecWrap>

      <WorkDone text={d.work_completed} />
      <WinsLosses wins={d.wins} losses={d.losses} />
      <NextMonth text={d.next_month} />
    </div>
  );
}

/* ─── META ADS PAGE ─── */
function MetaAdsPage({ d: _d, cd: _cd, trend }) {
  const d = _d || {};
  const cd = _cd || {};

  const convTrend = trend.filter(t => t.conversions != null).map(t => ({ label: t.label, conversions: Number(t.conversions) || 0 }));
  const spend  = d.total_spend    != null ? Number(d.total_spend)    : null;
  const budget = d.monthly_budget != null ? Number(d.monthly_budget) : null;
  const spendPct = spend && budget && budget > 0 ? Math.min(Math.round((spend / budget) * 100), 100) : null;

  return (
    <div>
      <HeroMetric icon="📱" label="Conversions" value={fmt(d.conversions)} color={C.cyanD}
        change={pct(d.conversions, cd.conversions)}
        sub={d.cost_per_lead != null ? `$${parseFloat(d.cost_per_lead).toFixed(2)} cost per lead` : "Facebook & Instagram ads"} />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <KpiCard label="Cost / Lead"
          value={d.cost_per_lead != null ? "$" + parseFloat(d.cost_per_lead).toFixed(2) : "—"}
          color={C.g} invert change={pct(d.cost_per_lead, cd.cost_per_lead)}
          prior={cd.cost_per_lead != null ? "$" + parseFloat(cd.cost_per_lead).toFixed(2) : null}
          tip="Average cost per lead." sub="Industry avg $25–$40" />
        <KpiCard label="Total Spend"
          value={spend != null ? "$" + spend.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"} />
        <KpiCard label="Reach" value={fmt(d.reach)} change={pct(d.reach, cd.reach)} prior={cd.reach} />
      </div>

      <SecWrap title="Budget">
        {spendPct !== null ? (
          <Card style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 26, fontWeight: 700, color: C.t, fontFamily: FS }}>${spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span style={{ fontSize: 12, color: C.tl, marginLeft: 6, fontFamily: F }}>of ${budget.toLocaleString(undefined, { maximumFractionDigits: 0 })} budget</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: spendPct >= 85 ? C.g : spendPct >= 60 ? C.o : C.r, fontFamily: F }}>{spendPct}% utilized</span>
            </div>
            <div style={{ height: 10, background: C.bl2, borderRadius: 5, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${spendPct}%`, background: `linear-gradient(90deg, ${C.p}, #6d28d9)`, borderRadius: 5, transition: "width 0.6s" }} />
            </div>
          </Card>
        ) : <EmptyPlaceholder text="Budget pacing appears when spend and budget data are entered." />}
      </SecWrap>

      <SecWrap title="Reach & Engagement">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Reach"         value={fmt(d.reach)}         change={pct(d.reach, cd.reach)} prior={cd.reach} tip="Unique people who saw your ads." />
          <KpiCard label="Impressions"   value={fmt(d.impressions)}   change={pct(d.impressions, cd.impressions)} prior={cd.impressions} />
          <KpiCard label="CTR"           value={d.ctr != null ? parseFloat(d.ctr).toFixed(1) + "%" : "—"} change={pct(d.ctr, cd.ctr)} prior={cd.ctr != null ? parseFloat(cd.ctr).toFixed(1) + "%" : null} tip="Click-through rate across Meta placements." />
          <KpiCard label="Avg CPC"       value={d.cpc != null ? "$" + parseFloat(d.cpc).toFixed(2) : "—"} invert change={pct(d.cpc, cd.cpc)} prior={cd.cpc != null ? "$" + parseFloat(cd.cpc).toFixed(2) : null} tip="Cost per click." sub="Industry avg ~$0.79" />
        </div>
      </SecWrap>

      <SecWrap title="Monthly Conversions Trend">
        {convTrend.length > 1 ? (
          <Card style={{ marginBottom: 0 }}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={convTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.bl2} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.tl }} />
                <YAxis tick={{ fontSize: 10, fill: C.tl }} allowDecimals={false} />
                <Tooltip contentStyle={ttS} />
                <Line type="monotone" dataKey="conversions" stroke={C.p} strokeWidth={2.5} dot={{ r: 3, fill: C.p, stroke: C.white, strokeWidth: 2 }} name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        ) : <EmptyPlaceholder text="Conversions trend — chart appears with 2+ months of data." />}
      </SecWrap>

      <WorkDone text={d.work_completed} />
      <WinsLosses wins={d.wins} losses={d.losses} />
      <NextMonth text={d.next_month} />
    </div>
  );
}

/* ─── SOCIAL PAGE ─── */
function SocialPage({ d: _d, cd: _cd, trend }) {
  const d = _d || {};
  const cd = _cd || {};

  // Views-based totals
  const totalViews     = (Number(d.yt_month_views) || 0) + (Number(d.ig_reach) || 0) + (Number(d.fb_visits) || 0) + (Number(d.tiktok_profile_views) || 0);
  const prevTotalViews = (Number(cd.yt_month_views) || 0) + (Number(cd.ig_reach) || 0) + (Number(cd.fb_visits) || 0) + (Number(cd.tiktok_profile_views) || 0);

  // Published — prefer total_published, fall back to summing channels
  const totalPublished = Number(d.total_published) || (
    (Number(d.fb_published) || 0) + (Number(d.ig_published) || 0) +
    (Number(d.yt_long_form_published) || 0) + (Number(d.yt_shorts_published) || 0) +
    (Number(d.tiktok_published) || 0)
  ) || null;
  const prevPublished = Number(cd.total_published) || null;

  // Follower growth: current total - prior total
  const followerGrowth = (key) => {
    const curr = Number(d[key]) || null;
    const prev = Number(cd[key]) || null;
    if (!curr || !prev) return null;
    return curr - prev;
  };

  const viewsTrend = trend
    .map(t => {
      const v = (Number(t.yt_month_views) || 0) + (Number(t.ig_reach) || 0) + (Number(t.fb_visits) || 0) + (Number(t.tiktok_profile_views) || 0);
      return v > 0 ? { label: t.label, views: v } : null;
    }).filter(Boolean);

  const publishedChannels = [
    { label: "Facebook",     value: Number(d.fb_published)           || 0, color: "#1877F2" },
    { label: "Instagram",    value: Number(d.ig_published)           || 0, color: "#E1306C" },
    { label: "YT Long Form", value: Number(d.yt_long_form_published) || 0, color: "#FF0000" },
    { label: "YT Shorts",    value: Number(d.yt_shorts_published)    || 0, color: "#FF6B6B" },
    { label: "TikTok",       value: Number(d.tiktok_published)       || 0, color: "#69C9D0" },
  ].filter(s => s.value > 0);
  const publishedTotal = publishedChannels.reduce((a, s) => a + s.value, 0);

  const platforms = [
    { name: "Facebook",  followers: d.fb_followers,     growth: followerGrowth("fb_followers"),      views: d.fb_visits,       viewLabel: "Visits",     color: "#1877f2" },
    { name: "Instagram", followers: d.ig_followers,     growth: followerGrowth("ig_followers"),      views: d.ig_reach,        viewLabel: "Reach",      color: "#e1306c" },
    { name: "YouTube",   followers: d.yt_followers,     growth: followerGrowth("yt_followers"),      views: d.yt_month_views,  viewLabel: "Views",      color: "#ff0000" },
    { name: "TikTok",    followers: d.tiktok_followers, growth: followerGrowth("tiktok_followers"),  views: d.tiktok_views,    viewLabel: "Video Views",color: "#333" },
  ];

  return (
    <div>
      <HeroMetric icon="🎬" label="Total Views" value={totalViews > 0 ? fmt(totalViews) : "—"} color={C.cyanD}
        change={pct(totalViews, prevTotalViews)}
        sub="Combined views and reach across all platforms" />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <KpiCard label="Total Published"  value={totalPublished ? fmt(totalPublished) : "—"} change={pct(totalPublished, prevPublished)} prior={prevPublished} tip="Posts and videos published across all platforms." />
        <KpiCard label="Website Clicks" value={fmt(d.web_clicks)} change={pct(d.web_clicks, cd.web_clicks)} prior={cd.web_clicks} tip="Clicks from social to your website (GA4)." />
        {d.tiktok_traffic_source && (
          <div style={{ background: C.white, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "12px 16px", flex: 1, minWidth: 130, boxShadow: C.sh }}>
            <div style={{ fontSize: 10, color: C.tl, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: F, marginBottom: 6 }}>TikTok Traffic Source</div>
            <div style={{ fontSize: 13, color: C.t, fontFamily: F, lineHeight: 1.6, whiteSpace: "pre-line" }}>{d.tiktok_traffic_source}</div>
          </div>
        )}
      </div>

      {/* Views by Channel breakdown */}
      <SecWrap title="Views by Channel">
        {(() => {
          const viewChannels = [
            { label: "Facebook",  value: Number(d.fb_visits)          || 0, color: "#1877F2", sub: "Visits" },
            { label: "Instagram", value: Number(d.ig_reach)           || 0, color: "#E1306C", sub: "Reach" },
            { label: "YouTube",   value: Number(d.yt_month_views)     || 0, color: "#FF0000", sub: "Views" },
            { label: "TikTok",    value: Number(d.tiktok_views)       || 0, color: "#69C9D0", sub: "Video Views" },
          ].filter(s => s.value > 0);
          const viewsTotal = viewChannels.reduce((a, s) => a + s.value, 0);
          return viewChannels.length > 0 ? (
            <Card style={{ marginBottom: 0 }}>
              <div style={{ height: 8, borderRadius: 4, overflow: "hidden", display: "flex", gap: 2, marginBottom: 16 }}>
                {viewChannels.map(s => (
                  <div key={s.label} style={{ width: `${Math.round((s.value / viewsTotal) * 100)}%`, background: s.color, borderRadius: 3 }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {viewChannels.map(s => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                    <div style={{ fontFamily: F }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: C.t, fontFamily: FS, lineHeight: 1.1 }}>{s.value.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: C.tl }}>{s.label} <span style={{ opacity: 0.7 }}>({s.sub})</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : <EmptyPlaceholder text="No views data entered for this period." />;
        })()}
      </SecWrap>

      {/* Published channel breakdown */}
      <SecWrap title="Published by Channel">
        {publishedChannels.length > 0 ? (
          <Card style={{ marginBottom: 0 }}>
            <div style={{ height: 8, borderRadius: 4, overflow: "hidden", display: "flex", gap: 2, marginBottom: 12 }}>
              {publishedChannels.map(s => (
                <div key={s.label} style={{ width: `${Math.round((s.value / publishedTotal) * 100)}%`, background: s.color, borderRadius: 3 }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {publishedChannels.map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                  <div style={{ fontFamily: F }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.t, fontFamily: FS }}>{s.value}</span>
                    <span style={{ fontSize: 11, color: C.tl, marginLeft: 5 }}>{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : <EmptyPlaceholder text="No published content data entered for this period." />}
      </SecWrap>

      <SecWrap title="Views Trend" sub="Combined views across all platforms">
        {viewsTrend.length > 1 ? (
          <Card style={{ marginBottom: 0 }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={viewsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.bl2} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.tl }} />
                <YAxis tick={{ fontSize: 10, fill: C.tl }} />
                <Tooltip contentStyle={ttS} formatter={(v) => [v.toLocaleString(), "Views"]} />
                <Bar dataKey="views" fill={C.cyan} radius={[3, 3, 0, 0]} name="Views" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        ) : <EmptyPlaceholder text="Monthly views trend — chart appears with 2+ months of data." />}
      </SecWrap>

      <SecWrap title="Platform Breakdown">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {platforms.map((p, i) => (
              <div key={i} style={{ flex: 1, minWidth: 160, background: C.white, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "16px 18px", boxShadow: C.sh }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.t, fontFamily: FS }}>{p.name}</span>
                </div>
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: C.tl, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: F }}>Followers</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.t, fontFamily: FS }}>{p.followers != null ? Number(p.followers).toLocaleString() : "—"}</div>
                </div>
                {p.growth != null && p.growth !== 0 && (
                  <div style={{ fontSize: 12, color: p.growth > 0 ? C.g : C.r, fontWeight: 700, fontFamily: F }}>
                    {p.growth > 0 ? "+" : ""}{p.growth.toLocaleString()} this month
                  </div>
                )}
                <div style={{ fontSize: 12, color: C.tl, fontFamily: F, marginTop: 4 }}>{p.viewLabel}: {p.views != null ? Number(p.views).toLocaleString() : "—"}</div>
              </div>
            ))}
          </div>
        </SecWrap>

      {d.top_video && (
        <SecWrap title="Top Performing Video">
          <div style={{ background: C.cyanL, border: `1px solid #a5f3fc`, borderRadius: 10, padding: "14px 20px", fontFamily: F, fontSize: 14, fontWeight: 700, color: C.navy }}>
            🎬 {d.top_video}{d.top_video_views ? ` — ${Number(d.top_video_views).toLocaleString()} views` : ""}
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
function EmailPage({ d: _d, cd: _cd, seoData, seoDataCmp, trend }) {
  const d = _d || {};
  const cd = _cd || {};

  // Audience size = total recipients across all campaigns
  const audienceSize     = d.total_recipients != null ? Number(d.total_recipients) : null;
  const audienceSizePrev = cd.total_recipients != null ? Number(cd.total_recipients) : null;

  // Site visits from SEO form (GA4 email channel)
  const siteVisits     = seoData?.site_visits_from_email     != null ? Number(seoData.site_visits_from_email)     : null;
  const siteVisitsPrev = seoDataCmp?.site_visits_from_email  != null ? Number(seoDataCmp.site_visits_from_email)  : null;

  // Campaign list
  const campaignList = Array.isArray(d.campaign_list) ? d.campaign_list : [];

  // Trend data for site visits chart
  const visitsTrend = (trend || []).filter(t => t.site_visits_from_email != null).map(t => ({ label: t.label, visits: Number(t.site_visits_from_email) || 0 }));

  return (
    <div>
      {/* Hero */}
      <HeroMetric icon="✉️" label="Campaigns Sent" value={fmt(d.campaigns_sent)} change={pct(d.campaigns_sent, cd.campaigns_sent)}
        sub={audienceSize ? `${audienceSize.toLocaleString()} total recipients` : null} />

      {/* This Month */}
      <SecWrap title="This Month">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KpiCard label="Campaigns Sent" value={fmt(d.campaigns_sent)} change={pct(d.campaigns_sent, cd.campaigns_sent)} prior={cd.campaigns_sent} />
          <KpiCard label="Audience Size" value={audienceSize ? fmt(audienceSize) : "—"} change={pct(audienceSize, audienceSizePrev)} prior={audienceSizePrev} tip="Total recipients across all campaigns this month." />
          <KpiCard label="Site Visits from Email" value={fmt(siteVisits)} color={C.g} change={pct(siteVisits, siteVisitsPrev)} prior={siteVisitsPrev} tip="GA4 sessions from email campaigns. Enter on SEO form." />
        </div>
      </SecWrap>

      {/* Trend Chart — site visits from email */}
      <SecWrap title="Trend">
        {visitsTrend.length > 1 ? (
          <Card style={{ marginBottom: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.t, marginBottom: 8, fontFamily: F }}>Site Visits from Email</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={visitsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.bl2} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.tl }} />
                <YAxis tick={{ fontSize: 11, fill: C.tl }} allowDecimals={false} />
                <Tooltip contentStyle={ttS} />
                <Bar dataKey="visits" fill={C.g} radius={[3, 3, 0, 0]} name="Site Visits" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        ) : <EmptyPlaceholder text="Site visits trend — chart appears with 2+ months of data." />}
      </SecWrap>

      {/* Campaigns table */}
      <SecWrap title="Campaigns This Month">
        {campaignList.length > 0 ? (
          <Card style={{ marginBottom: 0, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={thS}>Campaign</th>
                  <th style={{ ...thS, textAlign: "right" }}>Date Sent</th>
                </tr>
              </thead>
              <tbody>
                {campaignList.map((c, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.white : "#fafafa" }}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{c.name}</td>
                    <td style={{ ...tdS, textAlign: "right", color: C.tl }}>
                      {c.date_sent ? new Date(c.date_sent + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : <EmptyPlaceholder text="No campaigns entered for this period." />}
      </SecWrap>

      <WorkDone text={d.work_completed} />
      <WinsLosses wins={d.wins} losses={d.losses} />
      <NextMonth text={d.next_month} />
    </div>
  );
}

/* ─── CREATIVE PAGE ─── */
function CreativePage({ d: _d, trend }) {
  const d = _d || {};

  const assetTypes = [
    { key: "videos",        label: "Videos",         color: "#7C3AED" },
    { key: "graphics",      label: "Graphics",       color: "#2563EB" },
    { key: "banners",       label: "Banners",        color: "#0891B2" },
    { key: "ad_creative",   label: "Ad Sets",        color: "#059669" },
    { key: "email_headers", label: "Email Headers",  color: "#D97706" },
    { key: "print",         label: "Print",          color: "#6B7280" },
  ];
  const assetTypesWithData = assetTypes.filter(t => d[t.key] != null && Number(d[t.key]) > 0);

  const totalFromParts = assetTypesWithData.reduce((a, t) => a + (Number(d[t.key]) || 0), 0);
  const totalAssets    = Number(d.total_assets) || totalFromParts;

  // All asset type keys for stacked chart
  const allAssetKeys = [
    { key: "videos",        label: "Videos",        color: "#7C3AED" },
    { key: "graphics",      label: "Graphics",      color: "#2563EB" },
    { key: "banners",       label: "Banners",       color: "#0891B2" },
    { key: "ad_creative",   label: "Ad Sets",       color: "#059669" },
    { key: "email_headers", label: "Email",         color: "#D97706" },
    { key: "print",         label: "Print",         color: "#6B7280" },
  ];

  // Trend from last 12 months — stacked by type
  const creativeTrend = trend
    ? trend.filter(t => t.total_assets != null).map(t => {
        const row = { label: t.label };
        allAssetKeys.forEach(a => { row[a.key] = Number(t[a.key]) || 0; });
        row.total = Number(t.total_assets) || 0;
        return row;
      })
    : [];
  const hasStackedData = creativeTrend.some(t => allAssetKeys.some(a => t[a.key] > 0));

  return (
    <div>
      <HeroMetric icon="🎨" label="Total Assets Delivered" value={fmt(totalAssets)} color={C.cyanD}
        sub={assetTypesWithData.length > 0 ? assetTypesWithData.map(t => `${d[t.key]} ${t.label.toLowerCase()}`).join(", ") : null} />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        {assetTypes.map(t => (
          <KpiCard key={t.key} label={t.label} value={fmt(d[t.key])} color={t.color} />
        ))}
      </div>

      <SecWrap title="Deliverable Breakdown">
        {assetTypesWithData.length > 1 && totalAssets > 0 ? (
          <Card style={{ marginBottom: 0 }}>
            <div style={{ height: 10, borderRadius: 5, overflow: "hidden", display: "flex", gap: 2, marginBottom: 14 }}>
              {assetTypesWithData.map(t => (
                <div key={t.key} style={{ width: `${Math.round((Number(d[t.key]) / totalAssets) * 100)}%`, background: t.color, borderRadius: 4 }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {assetTypesWithData.map(t => (
                <div key={t.key} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: t.color, flexShrink: 0 }} />
                  <div style={{ fontFamily: F }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.t, fontFamily: FS }}>{d[t.key]}</span>
                    <span style={{ fontSize: 11, color: C.tl, marginLeft: 5 }}>{t.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : <EmptyPlaceholder text="No asset breakdown data entered for this period." />}
      </SecWrap>

      <SecWrap title="Monthly Assets Delivered">
        {creativeTrend.length > 1 ? (
          <Card style={{ marginBottom: 0 }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={creativeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.bl2} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.tl }} />
                <YAxis tick={{ fontSize: 10, fill: C.tl }} allowDecimals={false} />
                <Tooltip contentStyle={ttS} />
                {hasStackedData
                  ? allAssetKeys.map(a => <Bar key={a.key} dataKey={a.key} stackId="assets" fill={a.color} name={a.label} />)
                  : <Bar dataKey="total" fill={C.p} radius={[3, 3, 0, 0]} name="Total Assets" />
                }
              </BarChart>
            </ResponsiveContainer>
          </Card>
        ) : <EmptyPlaceholder text="Monthly trend — chart appears with 2+ months of data." />}
      </SecWrap>

      <WorkDone text={d.work_completed} />
      <NextMonth text={d.next_month} />
    </div>
  );
}

/* ─── DISABLED DEPT ─── */
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
      <div style={{ background: C.white, borderRadius: 16, padding: "48px 40px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", textAlign: "center" }}>
        <img src="/Taggart_Advertising_Logo.png" alt="Taggart Advertising" style={{ height: 56, width: "auto", marginBottom: 24 }} />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.navy, margin: "0 0 6px", fontFamily: FS }}>Client Portal</h1>
        <p style={{ fontSize: 13, color: C.tl, margin: "0 0 28px", fontFamily: F }}>Sign in to view your report.</p>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: `1px solid ${C.bd}`, fontSize: 14, fontFamily: F, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: `1px solid ${C.bd}`, fontSize: 14, fontFamily: F, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
        {error && <p style={{ fontSize: 12, color: C.r, margin: "0 0 10px", fontFamily: F }}>{error}</p>}
        <button onClick={handleLogin} disabled={loading}
          style={{ width: "100%", padding: "13px", background: C.navy, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </div>
    </div>
  );
}

/* ─── DATE PICKER ─── */
function DatePicker({ preset, setPreset, customStart, setCustomStart, customEnd, setCustomEnd, rangeLabel, open, setOpen }) {
  const PRESETS = [
    { id: "last_month",      label: "Last Month" },
    { id: "current_quarter", label: "Current Quarter" },
    { id: "last_quarter",    label: "Last Quarter" },
    { id: "ytd",             label: "Year to Date" },
    { id: "last_year",       label: "Last Year" },
    { id: "custom",          label: "Custom Range…" },
  ];
  const now = new Date();
  const monthYearOpts = [];
  for (let i = 0; i < 36; i++) {
    let m = now.getMonth() - i, y = now.getFullYear();
    while (m < 0) { m += 12; y--; }
    monthYearOpts.push({ label: `${MONTHS[m].slice(0, 3)} ${y}`, year: y, month: m + 1 });
  }
  const selStyle = { padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.bd}`, fontSize: 12, fontFamily: F, fontWeight: 600, color: C.t, background: C.white, cursor: "pointer", outline: "none" };
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)}
        style={{ background: "#f0f2f5", border: `1px solid ${C.bd}`, borderRadius: 8, padding: "7px 14px", color: C.t, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: F }}>
        📅 {rangeLabel} <span style={{ fontSize: 10, color: C.tl }}>▼</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: C.white, border: `1px solid ${C.bd}`, borderRadius: 12, padding: "8px 0", zIndex: 300, width: 240, boxShadow: "0 8px 30px rgba(0,0,0,0.14)" }}>
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => { setPreset(p.id); if (p.id !== "custom") setOpen(false); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left", padding: "9px 16px", border: "none", cursor: "pointer", background: preset === p.id ? C.cyanL : "transparent", color: preset === p.id ? C.cyanD : C.t, fontSize: 13, fontWeight: 600, fontFamily: F }}>
              {p.label}
              {preset === p.id && <span style={{ fontSize: 11, color: C.cyanD }}>✓</span>}
            </button>
          ))}
          {preset === "custom" && (
            <div style={{ margin: "10px 16px 8px", padding: "12px", background: "#f8fafc", borderRadius: 8, border: `1px solid ${C.bd}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: F, marginBottom: 8 }}>Select Range</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.tl, fontFamily: F, marginBottom: 3 }}>Start</div>
                  <select value={`${customStart.year}-${customStart.month}`} onChange={e => { const [y, m] = e.target.value.split("-").map(Number); setCustomStart({ year: y, month: m }); if (customEnd.year < y || (customEnd.year === y && customEnd.month < m)) setCustomEnd({ year: y, month: m }); }} style={selStyle}>
                    {monthYearOpts.map((o, i) => <option key={i} value={`${o.year}-${o.month}`}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.tl, fontFamily: F, marginBottom: 3 }}>End</div>
                  <select value={`${customEnd.year}-${customEnd.month}`} onChange={e => { const [y, m] = e.target.value.split("-").map(Number); setCustomEnd({ year: y, month: m }); }} style={selStyle}>
                    {monthYearOpts.filter(o => o.year > customStart.year || (o.year === customStart.year && o.month >= customStart.month)).map((o, i) => <option key={i} value={`${o.year}-${o.month}`}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ marginTop: 10, width: "100%", padding: "7px", background: C.cyanD, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F }}>Apply</button>
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

  const { month: lcm, year: lcy } = getLastComplete();
  const [preset, setPreset]           = useState("last_month");
  const [customStart, setCustomStart] = useState({ year: lcy, month: lcm });
  const [customEnd, setCustomEnd]     = useState({ year: lcy, month: lcm });
  const [compIdx, setCompIdx]         = useState(0);

  const [reportData, setReportData]   = useState({});
  const [compData, setCompData]       = useState([{}, {}]);
  const [services, setServices]       = useState({});
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError]     = useState(null);
  const [trendData, setTrendData]     = useState({});
  const [winW, setWinW]               = useState(typeof window !== "undefined" ? window.innerWidth : 1280);

  useEffect(() => {
    const handler = () => setWinW(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  const isMobile = winW < 768;

  const range      = getMonthRange(preset, customStart, customEnd);
  const [cr0, cr1] = getCompRanges(range);
  const rangeKey   = range.map(toMonthStr).join(",");
  const rangeLabel = presetLabel(preset, range);
  const compLabels = [`vs ${rangeToLabel(cr0)}`, `vs ${rangeToLabel(cr1)}`];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => { setSession(s); setAuthLoading(false); });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const fetchClients = async () => {
      setClientsLoading(true);
      const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", session.user.id).single();
      const isAdmin = ["admin", "editor", "account_manager"].includes(profile?.role?.toLowerCase());
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

  useEffect(() => {
    if (!selectedClient) return;
    const load = async () => {
      setDataLoading(true); setDataError(null);
      try {
        const nowD = new Date();
        const trendMonths = Array.from({ length: 12 }, (_, i) => {
          let m = nowD.getMonth() - 11 + i, y = nowD.getFullYear();
          while (m < 0) { m += 12; y--; }
          return { year: y, month: m + 1 };
        });
        const allMonths = [...range, ...cr0, ...cr1, ...trendMonths];
        const unique = [...new Map(allMonths.map(m => [toMonthStr(m), m])).values()];
        const monthStrs = unique.map(toMonthStr);

        const [{ data: allRows }, { data: svcRows }] = await Promise.all([
          supabase.from("report_data").select("department, data, month").eq("client_id", selectedClient.id).in("month", monthStrs),
          supabase.from("client_services").select("department, enabled").eq("client_id", selectedClient.id),
        ]);

        const byMonth = {};
        (allRows || []).forEach(r => {
          const key = typeof r.month === "string" ? r.month.substring(0, 10) : toMonthStr(r);
          if (!byMonth[key]) byMonth[key] = {};
          byMonth[key][r.department] = r.data || {};
        });

        setReportData(aggregateRange(range, byMonth));
        setCompData([aggregateRange(cr0, byMonth), aggregateRange(cr1, byMonth)]);

        const TREND_DEPTS = ["seo", "gbp", "google_ads", "meta_ads", "social", "callrail", "leads", "creative"];
        const builtTrend = {};
        TREND_DEPTS.forEach(dept => {
          builtTrend[dept] = trendMonths.map(({ year, month }) => {
            const key = toMonthStr({ year, month });
            const d = byMonth[key]?.[dept] || {};
            return { label: MONTHS[month - 1].slice(0, 3) + " " + String(year).slice(-2), year, month, ...d };
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
      case "dashboard":  return <Dashboard data={reportData} cd={cd} services={services} clientName={selectedClient?.name} leadTrend={trendData.leads || []} setActiveTab={setActiveTab} isMobile={isMobile} />;
      case "seo":        return svcEnabled("seo")        ? <SeoPage       d={reportData.seo}        cd={cd.seo        || {}} trend={trendData.seo        || []} /> : <DisabledDept label="SEO" />;
      case "gbp":        return svcEnabled("gbp")        ? <GbpPage       d={reportData.gbp}        cd={cd.gbp        || {}} trend={trendData.gbp        || []} clientName={selectedClient?.name} /> : <DisabledDept label="Google Business Profile" />;
      case "google_ads": return svcEnabled("google_ads") ? <GoogleAdsPage d={reportData.google_ads} cd={cd.google_ads || {}} trend={trendData.google_ads || []} /> : <DisabledDept label="Google Ads" />;
      case "meta_ads":   return svcEnabled("meta_ads")   ? <MetaAdsPage   d={reportData.meta_ads}   cd={cd.meta_ads   || {}} trend={trendData.meta_ads   || []} /> : <DisabledDept label="Meta Ads" />;
      case "social":     return svcEnabled("social")     ? <SocialPage    d={reportData.social}     cd={cd.social     || {}} trend={trendData.social     || []} /> : <DisabledDept label="Organic Social" />;
      case "email":      return svcEnabled("email")      ? <EmailPage     d={reportData.email}      cd={cd.email      || {}} seoData={reportData.seo || {}} seoDataCmp={cd.seo || {}} trend={trendData.email || []} /> : <DisabledDept label="Email" />;
      case "creative":   return svcEnabled("creative")   ? <CreativePage  d={reportData.creative}   trend={trendData.creative || []} /> : <DisabledDept label="Creative" />;
      default:           return <Dashboard data={reportData} cd={cd} services={services} clientName={selectedClient?.name} leadTrend={trendData.leads || []} setActiveTab={setActiveTab} isMobile={isMobile} />;
    }
  };

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

      {/* HEADER */}
      <div style={{ background: C.white, padding: isMobile ? "0 12px" : "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.bd}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", flexShrink: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10 }}>
          <img src="/Taggart_Advertising_Logo.png" alt="Taggart" style={{ height: isMobile ? 36 : 44, width: "auto" }} />
          {!isMobile && <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 22, color: C.navy, letterSpacing: "-0.5px" }}>TAGGART</span>}
          {!isMobile && <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 22, color: C.cyan, letterSpacing: "-0.5px" }}>ADVERTISING</span>}
          {clients.length > 1 && (
            <>
              <div style={{ width: 1, height: 30, background: C.bd, margin: "0 6px" }} />
              <div style={{ position: "relative" }}>
                <button onClick={() => { setClientMenuOpen(!clientMenuOpen); setDatePickerOpen(false); }}
                  style={{ background: "#f0f2f5", border: `1px solid ${C.bd}`, borderRadius: 8, padding: "7px 14px", color: C.t, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: F }}>
                  {selectedClient?.name} <span style={{ fontSize: 10, color: C.tl }}>▼</span>
                </button>
                {clientMenuOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, background: C.white, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "6px 0", zIndex: 200, width: 260, maxHeight: 400, overflowY: "auto", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}>
                    {groups.map(g => (
                      <div key={g}>
                        <div style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: F }}>{g}</div>
                        {clients.filter(c => c.group_name === g).map(c => (
                          <button key={c.id} onClick={() => { setSelectedClient(c); setClientMenuOpen(false); setActiveTab("dashboard"); }}
                            style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", border: "none", cursor: "pointer", background: c.id === selectedClient?.id ? C.cyanL : "transparent", color: c.id === selectedClient?.id ? C.cyanD : C.t, fontSize: 13, fontWeight: 600, fontFamily: F }}>
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
          <DatePicker preset={preset} setPreset={setPreset} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd} rangeLabel={rangeLabel} open={datePickerOpen} setOpen={(v) => { setDatePickerOpen(v); if (v) setClientMenuOpen(false); }} />
          <button onClick={handleLogout} style={{ background: "#f0f2f5", border: `1px solid ${C.bd}`, borderRadius: 8, padding: "7px 14px", color: C.t, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F }}>Sign Out</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.bd}`, padding: "0 24px", display: "flex", overflowX: "auto", flexShrink: 0, zIndex: 40 }}>
        {DEPT_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: "11px 16px", border: "none", cursor: "pointer", background: "transparent", fontSize: 13, fontWeight: 600, fontFamily: F, color: activeTab === t.id ? C.cyanD : C.tl, borderBottom: activeTab === t.id ? `2.5px solid ${C.cyan}` : "2.5px solid transparent", whiteSpace: "nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* COMPARISON BAR */}
      <div style={{ background: "rgba(230,249,252,0.5)", padding: "6px 24px", borderBottom: `1px solid ${C.bl2}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: C.cyanD, fontFamily: F, fontWeight: 700 }}>Comparing:</span>
        {compLabels.map((label, i) => (
          <button key={i} onClick={() => setCompIdx(i)}
            style={{ fontSize: 11, fontFamily: F, fontWeight: 600, padding: "3px 10px", borderRadius: 6, cursor: "pointer", background: compIdx === i ? C.cyanD : C.white, color: compIdx === i ? "#fff" : C.t, border: `1px solid ${compIdx === i ? C.cyanD : C.bd}` }}>
            {label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, padding: isMobile ? "16px 12px" : "24px 24px", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" }} onClick={closeMenus}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.t, margin: 0, fontFamily: FS }}>{selectedClient?.name}</h1>
          <p style={{ fontSize: 13, color: C.tl, margin: "3px 0 0", fontFamily: F }}>Performance Report — {rangeLabel}</p>
        </div>
        {renderPage()}
      </div>

      {/* FOOTER */}
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
