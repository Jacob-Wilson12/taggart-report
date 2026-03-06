'use client';
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabase";

const C = {
  white: "#fff", navy: "#0c1a2e", cyan: "#00c9e8", cyanD: "#00a5bf",
  cyanL: "#e6f9fc", t: "#1a1a2e", tl: "#6b7280", bd: "#d0d5dd",
  bl2: "#e4e7ec", g: "#10b981", gL: "#f0fdf4", r: "#ef4444", rL: "#fef2f2",
  o: "#f59e0b", oL: "#fffbeb", p: "#8b5cf6", pL: "#f5f3ff",
  sh: "0 2px 6px rgba(0,0,0,0.08)", bg: "#f0f2f5"
};
const F = "Inter,system-ui,sans-serif";

const DEPARTMENTS = [
  { id: "leads",      label: "Leads & CRM",    icon: "🎯" },
  { id: "callrail",   label: "CallRail",        icon: "📞" },
  { id: "seo",        label: "SEO",             icon: "🔍" },
  { id: "gbp",        label: "Google Business", icon: "📍" },
  { id: "google_ads", label: "Google Ads",      icon: "📢" },
  { id: "meta_ads",   label: "Meta Ads",        icon: "📱" },
  { id: "social",     label: "Organic Social",  icon: "🎬" },
  { id: "email",      label: "Email",           icon: "✉️" },
  { id: "creative",   label: "Creative",        icon: "🎨" },
];

const LIVE_APIS = {
  seo: { label: "Search Console", endpoint: "/api/search-console" },
  seo_ga4: { label: "GA4", endpoint: "/api/ga4" },
};

const DEPT_FIELDS = {
  leads: [
    { key: "total_leads",      label: "Total Leads",         type: "number" },
    { key: "website_leads",    label: "Website Leads",       type: "number" },
    { key: "third_party",      label: "Third Party Leads",   type: "number" },
    { key: "facebook_leads",   label: "Facebook Leads",      type: "number" },
    { key: "total_sold",       label: "Total Sold",          type: "number" },
    { key: "website_sold",     label: "Website Sold",        type: "number" },
    { key: "third_party_sold", label: "Third Party Sold",    type: "number" },
    { key: "facebook_sold",    label: "Facebook Sold",       type: "number" },
    { key: "phone_sold",       label: "Phone Sold",          type: "number" },
    { key: "notes",            label: "Notes",               type: "textarea" },
  ],
  callrail: [
    { key: "total_calls",   label: "Total Calls",        type: "number" },
    { key: "website_calls", label: "Calls from Website", type: "number" },
    { key: "ads_calls",     label: "Calls from Ads",     type: "number" },
    { key: "gbp_calls",     label: "Calls from GBP",     type: "number" },
    { key: "notes",         label: "Notes",              type: "textarea" },
  ],
  seo: [
    { key: "phone_calls",        label: "Phone Calls (SEO)",        type: "number",   manual: true },
    { key: "form_submissions",   label: "Form Submissions",         type: "number",   manual: true },
    { key: "organic_sessions",   label: "Organic Sessions",         type: "number",   manual: true },
    { key: "vdp_views",          label: "VDP Views",                type: "number",   manual: true },
    { key: "direction_requests", label: "Direction Requests",       type: "number",   manual: true },
    { key: "chat_conversations", label: "Chat Conversations",       type: "number",   manual: true },
    { key: "ctr",                label: "CTR (%)",                  type: "decimal",  api: true },
    { key: "impressions",        label: "Impressions",              type: "number",   api: true },
    { key: "page1_keywords",     label: "Page 1 Keywords",          type: "number",   api: true },
    { key: "avg_position",       label: "Avg Position",             type: "decimal",  api: true },
    { key: "top_query",          label: "Top Performing Query",     type: "text",     api: true },
    { key: "work_completed",     label: "Work Completed",           type: "textarea", manual: true },
    { key: "wins",               label: "Wins",                     type: "textarea", manual: true, hint: "One per line" },
    { key: "losses",             label: "Losses / Watch Items",     type: "textarea", manual: true, hint: "One per line" },
    { key: "next_month",         label: "What's Coming Next Month", type: "textarea", manual: true, hint: "One per line" },
  ],
  gbp: [
    { key: "profile_views",      label: "Profile Views",          type: "number" },
    { key: "search_appearances", label: "Search Appearances",     type: "number" },
    { key: "map_views",          label: "Map Views",              type: "number" },
    { key: "website_clicks",     label: "Website Clicks",         type: "number" },
    { key: "phone_calls",        label: "Phone Calls",            type: "number" },
    { key: "direction_requests", label: "Direction Requests",     type: "number" },
    { key: "review_count",       label: "Total Reviews",          type: "number" },
    { key: "avg_rating",         label: "Average Rating",         type: "decimal" },
    { key: "new_reviews",        label: "New Reviews This Month", type: "number" },
    { key: "photo_count",        label: "Photos on Profile",      type: "number" },
    { key: "posts_published",    label: "Posts Published",        type: "number" },
    { key: "work_completed",     label: "Work Completed",         type: "textarea" },
    { key: "wins",               label: "Wins",                   type: "textarea", hint: "One per line" },
    { key: "losses",             label: "Losses / Watch Items",   type: "textarea", hint: "One per line" },
    { key: "next_month",         label: "What's Coming Next Month", type: "textarea", hint: "One per line" },
  ],
  google_ads: [
    { key: "conversions",      label: "Total Conversions",       type: "number" },
    { key: "cost_per_lead",    label: "Cost Per Lead ($)",       type: "decimal" },
    { key: "total_spend",      label: "Total Spend ($)",         type: "decimal" },
    { key: "budget",           label: "Monthly Budget ($)",      type: "decimal" },
    { key: "ctr",              label: "CTR (%)",                 type: "decimal" },
    { key: "cpc",              label: "Avg CPC ($)",             type: "decimal" },
    { key: "impression_share", label: "Impression Share (%)",    type: "decimal" },
    { key: "top_campaign",     label: "Top Performing Campaign", type: "text" },
    { key: "work_completed",   label: "Work Completed",          type: "textarea" },
    { key: "wins",             label: "Wins",                    type: "textarea", hint: "One per line" },
    { key: "losses",           label: "Losses / Watch Items",    type: "textarea", hint: "One per line" },
    { key: "next_month",       label: "What's Coming Next Month", type: "textarea", hint: "One per line" },
  ],
  meta_ads: [
    { key: "conversions",          label: "Total Conversions",        type: "number" },
    { key: "cost_per_lead",        label: "Cost Per Lead ($)",        type: "decimal" },
    { key: "reach",                label: "Reach",                    type: "number" },
    { key: "cpc",                  label: "Avg CPC ($)",              type: "decimal" },
    { key: "frequency",            label: "Frequency",                type: "decimal" },
    { key: "engagement_rate",      label: "Engagement Rate (%)",      type: "decimal" },
    { key: "lead_form_completion", label: "Lead Form Completion (%)", type: "decimal" },
    { key: "top_ad",               label: "Top Performing Ad",        type: "text" },
    { key: "work_completed",       label: "Work Completed",           type: "textarea" },
    { key: "wins",                 label: "Wins",                     type: "textarea", hint: "One per line" },
    { key: "losses",               label: "Losses / Watch Items",     type: "textarea", hint: "One per line" },
    { key: "next_month",           label: "What's Coming Next Month", type: "textarea", hint: "One per line" },
  ],
  social: [
    { key: "total_reach",      label: "Total Reach",            type: "number" },
    { key: "total_engagement", label: "Total Engagement",       type: "number" },
    { key: "new_followers",    label: "New Followers",          type: "number" },
    { key: "posts_published",  label: "Posts Published",        type: "number" },
    { key: "videos_published", label: "Videos Published",       type: "number" },
    { key: "website_clicks",   label: "Website Clicks",         type: "number" },
    { key: "ig_followers",     label: "Instagram Followers",    type: "number" },
    { key: "fb_followers",     label: "Facebook Followers",     type: "number" },
    { key: "tiktok_followers", label: "TikTok Followers",       type: "number" },
    { key: "yt_followers",     label: "YouTube Subscribers",    type: "number" },
    { key: "top_video",        label: "Top Performing Video",   type: "text" },
    { key: "top_video_views",  label: "Top Video Views",        type: "number" },
    { key: "work_completed",   label: "Work Completed",         type: "textarea" },
    { key: "wins",             label: "Wins",                   type: "textarea", hint: "One per line" },
    { key: "losses",           label: "Losses / Watch Items",   type: "textarea", hint: "One per line" },
    { key: "next_month",       label: "What's Coming Next Month", type: "textarea", hint: "One per line" },
  ],
  email: [
    { key: "campaigns_sent",   label: "Campaigns Sent",         type: "number" },
    { key: "total_recipients", label: "Total Recipients",       type: "number" },
    { key: "site_visits",      label: "Site Visits from Email", type: "number" },
    { key: "conversions",      label: "Conversions from Email", type: "number" },
    { key: "work_completed",   label: "Work Completed",         type: "textarea" },
    { key: "wins",             label: "Wins",                   type: "textarea", hint: "One per line" },
    { key: "losses",           label: "Losses / Watch Items",   type: "textarea", hint: "One per line" },
    { key: "next_month",       label: "What's Coming Next Month", type: "textarea", hint: "One per line" },
  ],
  creative: [
    { key: "total_assets", label: "Total Assets Delivered",   type: "number" },
    { key: "videos",       label: "Videos",                   type: "number" },
    { key: "graphics",     label: "Graphics / Statics",       type: "number" },
    { key: "banners",      label: "Banners",                  type: "number" },
    { key: "print",        label: "Print Pieces",             type: "number" },
    { key: "next_month",   label: "What's Coming Next Month", type: "textarea", hint: "One per line" },
  ],
};

const GOODE_MOTOR_GROUP = "Goode Motor Group";
const JUNEAU_OEM_LABEL = {
  "Juneau Auto Mall": "OEM", "Juneau Subaru": "Subaru",
  "Juneau CDJR": "CDJR", "Juneau Toyota": "Toyota",
  "Juneau Chevrolet": "Chevrolet", "Juneau Honda": "Honda",
};
const JUNEAU_LEAD_SOURCE = "Juneau Auto Mall";
const SHARED_KEYS = ["total_leads","total_sold","website_leads","website_sold","facebook_leads","facebook_sold","phone_sold","notes"];
const leadsFieldsJuneau = (oemLabel) => [
  { key: "total_leads",    label: "Total Leads",       type: "number" },
  { key: "website_leads",  label: "Website Leads",     type: "number" },
  { key: "oem_leads",      label: `${oemLabel} Leads`, type: "number" },
  { key: "facebook_leads", label: "Facebook Leads",    type: "number" },
  { key: "total_sold",     label: "Total Sold",        type: "number" },
  { key: "website_sold",   label: "Website Sold",      type: "number" },
  { key: "oem_sold",       label: `${oemLabel} Sold`,  type: "number" },
  { key: "facebook_sold",  label: "Facebook Sold",     type: "number" },
  { key: "phone_sold",     label: "Phone Sold",        type: "number" },
  { key: "notes",          label: "Notes",             type: "textarea" },
];
const LEADS_FIELDS_GOODE = [
  { key: "total_leads",  label: "Total Leads (All Brands)", type: "number" },
  { key: "ford_leads",   label: "Ford Leads",               type: "number" },
  { key: "ford_sold",    label: "Ford Sold",                type: "number" },
  { key: "mazda_leads",  label: "Mazda Leads",              type: "number" },
  { key: "mazda_sold",   label: "Mazda Sold",               type: "number" },
  { key: "vw_leads",     label: "Volkswagen Leads",         type: "number" },
  { key: "vw_sold",      label: "Volkswagen Sold",          type: "number" },
  { key: "total_sold",   label: "Total Sold",               type: "number" },
  { key: "notes",        label: "Notes",                    type: "textarea" },
];
const MONTHS = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

function getBackfillMonths() {
  const months = [];
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  let cur = new Date(2024, 0, 1);
  while (cur <= end) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() + 1 });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return months;
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const canEdit = (role, department, deptId) => {
  if (role === "admin" || role === "account_manager") return true;
  if (role === "editor" && department === deptId) return true;
  return false;
};
const canPublish = (role) => role === "admin" || role === "account_manager";
/* ─── UI HELPERS ─── */
const Badge = ({ label, color = C.cyan }) => (
  <span style={{ background: color + "22", color, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: F }}>{label}</span>
);
const StatusBadge = ({ status }) => {
  const map = { draft: { label: "Draft", color: C.tl }, in_progress: { label: "In Progress", color: C.o }, review: { label: "Ready for Review", color: C.p }, published: { label: "Published", color: C.g } };
  const s = map[status] || map.draft;
  return <Badge label={s.label} color={s.color} />;
};
const CompletionBar = ({ filled, total }) => {
  const pct = total === 0 ? 0 : Math.round((filled / total) * 100);
  const color = pct === 100 ? C.g : pct >= 50 ? C.o : C.r;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, background: C.bl2, borderRadius: 4, height: 6 }}>
        <div style={{ background: color, borderRadius: 4, height: 6, width: `${pct}%`, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 11, color: C.tl, fontFamily: F, minWidth: 36 }}>{filled}/{total}</span>
    </div>
  );
};

/* ─── BACKFILL MODAL ─── */
function BackfillModal({ clients, onClose }) {
  const backfillMonths = getBackfillMonths();
  const apiDepts = Object.entries(LIVE_APIS);
  const total = clients.length * backfillMonths.length * apiDepts.length;
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentLabel, setCurrentLabel] = useState("");
  const [log, setLog] = useState([]);
  const [counts, setCounts] = useState({ success: 0, skipped: 0, error: 0 });

  const addLog = (msg, type = "info") => setLog(prev => [...prev.slice(-49), { msg, type, ts: new Date().toLocaleTimeString() }]);

  const handleRun = async () => {
    setRunning(true); setLog([]); setProgress(0); setCounts({ success: 0, skipped: 0, error: 0 });
    let completed = 0, success = 0, skipped = 0, error = 0;
    for (const client of clients) {
      for (const { year, month } of backfillMonths) {
        for (const [deptId, api] of apiDepts) {
          const label = `${client.name} · ${MONTHS[month - 1]} ${year} · ${api.label}`;
          setCurrentLabel(label);
          try {
            const res = await fetch(`${api.endpoint}?client_id=${client.id}&year=${year}&month=${month}&save=true`);
            const json = await res.json();
            if (json.success && json.saved) {
              success++; addLog(`✓ ${label}`, "success");
            } else if (json.error?.includes("No Search Console")) {
              skipped++; addLog(`— ${client.name} · No integration configured`, "skip");
            } else {
              error++; addLog(`⚠ ${label}: ${json.error || "failed"}`, "error");
            }
          } catch (e) {
            error++; addLog(`✗ ${label}: ${e.message}`, "error");
          }
          completed++;
          setProgress(completed);
          setCounts({ success, skipped, error });
          await sleep(200);
        }
      }
    }
    setRunning(false); setDone(true); setCurrentLabel("");
    addLog(`✅ Backfill complete — ${success} saved, ${skipped} skipped, ${error} errors`, "done");
  };

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.bd}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.t, fontFamily: F }}>Historical Data Backfill</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: C.tl, fontFamily: F }}>
              {clients.length} clients × {backfillMonths.length} months × {apiDepts.length} API{apiDepts.length !== 1 ? "s" : ""} = <strong>{total} requests</strong> · Jan 2024 → last month
            </p>
          </div>
          {!running && <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.tl, padding: 4 }}>✕</button>}
        </div>
        <div style={{ padding: 24, flex: 1, overflow: "auto" }}>
          {!running && !done && (
            <div>
              <div style={{ background: C.oL, border: `1px solid ${C.o}44`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.o, marginBottom: 6, fontFamily: F }}>⚠ Before you run this</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: C.t, fontFamily: F, lineHeight: 1.8 }}>
                  <li>This will take approximately <strong>{Math.round(total * 0.2 / 60)} minutes</strong> to complete</li>
                  <li>Keep this browser tab open the entire time</li>
                  <li>It will not overwrite any manually entered data</li>
                  <li>Clients without a Search Console integration will be skipped</li>
                  <li>Goode Ford will be skipped until its domain is verified</li>
                </ul>
              </div>
              <div style={{ background: "#f8fafc", border: `1px solid ${C.bd}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, fontFamily: F }}>What will be pulled</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {apiDepts.map(([deptId, api]) => (
                    <div key={deptId} style={{ background: C.cyanL, color: C.cyanD, borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, fontFamily: F }}>{api.label}</div>
                  ))}
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: C.tl, fontFamily: F }}>
                  Months: {MONTHS[backfillMonths[0].month - 1]} {backfillMonths[0].year} → {MONTHS[backfillMonths[backfillMonths.length - 1].month - 1]} {backfillMonths[backfillMonths.length - 1].year}
                </div>
              </div>
            </div>
          )}
          {(running || done) && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.t, fontFamily: F }}>{done ? "Complete" : "Running..."}</span>
                <span style={{ fontSize: 13, color: C.tl, fontFamily: F }}>{progress} / {total} ({pct}%)</span>
              </div>
              <div style={{ background: C.bl2, borderRadius: 6, height: 10, marginBottom: 12 }}>
                <div style={{ background: done ? C.g : C.cyan, borderRadius: 6, height: 10, width: `${pct}%`, transition: "width 0.3s" }} />
              </div>
              {currentLabel && <div style={{ fontSize: 12, color: C.tl, fontFamily: F, marginBottom: 12 }}>↻ {currentLabel}</div>}
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                {[{ label: "Saved", value: counts.success, color: C.g }, { label: "Skipped", value: counts.skipped, color: C.tl }, { label: "Errors", value: counts.error, color: C.r }].map(s => (
                  <div key={s.label} style={{ background: "#f8fafc", border: `1px solid ${C.bd}`, borderRadius: 8, padding: "10px 16px", flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: F }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: C.tl, fontFamily: F }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {log.length > 0 && (
            <div style={{ background: "#0c1a2e", borderRadius: 10, padding: 14, maxHeight: 240, overflow: "auto", fontFamily: "monospace", fontSize: 11, lineHeight: 1.8 }}>
              {log.map((entry, i) => (
                <div key={i} style={{ color: entry.type === "success" ? "#6ee7b7" : entry.type === "error" ? "#fca5a5" : entry.type === "skip" ? "#9ca3af" : entry.type === "done" ? C.cyan : "#e5e7eb" }}>
                  <span style={{ color: "#6b7280", marginRight: 8 }}>{entry.ts}</span>{entry.msg}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.bd}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          {!running && !done && (
            <>
              <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.bd}`, borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, color: C.t }}>Cancel</button>
              <button onClick={handleRun} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F }}>⬇ Start Backfill</button>
            </>
          )}
          {done && <button onClick={onClose} style={{ background: C.g, color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F }}>Done</button>}
          {running && <div style={{ fontSize: 13, color: C.tl, fontFamily: F, alignSelf: "center" }}>Do not close this tab...</div>}
        </div>
      </div>
    </div>
  );
}

/* ─── API PULL BUTTON ─── */
const ApiPullButton = ({ deptId, clientId, year, monthIdx, onPulled }) => {
  const api = LIVE_APIS[deptId];
  const [pulling, setPulling] = useState(false);
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState("");
  if (!api) return null;
  const handlePull = async () => {
    setPulling(true); setResult(null); setMsg("");
    try {
      const res = await fetch(`${api.endpoint}?client_id=${clientId}&year=${year}&month=${monthIdx + 1}&save=true`);
      const json = await res.json();
      if (json.success && json.saved) {
        setResult("success");
        setMsg(json.data._pulled_at ? `Pulled at ${new Date(json.data._pulled_at).toLocaleTimeString()}` : "");
        if (onPulled) onPulled(deptId);
      } else { setResult("error"); setMsg(json.error || json.save_error || "Unknown error"); }
    } catch (e) { setResult("error"); setMsg(e.message); }
    setPulling(false);
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={handlePull} disabled={pulling} style={{ background: result === "success" ? C.gL : result === "error" ? C.rL : C.cyanL, color: result === "success" ? "#166534" : result === "error" ? C.r : C.cyanD, border: `1px solid ${result === "success" ? "#bbf7d0" : result === "error" ? "#fecaca" : C.cyan + "44"}`, borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: pulling ? "not-allowed" : "pointer", fontFamily: F, display: "flex", alignItems: "center", gap: 6, opacity: pulling ? 0.7 : 1 }}>
        {pulling ? "↻ Pulling..." : result === "success" ? `✓ Pulled from ${api.label}` : result === "error" ? `⚠ Retry ${api.label}` : `⬇ Pull from ${api.label}`}
      </button>
      {msg && <span style={{ fontSize: 11, color: result === "error" ? C.r : C.tl, fontFamily: F }}>{msg}</span>}
    </div>
  );
};

/* ─── FIELD INPUT ─── */
const FieldInput = ({ field, value, onChange, disabled }) => {
  const base = { width: "100%", padding: "10px 12px", borderRadius: 7, border: `1px solid ${field.api && value ? C.cyan + "88" : C.bd}`, fontSize: 13, fontFamily: F, outline: "none", boxSizing: "border-box", background: disabled ? "#f8fafc" : C.white, color: disabled ? C.tl : C.t, cursor: disabled ? "not-allowed" : "text" };
  if (field.type === "textarea") return (
    <textarea value={value || ""} onChange={e => onChange(field.key, e.target.value)} disabled={disabled} rows={3} placeholder={field.hint || `Enter ${field.label.toLowerCase()}...`} style={{ ...base, resize: "vertical", lineHeight: 1.5 }} />
  );
  return <input type={field.type === "number" || field.type === "decimal" ? "number" : "text"} step={field.type === "decimal" ? "0.01" : "1"} value={value || ""} onChange={e => onChange(field.key, e.target.value)} disabled={disabled} placeholder={field.hint || "0"} style={base} />;
};
/* ─── DEPT FORM ─── */
function DeptForm({ dept, clientId, clientName, month, monthIdx, year, userRole, userDept, onSaved, allClients, onApiPulled }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isGoode        = dept.id === "leads" && clientName === GOODE_MOTOR_GROUP;
  const oemLabel       = dept.id === "leads" ? JUNEAU_OEM_LABEL[clientName] : null;
  const isJuneau       = !!oemLabel;
  const isJuneauSource = isJuneau && clientName === JUNEAU_LEAD_SOURCE;
  const isJuneauChild  = isJuneau && !isJuneauSource;

  const fields = isGoode ? LEADS_FIELDS_GOODE : isJuneau ? leadsFieldsJuneau(oemLabel) : (DEPT_FIELDS[dept.id] || []);
  const editable = canEdit(userRole, userDept, dept.id);
  const apiFields = fields.filter(f => f.api);
  const manualFields = fields.filter(f => !f.api);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: row } = await supabase.from("report_data").select("data")
      .eq("client_id", clientId).eq("month", month).eq("department", dept.id).single();
    setData(row?.data || {});
    setLoading(false);
  }, [clientId, month, dept.id]);

  useEffect(() => { load(); }, [load]);

  const handleApiPulled = useCallback(async (deptId) => {
    if (deptId === dept.id) { await load(); setSaved(false); }
    if (onApiPulled) onApiPulled(deptId);
  }, [dept.id, load, onApiPulled]);

  const handleChange = (key, val) => { setData(prev => ({ ...prev, [key]: val })); setSaved(false); };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const ts = { last_updated_by: user.id, last_updated_at: new Date().toISOString() };
    await supabase.from("report_data").upsert(
      { client_id: clientId, month, department: dept.id, data, ...ts },
      { onConflict: "client_id,month,department" }
    );
    if (isJuneauSource && allClients) {
      const sharedPayload = Object.fromEntries(SHARED_KEYS.map(k => [k, data[k] ?? null]));
      const siblings = allClients.filter(c => JUNEAU_OEM_LABEL[c.name] && c.name !== JUNEAU_LEAD_SOURCE);
      await Promise.all(siblings.map(async (sibling) => {
        const { data: existing } = await supabase.from("report_data").select("data")
          .eq("client_id", sibling.id).eq("month", month).eq("department", "leads").single();
        const merged = { ...(existing?.data || {}), ...sharedPayload };
        await supabase.from("report_data").upsert(
          { client_id: sibling.id, month, department: "leads", data: merged, ...ts },
          { onConflict: "client_id,month,department" }
        );
      }));
    }
    setSaving(false); setSaved(true);
    if (onSaved) onSaved(dept.id);
  };

  const filledCount = fields.filter(f => data[f.key] && String(data[f.key]).trim() !== "").length;
  const pulledAt = data._pulled_at ? new Date(data._pulled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : null;

  if (loading) return <div style={{ padding: 24, textAlign: "center", color: C.tl, fontFamily: F, fontSize: 13 }}>Loading...</div>;

  return (
    <div>
      {LIVE_APIS[dept.id] && (
        <div style={{ background: pulledAt ? C.gL : C.cyanL, border: `1px solid ${pulledAt ? "#bbf7d0" : C.cyan + "44"}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 12, color: pulledAt ? "#166534" : C.cyanD, fontFamily: F }}>
            {pulledAt ? `✓ Last pulled: ${pulledAt}` : "⬇ No API data yet — click Pull to fetch automatically"}
          </div>
          <ApiPullButton deptId={dept.id} clientId={clientId} year={year} monthIdx={monthIdx} onPulled={handleApiPulled} />
        </div>
      )}
      {isJuneauSource && <div style={{ background: C.gL, border: `1px solid ${C.g}44`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#166534", fontFamily: F }}>📡 Saving here syncs Total, Website, Facebook & Phone leads to all Juneau stores.</div>}
      {isJuneauChild && <div style={{ background: C.cyanL, border: `1px solid ${C.cyan}44`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: C.cyanD, fontFamily: F }}>🔗 Total, Website, Facebook & Phone synced from Juneau Auto Mall. Enter {oemLabel} leads here.</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: C.tl, fontFamily: F }}>{filledCount} of {fields.length} fields filled</div>
          <CompletionBar filled={filledCount} total={fields.length} />
        </div>
        {editable && (
          <button onClick={handleSave} disabled={saving} style={{ background: saved ? C.g : C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F, minWidth: 100 }}>
            {saving ? "Saving..." : saved ? "✓ Saved" : isJuneauSource ? "Save & Sync" : "Save"}
          </button>
        )}
      </div>
      {!editable && <div style={{ background: C.oL, border: `1px solid ${C.o}22`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: C.o, fontFamily: F }}>👁 View only — you can edit <strong>{userDept}</strong> data only.</div>}
      {apiFields.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.cyanD, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, fontFamily: F }}>
            ⬇ Auto-filled by API {pulledAt && <span style={{ fontWeight: 400, color: C.tl, textTransform: "none", letterSpacing: 0 }}>— editable if needed</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14, background: C.cyanL, borderRadius: 10, padding: 16, border: `1px solid ${C.cyan}22` }}>
            {apiFields.map(field => (
              <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.cyanD, fontFamily: F }}>{field.label}</label>
                <FieldInput field={field} value={data[field.key]} onChange={handleChange} disabled={!editable} />
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {(apiFields.length > 0 ? manualFields : fields).map(field => {
          const isSharedField = isJuneauChild && SHARED_KEYS.includes(field.key);
          return (
            <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.t, fontFamily: F }}>
                {field.label}
                {isSharedField && <span style={{ color: C.cyan, fontWeight: 400, marginLeft: 6, fontSize: 11 }}>↔ synced</span>}
                {field.hint && <span style={{ color: C.tl, fontWeight: 400, marginLeft: 4 }}>({field.hint})</span>}
              </label>
              <FieldInput field={field} value={data[field.key]} onChange={handleChange} disabled={!editable || isSharedField} />
            </div>
          );
        })}
      </div>
      {isGoode && [data.ford_leads, data.mazda_leads, data.vw_leads].some(v => v) && (
        <div style={{ marginTop: 24, borderTop: `1px solid ${C.bd}`, paddingTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, fontFamily: F }}>Sold % by Brand (auto-calculated)</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[{ brand: "Ford", leads: data.ford_leads, sold: data.ford_sold }, { brand: "Mazda", leads: data.mazda_leads, sold: data.mazda_sold }, { brand: "Volkswagen", leads: data.vw_leads, sold: data.vw_sold }].map(s => {
              const pct = s.leads > 0 && s.sold >= 0 ? Math.round((Number(s.sold) / Number(s.leads)) * 1000) / 10 : null;
              return (
                <div key={s.brand} style={{ background: C.white, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "14px 20px", flex: 1, minWidth: 120, textAlign: "center", boxShadow: C.sh }}>
                  <div style={{ fontSize: 11, color: C.tl, fontWeight: 700, textTransform: "uppercase", fontFamily: F, marginBottom: 4 }}>{s.brand}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: pct !== null ? C.cyan : C.tl, fontFamily: F }}>{pct !== null ? `${pct}%` : "—"}</div>
                  <div style={{ fontSize: 11, color: C.tl, marginTop: 2, fontFamily: F }}>{s.sold || 0} sold / {s.leads || 0} leads</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
/* ─── CLIENT REPORT ─── */
function ClientReport({ client, userRole, userDept, onBack, allClients }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIdx, setMonthIdx] = useState(now.getMonth() === 0 ? 11 : now.getMonth() - 1);
  const [activeDept, setActiveDept] = useState(DEPARTMENTS[0].id);
  const [reportStatus, setReportStatus] = useState("draft");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [deptCompletion, setDeptCompletion] = useState({});
  const [pullingAll, setPullingAll] = useState(false);
  const [pullAllResult, setPullAllResult] = useState("");

  const month = `${year}-${String(monthIdx + 1).padStart(2, "0")}-01`;

  useEffect(() => {
    setDeptCompletion({}); setPullAllResult("");
    const loadStatus = async () => {
      const { data } = await supabase.from("monthly_reports").select("status").eq("client_id", client.id).eq("month", month).single();
      setReportStatus(data?.status || "draft");
    };
    loadStatus();
  }, [client.id, month]);

  const refreshCompletion = useCallback(async (deptId) => {
    const fields = DEPT_FIELDS[deptId] || [];
    const { data: row } = await supabase.from("report_data").select("data").eq("client_id", client.id).eq("month", month).eq("department", deptId).single();
    const filled = fields.filter(f => row?.data?.[f.key] && String(row.data[f.key]).trim() !== "").length;
    setDeptCompletion(prev => ({ ...prev, [deptId]: { filled, total: fields.length } }));
  }, [client.id, month]);

  const handleSaved = useCallback(async (deptId) => {
    await refreshCompletion(deptId);
    const { data: existing } = await supabase.from("monthly_reports").select("status").eq("client_id", client.id).eq("month", month).single();
    if (!existing) { await supabase.from("monthly_reports").insert({ client_id: client.id, month, status: "in_progress" }); setReportStatus("in_progress"); }
    else if (existing.status === "draft") { await supabase.from("monthly_reports").update({ status: "in_progress" }).eq("client_id", client.id).eq("month", month); setReportStatus("in_progress"); }
  }, [client.id, month, refreshCompletion]);

  const handlePullAll = async () => {
    setPullingAll(true); setPullAllResult("");
    const apiDepts = DEPARTMENTS.filter(d => LIVE_APIS[d.id]);
    const results = [];
    for (const dept of apiDepts) {
      const api = LIVE_APIS[dept.id];
      try {
        const res = await fetch(`${api.endpoint}?client_id=${client.id}&year=${year}&month=${monthIdx + 1}&save=true`);
        const json = await res.json();
        if (json.success && json.saved) { results.push(`✓ ${dept.label}`); await refreshCompletion(dept.id); }
        else results.push(`⚠ ${dept.label}: ${json.error || "failed"}`);
      } catch (e) { results.push(`✗ ${dept.label}: ${e.message}`); }
    }
    setPullAllResult(results.join(" · ")); setPullingAll(false);
  };

  const handlePublish = async () => {
    if (!canPublish(userRole)) return;
    setPublishing(true); setPublishError("");
    const { data: { user } } = await supabase.auth.getUser();
    const newStatus = reportStatus === "published" ? "in_progress" : "published";
    const ts = new Date().toISOString();
    const { data: existing } = await supabase.from("monthly_reports").select("id").eq("client_id", client.id).eq("month", month).single();
    let error;
    if (existing) {
      ({ error } = await supabase.from("monthly_reports").update({ status: newStatus, published_at: newStatus === "published" ? ts : null, published_by: newStatus === "published" ? user.id : null }).eq("client_id", client.id).eq("month", month));
    } else {
      ({ error } = await supabase.from("monthly_reports").insert({ client_id: client.id, month, status: newStatus, published_at: newStatus === "published" ? ts : null, published_by: newStatus === "published" ? user.id : null }));
    }
    if (error) setPublishError(`Error: ${error.message}`); else setReportStatus(newStatus);
    setPublishing(false);
  };

  const handleMarkReview = async () => {
    const { data: existing } = await supabase.from("monthly_reports").select("id").eq("client_id", client.id).eq("month", month).single();
    if (existing) await supabase.from("monthly_reports").update({ status: "review" }).eq("client_id", client.id).eq("month", month);
    else await supabase.from("monthly_reports").insert({ client_id: client.id, month, status: "review" });
    setReportStatus("review");
  };

  const activeDeptObj = DEPARTMENTS.find(d => d.id === activeDept);
  const apiDeptCount = DEPARTMENTS.filter(d => LIVE_APIS[d.id]).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.cyan, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: F, padding: 0 }}>← All Clients</button>
        <span style={{ color: C.tl }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.t, fontFamily: F }}>{client.name}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.t, margin: "0 0 4px", fontFamily: F }}>{client.name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusBadge status={reportStatus} />
            <span style={{ fontSize: 12, color: C.tl, fontFamily: F }}>{client.group_name}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={monthIdx} onChange={e => setMonthIdx(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${C.bd}`, fontSize: 13, fontFamily: F, background: C.white, cursor: "pointer" }}>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${C.bd}`, fontSize: 13, fontFamily: F, background: C.white, cursor: "pointer" }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={handlePullAll} disabled={pullingAll} style={{ background: C.cyanL, color: C.cyanD, border: `1px solid ${C.cyan}44`, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: pullingAll ? "not-allowed" : "pointer", fontFamily: F, opacity: pullingAll ? 0.7 : 1 }}>
            {pullingAll ? "⬇ Pulling..." : `⬇ Pull All APIs (${apiDeptCount})`}
          </button>
          {userRole !== "viewer" && reportStatus !== "published" && (
            <button onClick={handleMarkReview} style={{ background: C.pL, color: C.p, border: `1px solid ${C.p}44`, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F }}>Mark Ready for Review</button>
          )}
          {canPublish(userRole) && (
            <button onClick={handlePublish} disabled={publishing} style={{ background: reportStatus === "published" ? C.oL : C.g, color: reportStatus === "published" ? C.o : "#fff", border: reportStatus === "published" ? `1px solid ${C.o}44` : "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: publishing ? "not-allowed" : "pointer", fontFamily: F, opacity: publishing ? 0.7 : 1 }}>
              {publishing ? "..." : reportStatus === "published" ? "Unpublish" : "Publish Report"}
            </button>
          )}
        </div>
      </div>
      {pullAllResult && <div style={{ background: C.gL, border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#166534", fontFamily: F }}>{pullAllResult}</div>}
      {publishError && <div style={{ background: C.rL, border: "1px solid #fecaca", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: C.r, fontFamily: F }}>⚠️ {publishError}</div>}
      {reportStatus === "published" && <div style={{ background: C.gL, border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#166534", fontFamily: F }}>✓ This report is live. Clients can see it now.</div>}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {DEPARTMENTS.map(dept => {
            const comp = deptCompletion[dept.id];
            const isActive = activeDept === dept.id;
            const pct = comp ? Math.round((comp.filled / comp.total) * 100) : null;
            const hasApi = !!LIVE_APIS[dept.id];
            return (
              <button key={dept.id} onClick={() => setActiveDept(dept.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: isActive ? C.navy : C.white, color: isActive ? "#fff" : C.t, fontFamily: F, fontSize: 13, fontWeight: isActive ? 700 : 500, boxShadow: isActive ? "none" : C.sh, textAlign: "left" }}>
                <span>{dept.icon} {dept.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {hasApi && <span style={{ fontSize: 9, color: C.cyan, fontWeight: 700, background: isActive ? "rgba(0,201,232,0.2)" : "transparent", padding: "1px 4px", borderRadius: 3 }}>API</span>}
                  {pct !== null && <span style={{ fontSize: 10, fontWeight: 700, color: pct === 100 ? (isActive ? "#6ee7b7" : C.g) : (isActive ? "#fca5a5" : C.tl) }}>{pct}%</span>}
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1, background: C.white, borderRadius: 12, padding: 24, border: `1px solid ${C.bd}`, boxShadow: C.sh }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.t, margin: "0 0 4px", fontFamily: F }}>{activeDeptObj?.icon} {activeDeptObj?.label}</h3>
            <p style={{ fontSize: 12, color: C.tl, margin: 0, fontFamily: F }}>{MONTHS[monthIdx]} {year} — {client.name}</p>
          </div>
          <DeptForm dept={activeDeptObj} clientId={client.id} clientName={client.name} month={month} monthIdx={monthIdx} year={year} userRole={userRole} userDept={userDept} onSaved={handleSaved} allClients={allClients} onApiPulled={refreshCompletion} />
        </div>
      </div>
    </div>
  );
}
/* ─── OVERVIEW ─── */
function Overview({ clients, userRole, onSelectClient, onBackfill }) {
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? `${now.getFullYear() - 1}-12-01` : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}-01`;
  const [statuses, setStatuses] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("monthly_reports").select("client_id, status, month").in("client_id", clients.map(c => c.id));
      const map = {};
      (data || []).forEach(r => { map[`${r.client_id}_${r.month}`] = r.status; });
      setStatuses(map);
    };
    if (clients.length) load();
  }, [clients]);

  const groups = [...new Set(clients.map(c => c.group_name))];
  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const statusCounts = { draft: 0, in_progress: 0, review: 0, published: 0 };
  clients.forEach(c => { const s = statuses[`${c.id}_${lastMonth}`] || "draft"; statusCounts[s]++; });
  const backfillMonths = getBackfillMonths();
  const apiCount = Object.keys(LIVE_APIS).length;
  const totalBackfillRequests = clients.length * backfillMonths.length * apiCount;
  const estMinutes = Math.round(totalBackfillRequests * 0.2 / 60);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[{ label: "Total Clients", value: clients.length, color: C.navy }, { label: "Published", value: statusCounts.published, color: C.g }, { label: "In Review", value: statusCounts.review, color: C.p }, { label: "In Progress", value: statusCounts.in_progress, color: C.o }, { label: "Not Started", value: statusCounts.draft, color: C.tl }].map((s, i) => (
          <div key={i} style={{ background: C.white, borderRadius: 10, padding: "16px 20px", flex: 1, minWidth: 120, boxShadow: C.sh, border: `1px solid ${C.bd}`, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.tl, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, fontFamily: F }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: s.color, fontFamily: F }}>{s.value}</div>
          </div>
        ))}
      </div>

      {userRole === "admin" && (
        <div style={{ background: C.navy, borderRadius: 12, padding: "18px 24px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4, fontFamily: F }}>📥 Historical Data Backfill</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: F }}>
              Pull all Search Console data for all clients from Jan 2024 → last month · ~{totalBackfillRequests} requests · ~{estMinutes} min
            </div>
          </div>
          <button onClick={onBackfill} style={{ background: C.cyan, color: C.navy, border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F, whiteSpace: "nowrap" }}>
            ⬇ Run Backfill
          </button>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <input type="text" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", maxWidth: 320, padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.bd}`, fontSize: 13, fontFamily: F, outline: "none", boxSizing: "border-box" }} />
      </div>

      {groups.map(group => {
        const groupClients = filtered.filter(c => c.group_name === group);
        if (!groupClients.length) return null;
        return (
          <div key={group} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, fontFamily: F }}>{group}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {groupClients.map(client => {
                const status = statuses[`${client.id}_${lastMonth}`] || "draft";
                return (
                  <button key={client.id} onClick={() => onSelectClient(client)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.white, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "14px 20px", cursor: "pointer", textAlign: "left", boxShadow: C.sh, fontFamily: F }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = C.sh}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.t, marginBottom: 2 }}>{client.name}</div>
                      <div style={{ fontSize: 11, color: C.tl }}>Tier {client.tier} · Click to enter data</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <StatusBadge status={status} />
                      <span style={{ color: C.tl, fontSize: 18 }}>→</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── TEAM ─── */
function TeamPage({ currentUserId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviteDept, setInviteDept] = useState("seo");
  const [inviteMsg, setInviteMsg] = useState("");

  useEffect(() => {
    const load = async () => { setLoading(true); const { data } = await supabase.from("user_profiles").select("*").order("created_at"); setMembers(data || []); setLoading(false); };
    load();
  }, []);

  const handleRoleChange = async (id, role) => { await supabase.from("user_profiles").update({ role }).eq("id", id); setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m)); };
  const handleDeptChange = async (id, department) => { await supabase.from("user_profiles").update({ department }).eq("id", id); setMembers(prev => prev.map(m => m.id === id ? { ...m, department } : m)); };
  const handleInvite = () => {
    if (!inviteEmail) return;
    setInviteMsg(`To add ${inviteEmail}:\n1. Go to Supabase → Authentication → Users → Invite User\n2. Enter their email\n3. Run this SQL:\n\nINSERT INTO user_profiles (id, email, role, department, full_name)\nSELECT id, email, '${inviteRole}', '${inviteDept}', email\nFROM auth.users WHERE email = '${inviteEmail}';`);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.tl, fontFamily: F }}>Loading...</div>;

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: C.t, margin: "0 0 20px", fontFamily: F }}>Team Members</h3>
      <div style={{ background: C.white, border: `1px solid ${C.bd}`, borderRadius: 12, overflow: "hidden", boxShadow: C.sh, marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F, fontSize: 13 }}>
          <thead><tr style={{ background: "#f8fafc" }}>{["Name / Email","Role","Department","Added"].map(h => <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.tl, fontWeight: 600, fontSize: 12 }}>{h}</th>)}</tr></thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} style={{ borderTop: `1px solid ${C.bd}` }}>
                <td style={{ padding: "12px 16px" }}><div style={{ fontWeight: 600, color: C.t }}>{m.full_name || "—"}</div><div style={{ fontSize: 11, color: C.tl }}>{m.email}</div></td>
                <td style={{ padding: "12px 16px" }}>
                  {m.id === currentUserId ? <Badge label={m.role} color={C.cyan} /> : (
                    <select value={m.role || "editor"} onChange={e => handleRoleChange(m.id, e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.bd}`, fontSize: 12, fontFamily: F, cursor: "pointer" }}>
                      {["admin","account_manager","editor","viewer"].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  )}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {m.role === "editor" ? (
                    <select value={m.department || "seo"} onChange={e => handleDeptChange(m.id, e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.bd}`, fontSize: 12, fontFamily: F, cursor: "pointer" }}>
                      {["seo","ads","social","creative","account","admin"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  ) : <span style={{ fontSize: 12, color: C.tl }}>All departments</span>}
                </td>
                <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 11, color: C.tl }}>{new Date(m.created_at).toLocaleDateString()}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ background: C.white, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 20, boxShadow: C.sh }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: C.t, margin: "0 0 16px", fontFamily: F }}>Add Team Member</h4>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.tl, display: "block", marginBottom: 4, fontFamily: F }}>Email</label>
            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="name@email.com" style={{ width: "100%", padding: "10px 12px", borderRadius: 7, border: `1px solid ${C.bd}`, fontSize: 13, fontFamily: F, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.tl, display: "block", marginBottom: 4, fontFamily: F }}>Role</label>
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 7, border: `1px solid ${C.bd}`, fontSize: 13, fontFamily: F, cursor: "pointer" }}>
              {["admin","account_manager","editor","viewer"].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {inviteRole === "editor" && (
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.tl, display: "block", marginBottom: 4, fontFamily: F }}>Department</label>
              <select value={inviteDept} onChange={e => setInviteDept(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 7, border: `1px solid ${C.bd}`, fontSize: 13, fontFamily: F, cursor: "pointer" }}>
                {["seo","ads","social","creative","account"].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          <button onClick={handleInvite} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F }}>Get Instructions</button>
        </div>
        {inviteMsg && <div style={{ marginTop: 16, background: "#f8fafc", border: `1px solid ${C.bd}`, borderRadius: 8, padding: "12px 16px", fontSize: 12, fontFamily: "monospace", color: C.t, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{inviteMsg}</div>}
      </div>
    </div>
  );
}
/* ─── ROOT ─── */
export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activePage, setActivePage] = useState("overview");
  const [showBackfill, setShowBackfill] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => { setSession(session); setAuthLoading(false); });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      const { data: prof } = await supabase.from("user_profiles").select("*").eq("id", session.user.id).single();
      setProfile(prof);
      if (prof?.role === "viewer") return;
      let data;
      if (prof?.role === "admin") {
        ({ data } = await supabase.from("clients").select("id,name,group_name,tier").eq("active", true));
      } else {
        const { data: access } = await supabase.from("user_client_access").select("client_id").eq("user_id", session.user.id);
        const ids = access?.map(r => r.client_id) || [];
        ({ data } = await supabase.from("clients").select("id,name,group_name,tier").eq("active", true).in("id", ids));
      }
      const ORDER = ["Goode Motor Group","Goode Motor Ford","Goode Motor Mazda","Twin Falls Volkswagen","Juneau Auto Mall","Juneau Subaru","Juneau CDJR","Juneau Toyota","Juneau Chevrolet","Juneau Honda","Juneau Powersports","Cassia Car Rental","Explore Juneau"];
      setClients((data || []).sort((a, b) => {
        const ai = ORDER.indexOf(a.name), bi = ORDER.indexOf(b.name);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.name.localeCompare(b.name);
      }));
    };
    load();
  }, [session]);

  const handleLogout = async () => { await supabase.auth.signOut(); setSession(null); };

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#fff", fontFamily: F }}>Loading...</div>
    </div>
  );

  if (!session) return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F }}>
      <div style={{ background: C.white, borderRadius: 16, padding: "48px 40px", maxWidth: 400, textAlign: "center" }}>
        <img src="/Taggart_Advertising_Logo.png" alt="Taggart" style={{ height: 48, marginBottom: 20 }} />
        <p style={{ color: C.tl, fontSize: 13 }}>Please sign in through the main portal first.</p>
        <a href="/" style={{ display: "inline-block", marginTop: 12, padding: "10px 24px", background: C.navy, color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Go to Portal</a>
      </div>
    </div>
  );

  if (profile?.role === "viewer") return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F }}>
      <div style={{ background: C.white, borderRadius: 16, padding: "48px 40px", maxWidth: 400, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2 style={{ color: C.navy }}>Access Denied</h2>
        <p style={{ color: C.tl }}>The admin panel is for Taggart team members only.</p>
        <a href="/" style={{ display: "inline-block", marginTop: 12, padding: "10px 24px", background: C.navy, color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Back to Dashboard</a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", fontFamily: F, background: C.bg }}>
      {showBackfill && <BackfillModal clients={clients} onClose={() => setShowBackfill(false)} />}
      <div style={{ background: C.navy, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src="/Taggart_Advertising_Logo.png" alt="Taggart" style={{ height: 36 }} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: F }}>Admin Panel</span>
          <span style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{profile?.role}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{session.user.email}</span>
          <a href="/" style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>← Client View</a>
          <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: F }}>Sign Out</button>
        </div>
      </div>
      <div style={{ background: C.white, borderBottom: `1px solid ${C.bd}`, padding: "0 24px", display: "flex", gap: 4 }}>
        {[{ id: "overview", label: "📊 Overview" }, { id: "team", label: "👥 Team", adminOnly: true }]
          .filter(n => !n.adminOnly || profile?.role === "admin")
          .map(n => (
            <button key={n.id} onClick={() => { setActivePage(n.id); setSelectedClient(null); }}
              style={{ padding: "11px 16px", border: "none", cursor: "pointer", background: "transparent", fontSize: 13, fontWeight: 600, fontFamily: F, color: activePage === n.id ? C.cyanD : C.tl, borderBottom: activePage === n.id ? `2px solid ${C.cyan}` : "2px solid transparent" }}>
              {n.label}
            </button>
          ))}
      </div>
      <div style={{ padding: "28px 24px", maxWidth: 1200, margin: "0 auto" }}>
        {activePage === "overview" && !selectedClient && (
          <Overview clients={clients} userRole={profile?.role} onSelectClient={c => { setSelectedClient(c); setActivePage("overview"); }} onBackfill={() => setShowBackfill(true)} />
        )}
        {activePage === "overview" && selectedClient && (
          <ClientReport client={selectedClient} userRole={profile?.role} userDept={profile?.department} onBack={() => setSelectedClient(null)} allClients={clients} />
        )}
        {activePage === "team" && profile?.role === "admin" && (
          <TeamPage currentUserId={session.user.id} />
        )}
      </div>
    </div>
  );
}
