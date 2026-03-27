'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "../../../supabase";

const C = {
  white: "#fff", navy: "#0c1a2e", cyan: "#00c9e8", cyanD: "#00a5bf",
  cyanL: "#e6f9fc", t: "#1a1a2e", tl: "#6b7280", bd: "#d0d5dd",
  bl2: "#e4e7ec", g: "#10b981", gL: "#f0fdf4", r: "#ef4444",
  o: "#f59e0b", bg: "#f0f2f5"
};
const F = "Inter,system-ui,sans-serif";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Duration helpers: store as seconds, display/accept H:MM:SS
const parseDuration = (str) => {
  if (!str || str === "") return null;
  const s = String(str).trim();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const parts = s.split(":").map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
};
const fmtDuration = (sec) => {
  if (sec == null || sec === "") return "";
  const n = Number(sec);
  if (isNaN(n)) return String(sec);
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = Math.round(n % 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// ── Per-client lead field config ──────────────────────────────────────────────
const CLIENT_LEADS_CONFIG = {
  "Goode Motor Group":     { active: ["total_leads","ford_leads","mazda_leads","vw_leads","total_sold","ford_sold","mazda_sold","vw_sold"] },
  "Goode Motor Ford":      { active: ["total_leads","website_leads","third_party","facebook_leads","total_sold","website_sold","third_party_sold","facebook_sold"] },
  "Goode Motor Mazda":     { active: ["total_leads","website_leads","third_party","facebook_leads","total_sold","website_sold","third_party_sold","facebook_sold"] },
  "Twin Falls Volkswagen": { active: ["total_leads","website_leads","third_party","facebook_leads","total_sold","website_sold","third_party_sold","facebook_sold"] },
  "Juneau Auto Mall":      { active: ["total_leads","website_leads","oem_leads","facebook_leads","total_sold","website_sold","oem_sold","facebook_sold"], oemLabel: "OEM"    },
  "Juneau Subaru":         { active: ["total_leads","website_leads","oem_leads","facebook_leads","total_sold","website_sold","oem_sold","facebook_sold"], oemLabel: "Subaru" },
  "Juneau CDJR":           { active: ["total_leads","website_leads","oem_leads","facebook_leads","total_sold","website_sold","oem_sold","facebook_sold"], oemLabel: "CDJR"   },
  "Juneau Toyota":         { active: ["total_leads","website_leads","oem_leads","facebook_leads","total_sold","website_sold","oem_sold","facebook_sold"], oemLabel: "Toyota" },
  "Juneau Chevrolet":      { active: ["total_leads","website_leads","oem_leads","facebook_leads","total_sold","website_sold","oem_sold","facebook_sold"], oemLabel: "Chevy"  },
  "Juneau Honda":          { active: ["total_leads","website_leads","oem_leads","facebook_leads","total_sold","website_sold","oem_sold","facebook_sold"], oemLabel: "Honda"  },
  "Juneau Powersports":    { active: ["total_leads","website_leads","third_party","facebook_leads","total_sold","website_sold","third_party_sold","facebook_sold"] },
  "Cassia Car Rental":     { active: ["total_leads","website_leads","third_party","facebook_leads","total_sold","website_sold","third_party_sold","facebook_sold"] },
  "Explore Juneau":        { active: ["total_leads","website_leads","third_party","facebook_leads","total_sold","website_sold","third_party_sold","facebook_sold"] },
};

const DEFAULT_LEADS_ACTIVE = ["total_leads","website_leads","third_party","facebook_leads","total_sold","website_sold","third_party_sold","facebook_sold"];

function getLeadsConfig(clientName) {
  return CLIENT_LEADS_CONFIG[clientName] || { active: DEFAULT_LEADS_ACTIVE };
}

// ── Master leads fields ───────────────────────────────────────────────────────
const LEADS_MASTER_FIELDS = [
  { key: "total_leads",      label: "Total Leads",  type: "number" },
  { key: "website_leads",    label: "Web Leads",    type: "number" },
  { key: "third_party",      label: "3rd Party",    type: "number" },
  { key: "ford_leads",       label: "Ford Leads",   type: "number" },
  { key: "mazda_leads",      label: "Mazda Leads",  type: "number" },
  { key: "vw_leads",         label: "VW Leads",     type: "number" },
  { key: "oem_leads",        label: "OEM Leads",    type: "number" },
  { key: "facebook_leads",   label: "FB Leads",     type: "number" },
  { key: "total_sold",       label: "Total Sold",   type: "number" },
  { key: "website_sold",     label: "Web Sold",     type: "number" },
  { key: "third_party_sold", label: "3P Sold",      type: "number" },
  { key: "ford_sold",        label: "Ford Sold",    type: "number" },
  { key: "mazda_sold",       label: "Mazda Sold",   type: "number" },
  { key: "vw_sold",          label: "VW Sold",      type: "number" },
  { key: "oem_sold",         label: "OEM Sold",     type: "number" },
  { key: "facebook_sold",    label: "FB Sold",      type: "number" },
];

// ── GBP multi-listing config — Goode Motor Ford only ─────────────────────────
// listingOnly: client name that gets these columns; all others show N/A
const GBP_LISTING_SUM_FIELDS = [
  "profile_views","search_appearances","map_views","website_clicks",
  "phone_calls","direction_requests","review_count","new_reviews","posts_published",
];

const BULK_DEPTS = [
  {
    id: "leads", label: "Leads & CRM", color: "#6366f1",
    fields: LEADS_MASTER_FIELDS,
  },
  {
    id: "callrail", label: "CallRail", color: "#0891b2",
    fields: [
      { key: "total_calls",   label: "Total",   type: "number" },
      { key: "website_calls", label: "Website", type: "number" },
      { key: "ads_calls",     label: "Ads",     type: "number" },
      { key: "gbp_calls",     label: "GBP",     type: "number" },
    ]
  },
  {
    id: "seo", label: "SEO", color: "#059669",
    fields: [
      { key: "organic_sessions",      label: "Organic Ses.",    type: "number"  },
      { key: "direct_sessions",       label: "Direct Ses.",     type: "number"  },
      { key: "paid_sessions",         label: "Paid Ses.",       type: "number"  },
      { key: "social_sessions",       label: "Social Ses.",     type: "number"  },
      { key: "site_visits_from_email",label: "Email Ses.",      type: "number"  },
      { key: "impressions",           label: "Impr.",           type: "number"  },
      { key: "ctr",                   label: "CTR%",            type: "decimal" },
      { key: "avg_position",          label: "Avg Pos",         type: "decimal" },
      { key: "page1_keywords",        label: "Pg1 KW",          type: "number"  },
      { key: "organic_traffic_pct",   label: "Organic%",        type: "decimal" },
      { key: "form_submissions",      label: "Forms",           type: "number"  },
      { key: "vdp_views",             label: "VDP Views",       type: "number"  },
      { key: "bounce_rate",           label: "Bounce%",         type: "decimal" },
      { key: "avg_session_duration",  label: "Sess. Dur",       type: "duration" },
    ]
  },
  {
    id: "gbp", label: "Google Business", color: "#d97706",
    fields: [
      // ── Combined / single-listing fields ──
      { key: "profile_views",      label: "Views",         type: "number"  },
      { key: "search_appearances", label: "Searches",      type: "number"  },
      { key: "map_views",          label: "Map Views",     type: "number"  },
      { key: "website_clicks",     label: "Web Clicks",    type: "number"  },
      { key: "phone_calls",        label: "Calls",         type: "number"  },
      { key: "direction_requests", label: "Directions",    type: "number"  },
      { key: "review_count",       label: "Total Reviews", type: "number"  },
      { key: "avg_rating",         label: "Avg Rating",    type: "decimal" },
      { key: "new_reviews",        label: "New Reviews",   type: "number"  },
      { key: "photo_count",        label: "Photos",        type: "number"  },
      { key: "posts_published",    label: "Posts",         type: "number"  },
      // ── Goode Motor Ford — Ford listing ──
      { key: "gbp_ford_profile_views",      label: "Ford Views",    type: "number",  listingOnly: "Goode Motor Ford" },
      { key: "gbp_ford_search_appearances", label: "Ford Searches", type: "number",  listingOnly: "Goode Motor Ford" },
      { key: "gbp_ford_map_views",          label: "Ford Map",      type: "number",  listingOnly: "Goode Motor Ford" },
      { key: "gbp_ford_website_clicks",     label: "Ford Clicks",   type: "number",  listingOnly: "Goode Motor Ford" },
      { key: "gbp_ford_phone_calls",        label: "Ford Calls",    type: "number",  listingOnly: "Goode Motor Ford" },
      { key: "gbp_ford_direction_requests", label: "Ford Dirs",     type: "number",  listingOnly: "Goode Motor Ford" },
      { key: "gbp_ford_review_count",       label: "Ford Reviews",  type: "number",  listingOnly: "Goode Motor Ford" },
      { key: "gbp_ford_avg_rating",         label: "Ford Rating",   type: "decimal", listingOnly: "Goode Motor Ford" },
      { key: "gbp_ford_new_reviews",        label: "Ford New Rev",  type: "number",  listingOnly: "Goode Motor Ford" },
      { key: "gbp_ford_posts_published",    label: "Ford Posts",    type: "number",  listingOnly: "Goode Motor Ford" },
      // ── Goode Motor Ford — Overland listing ──
      { key: "gbp_overland_profile_views",      label: "OVR Views",    type: "number",  listingOnly: "Goode Motor Ford" },
      { key: "gbp_overland_search_appearances", label: "OVR Searches", type: "number",  listingOnly: "Goode Motor Ford" },
      { key: "gbp_overland_map_views",          label: "OVR Map",      type: "number",  listingOnly: "Goode Motor Ford" },
      { key: "gbp_overland_website_clicks",     label: "OVR Clicks",   type: "number",  listingOnly: "Goode Motor Ford" },
      { key: "gbp_overland_phone_calls",        label: "OVR Calls",    type: "number",  listingOnly: "Goode Motor Ford" },
      { key: "gbp_overland_direction_requests", label: "OVR Dirs",     type: "number",  listingOnly: "Goode Motor Ford" },
      { key: "gbp_overland_review_count",       label: "OVR Reviews",  type: "number",  listingOnly: "Goode Motor Ford" },
      { key: "gbp_overland_avg_rating",         label: "OVR Rating",   type: "decimal", listingOnly: "Goode Motor Ford" },
      { key: "gbp_overland_new_reviews",        label: "OVR New Rev",  type: "number",  listingOnly: "Goode Motor Ford" },
      { key: "gbp_overland_posts_published",    label: "OVR Posts",    type: "number",  listingOnly: "Goode Motor Ford" },
    ]
  },
  {
    id: "google_ads", label: "Google Ads", color: "#1d4ed8",
    fields: [
      { key: "conversions",      label: "Conv.",        type: "number"  },
      { key: "impressions",      label: "Impr.",        type: "number"  },
      { key: "clicks",           label: "Clicks",       type: "number"  },
      { key: "total_spend",      label: "Spend $",      type: "decimal" },
      { key: "budget",           label: "Budget $",     type: "decimal" },
      { key: "ctr",              label: "CTR%",         type: "decimal" },
      { key: "cpc",              label: "CPC $",        type: "decimal" },
      { key: "cost_per_lead",    label: "CPL $",        type: "decimal" },
      { key: "impression_share", label: "Impr. Share%", type: "decimal" },
      { key: "quality_score",    label: "Qual. Score",  type: "decimal" },
    ]
  },
  {
    id: "meta_ads", label: "Meta Ads", color: "#1877f2",
    fields: [
      { key: "conversions",          label: "Conv.",       type: "number"  },
      { key: "impressions",          label: "Impr.",       type: "number"  },
      { key: "reach",                label: "Reach",       type: "number"  },
      { key: "total_spend",          label: "Spend $",     type: "decimal" },
      { key: "monthly_budget",       label: "Budget $",    type: "decimal" },
      { key: "cpc",                  label: "CPC $",       type: "decimal" },
      { key: "ctr",                  label: "CTR%",        type: "decimal" },
      { key: "cost_per_lead",        label: "CPL $",       type: "decimal" },
      { key: "frequency",            label: "Frequency",   type: "decimal" },
      { key: "engagement_rate",      label: "Engage%",     type: "decimal" },
      { key: "video_view_rate",      label: "Video View%", type: "decimal" },
      { key: "lead_form_completion", label: "Lead Form%",  type: "decimal" },
    ]
  },
  {
    id: "social", label: "Organic Social", color: "#c026d3",
    fields: [
      { key: "fb_followers",           label: "FB Follow",      type: "number" },
      { key: "fb_visits",              label: "FB Visits",      type: "number" },
      { key: "fb_engagement",          label: "FB Engage",      type: "number" },
      { key: "fb_page_views",          label: "FB Views",       type: "number" },
      { key: "fb_published",           label: "FB Pub",         type: "number" },
      { key: "ig_followers",           label: "IG Follow",      type: "number" },
      { key: "ig_reach",               label: "IG Reach",       type: "number" },
      { key: "ig_impressions",         label: "IG Impr.",       type: "number" },
      { key: "ig_profile_views",       label: "IG Views",       type: "number" },
      { key: "ig_published",           label: "IG Pub",         type: "number" },
      { key: "yt_followers",           label: "YT Subs",        type: "number" },
      { key: "yt_month_views",         label: "YT Views",       type: "number" },
      { key: "yt_month_likes",         label: "YT Likes",       type: "number" },
      { key: "yt_month_comments",      label: "YT Comments",    type: "number" },
      { key: "yt_total_views",         label: "YT Total",       type: "number" },
      { key: "yt_long_form_published", label: "YT Long Pub",    type: "number" },
      { key: "yt_shorts_published",    label: "YT Short Pub",   type: "number" },
      { key: "tiktok_followers",       label: "TT Follow",      type: "number" },
      { key: "tiktok_profile_views",   label: "TT Prof Views",  type: "number" },
      { key: "tiktok_views",           label: "TT Views",       type: "number" },
      { key: "tiktok_likes",           label: "TT Likes",       type: "number" },
      { key: "tiktok_published",       label: "TT Pub",         type: "number" },
      { key: "web_clicks",             label: "Web Clicks",     type: "number" },
      { key: "top_video_views",        label: "Top Vid Views",  type: "number" },
    ]
  },
  {
    id: "email", label: "Email", color: "#dc2626",
    fields: [
      { key: "campaigns_sent",   label: "Campaigns",     type: "number" },
      { key: "total_recipients", label: "Audience Size",  type: "number" },
    ]
  },
  {
    id: "creative", label: "Creative", color: "#7c3aed",
    fields: [
      { key: "total_assets",  label: "Total",    type: "number" },
      { key: "videos",        label: "Videos",   type: "number" },
      { key: "graphics",      label: "Graphics", type: "number" },
      { key: "banners",       label: "Banners",  type: "number" },
      { key: "print",         label: "Print",    type: "number" },
      { key: "ad_creative",   label: "Ad Sets",  type: "number" },
      { key: "email_headers", label: "Email Hdr", type: "number" },
    ]
  },
];

const CLIENT_ORDER = [
  "Goode Motor Group","Goode Motor Ford","Goode Motor Mazda","Twin Falls Volkswagen",
  "Juneau Auto Mall","Juneau Subaru","Juneau CDJR","Juneau Toyota","Juneau Chevrolet",
  "Juneau Honda","Juneau Powersports","Cassia Car Rental","Explore Juneau"
];

// ── Juneau cascade config ─────────────────────────────────────────────────────
const JUNEAU_PARENT_NAME = "Juneau Auto Mall";
const JUNEAU_CHILD_NAMES = ["Juneau Subaru","Juneau CDJR","Juneau Toyota","Juneau Chevrolet","Juneau Honda"];
const JUNEAU_NO_CASCADE  = new Set(["oem_leads","oem_sold"]);

function getAllMonths() {
  const months = [];
  const now = new Date();
  let cur = new Date(2024, 0, 1);
  while (cur <= now) {
    months.push({
      year: cur.getFullYear(),
      month: cur.getMonth() + 1,
      str: `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-01`,
      label: `${MONTHS_SHORT[cur.getMonth()]} ${cur.getFullYear()}`
    });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return months;
}

const ALL_MONTHS = getAllMonths();

// ── Inline editable cell with Excel column paste support ──────────────────────
function BulkCell({ clientId, monthStr, deptId, field, deptColor, isLastInDept, value, isManualLocked, isApiSourced, isImported, disabled, onSave, rowIndex, colIndex, onPasteMulti, selected, onCellClick }) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState("");
  const inputRef = useRef();

  const hasValue = value !== null && value !== undefined && String(value).trim() !== "";

  const bgColor = editing
    ? "#fffbeb"
    : isManualLocked && hasValue ? "#fff"
    : isImported && hasValue ? "#f0fdf4"
    : isApiSourced && hasValue ? "#eff6ff"
    : "#f8fafc";

  const handleFocus = () => {
    if (disabled) return;
    setEditing(true);
    setLocalVal(hasValue ? String(value) : "");
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleBlur = () => {
    setEditing(false);
    const trimmed = localVal.trim();
    const original = hasValue ? (field.type === "duration" ? fmtDuration(value) : String(value)) : "";
    if (trimmed !== original) {
      const saveVal = field.type === "duration" ? String(parseDuration(trimmed) ?? "") : trimmed;
      onSave(clientId, monthStr, deptId, field.key, saveVal, field.type);
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    // Check if pasted data has multiple lines or tabs (Excel multi-cell paste)
    const hasMultipleRows = text.includes("\n");
    const hasTabs = text.includes("\t");
    if (hasMultipleRows || hasTabs) {
      e.preventDefault();
      e.stopPropagation();
      if (onPasteMulti) {
        onPasteMulti(rowIndex, colIndex, text);
      }
    }
    // Single value paste is handled normally by the input
  };

  const displayVal = !hasValue ? "" : field.type === "duration"
    ? fmtDuration(value)
    : field.type === "decimal"
    ? parseFloat(value).toFixed(2)
    : String(value);

  return (
    <td
      onClick={(e) => { if (!disabled && onCellClick) onCellClick(rowIndex, colIndex, e.shiftKey); }}
      style={{
      backgroundImage: disabled ? "repeating-linear-gradient(45deg,#f0f0f0,#f0f0f0 3px,#e8e8e8 3px,#e8e8e8 6px)" : undefined,
      background: disabled ? undefined : selected ? "#fef3c7" : bgColor,
      outline: selected ? "2px solid #f59e0b" : "none",
      outlineOffset: "-1px",
      borderRight: isLastInDept ? `2px solid ${deptColor}55` : `1px solid ${C.bl2}`,
      borderBottom: `1px solid ${C.bl2}`,
      padding: 0, width: 64, minWidth: 64, position: "relative",
      zIndex: selected ? 5 : undefined,
    }}>
      {disabled ? (
        <div style={{ width: "100%", height: "100%", padding: "5px", fontSize: 10, color: "#ccc", textAlign: "center", userSelect: "none", boxSizing: "border-box", lineHeight: "18px" }}>
          n/a
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={editing ? localVal : displayVal}
            onChange={e => setLocalVal(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onPaste={handlePaste}
            onKeyDown={e => {
              if (e.key === "Enter") e.target.blur();
              if (e.key === "Escape") { setLocalVal(hasValue ? String(value) : ""); setEditing(false); e.target.blur(); }
            }}
            placeholder="—"
            style={{
              width: "100%", border: "none",
              outline: editing ? `2px solid ${deptColor}` : "none",
              outlineOffset: "-2px", background: "transparent",
              padding: "5px 5px", fontSize: 11, fontFamily: F,
              color: hasValue || editing ? C.t : C.tl,
              textAlign: "right", cursor: "text", boxSizing: "border-box",
            }}
          />
          {hasValue && (
            <div style={{
              position: "absolute", top: 3, left: 3,
              width: 4, height: 4, borderRadius: "50%",
              background: isManualLocked ? deptColor : isImported ? "#10b981" : isApiSourced ? "#93c5fd" : "transparent",
              opacity: 0.7,
            }} />
          )}
        </>
      )}
    </td>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BulkEditPage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [allData, setAllData] = useState({});
  const [dataLoading, setDataLoading] = useState(true);
  const [savingCells, setSavingCells] = useState({});
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pasteToast, setPasteToast] = useState(null);
  // Selection state for multi-cell delete
  const [selStart, setSelStart] = useState(null); // { row, col }
  const [selEnd, setSelEnd] = useState(null);     // { row, col }
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
  }, []);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    let allRows = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data: batch, error } = await supabase
        .from("report_data")
        .select("client_id,month,department,data")
        .range(from, from + pageSize - 1);
      if (error) {
        console.error("loadData error:", error);
        alert("Load failed: " + error.message);
        setRefreshing(false);
        setDataLoading(false);
        return;
      }
      if (!batch || batch.length === 0) break;
      allRows = allRows.concat(batch);
      if (batch.length < pageSize) break;
      from += pageSize;
    }

    const map = {};
    allRows.forEach(r => {
      if (!map[r.client_id]) map[r.client_id] = {};
      const monthKey = r.month.substring(0, 10);
      if (!map[r.client_id][monthKey]) map[r.client_id][monthKey] = {};
      map[r.client_id][monthKey][r.department] = typeof r.data === "string"
        ? JSON.parse(r.data) : (r.data || {});
    });

    setAllData(map);
    setLastRefresh(new Date());
    setRefreshing(false);
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (!session) return;
    const init = async () => {
      const { data: prof } = await supabase
        .from("user_profiles").select("*").eq("id", session.user.id).single();
      setProfile(prof);
      if (prof?.role !== "admin") { setDataLoading(false); return; }

      const { data: clientData } = await supabase
        .from("clients").select("id,name,group_name,tier").eq("active", true);
      const sorted = (clientData || []).sort((a, b) => {
        const ai = CLIENT_ORDER.indexOf(a.name), bi = CLIENT_ORDER.indexOf(b.name);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1; if (bi !== -1) return 1;
        return a.name.localeCompare(b.name);
      });
      setClients(sorted);
      await loadData();
    };
    init();
  }, [session, loadData]);

  const handleCellSave = useCallback(async (clientId, monthStr, deptId, fieldKey, rawValue, fieldType) => {
    const cellKey = `${clientId}_${monthStr}_${deptId}_${fieldKey}`;
    setSavingCells(prev => ({ ...prev, [cellKey]: true }));

    const parsed = fieldType === "decimal" ? parseFloat(rawValue) : parseInt(rawValue, 10);
    const finalVal = rawValue === "" || rawValue === null ? null : (isNaN(parsed) ? null : parsed);

    const buildUpdated = (existingData) => {
      const overrides = new Set(existingData._manual_overrides || []);
      if (finalVal !== null) overrides.add(fieldKey);
      else overrides.delete(fieldKey);
      return {
        ...existingData,
        [fieldKey]: finalVal,
        _manual_overrides: Array.from(overrides),
        _bulk_edited_at: new Date().toISOString(),
      };
    };

    // Save primary client
    const primaryExisting = allData[clientId]?.[monthStr]?.[deptId] || {};
    let primaryUpdated = buildUpdated(primaryExisting);

    // ── Auto-compute GBP totals from per-listing data for Goode Motor Ford ──
    const savingClient = clients.find(c => c.id === clientId);
    if (deptId === "gbp" && savingClient?.name === "Goode Motor Ford" &&
        (fieldKey.startsWith("gbp_ford_") || fieldKey.startsWith("gbp_overland_"))) {
      GBP_LISTING_SUM_FIELDS.forEach(f => {
        const fordVal    = Number(primaryUpdated[`gbp_ford_${f}`])     || 0;
        const overlandVal= Number(primaryUpdated[`gbp_overland_${f}`]) || 0;
        const total = fordVal + overlandVal;
        if (total > 0) primaryUpdated[f] = total;
      });
    }

    setAllData(prev => ({
      ...prev,
      [clientId]: {
        ...(prev[clientId] || {}),
        [monthStr]: { ...(prev[clientId]?.[monthStr] || {}), [deptId]: primaryUpdated }
      }
    }));

    const { data: { user } } = await supabase.auth.getUser();
    const { error: saveError } = await supabase.from("report_data").upsert(
      { client_id: clientId, month: monthStr, department: deptId, data: primaryUpdated, last_updated_by: user.id, last_updated_at: new Date().toISOString() },
      { onConflict: "client_id,month,department" }
    );

    if (saveError) {
      console.error("Save failed:", saveError);
      alert(`Save failed: ${saveError.message}`);
    }

    // ── Cascade CallRail gbp_calls -> GBP phone_calls ──
    // For Goode Motor Ford: writes to gbp_ford_phone_calls + recomputes combined total
    // For all other clients: writes directly to phone_calls
    if (deptId === "callrail" && fieldKey === "gbp_calls") {
      const gbpExisting = allData[clientId]?.[monthStr]?.["gbp"] || {};
      const gbpOverrides = new Set(gbpExisting._manual_overrides || []);
      let updatedGbp = { ...gbpExisting, _callrail_synced_at: new Date().toISOString() };

      if (savingClient?.name === "Goode Motor Ford") {
        if (!gbpOverrides.has("gbp_ford_phone_calls")) {
          updatedGbp.gbp_ford_phone_calls = finalVal;
          const overland = Number(updatedGbp.gbp_overland_phone_calls) || 0;
          updatedGbp.phone_calls = (Number(finalVal) || 0) + overland || null;
        }
      } else {
        if (!gbpOverrides.has("phone_calls")) {
          updatedGbp.phone_calls = finalVal;
        }
      }

      setAllData(prev => ({
        ...prev,
        [clientId]: {
          ...(prev[clientId] || {}),
          [monthStr]: { ...(prev[clientId]?.[monthStr] || {}), gbp: updatedGbp }
        }
      }));
      await supabase.from("report_data").upsert(
        { client_id: clientId, month: monthStr, department: "gbp", data: updatedGbp, last_updated_by: user.id, last_updated_at: new Date().toISOString() },
        { onConflict: "client_id,month,department" }
      );
    }

    // Cascade to Juneau child stores
    if (savingClient?.name === JUNEAU_PARENT_NAME && !JUNEAU_NO_CASCADE.has(fieldKey) && (deptId === "leads" || deptId === "social")) {
      const childClients = clients.filter(c => JUNEAU_CHILD_NAMES.includes(c.name));
      await Promise.all(childClients.map(async (child) => {
        const childExisting = allData[child.id]?.[monthStr]?.[deptId] || {};
        const childUpdated = buildUpdated(childExisting);

        setAllData(prev => ({
          ...prev,
          [child.id]: {
            ...(prev[child.id] || {}),
            [monthStr]: { ...(prev[child.id]?.[monthStr] || {}), [deptId]: childUpdated }
          }
        }));

        await supabase.from("report_data").upsert(
          { client_id: child.id, month: monthStr, department: deptId, data: childUpdated, last_updated_by: user.id, last_updated_at: new Date().toISOString() },
          { onConflict: "client_id,month,department" }
        );
      }));
    }

    setSavingCells(prev => { const n = { ...prev }; delete n[cellKey]; return n; });
  }, [allData, clients]);

  // Completion % — numeric fields only, respects per-client leads config
  const getCompletion = (client, monthStr) => {
    const leadsConfig = getLeadsConfig(client.name);
    let total = 0, filled = 0;
    BULK_DEPTS.forEach(dept => {
      dept.fields.forEach(f => {
        if (dept.id === "leads" && !leadsConfig.active.includes(f.key)) return;
        // Skip listing-only fields for non-GMF clients in completion count
        if (f.listingOnly && f.listingOnly !== client.name) return;
        total++;
        const val = allData[client.id]?.[monthStr]?.[dept.id]?.[f.key];
        if (val !== null && val !== undefined && String(val).trim() !== "") filled++;
      });
    });
    return { total, filled, pct: total > 0 ? Math.round((filled / total) * 100) : 0 };
  };

  // Build flat grid indices for paste support — must be before early returns (React hooks rules)
  const allRows = useMemo(() => {
    const rows = [];
    clients.forEach(client => {
      ALL_MONTHS.forEach(mon => {
        rows.push({ clientId: client.id, clientName: client.name, monthStr: mon.str });
      });
    });
    return rows;
  }, [clients]);

  const allCols = useMemo(() => {
    const cols = [];
    BULK_DEPTS.forEach(dept => {
      dept.fields.forEach(f => {
        cols.push({ deptId: dept.id, field: f });
      });
    });
    return cols;
  }, []);

  // Handle multi-cell paste from Excel (column or grid paste)
  const handlePasteMulti = useCallback((startRow, startCol, text) => {
    const rows = text.split(/\r?\n/).filter(r => r.trim() !== "");
    let pasteCount = 0;
    rows.forEach((row, ri) => {
      const cells = row.split("\t");
      cells.forEach((cellVal, ci) => {
        const targetRow = startRow + ri;
        const targetCol = startCol + ci;
        if (targetRow >= allRows.length || targetCol >= allCols.length) return;
        const { clientId, clientName } = allRows[targetRow];
        const { deptId, field } = allCols[targetCol];
        if (field.listingOnly && field.listingOnly !== clientName) return;
        if (deptId === "leads") {
          const config = getLeadsConfig(clientName);
          if (!config.active.includes(field.key)) return;
        }
        let trimmed = cellVal.trim().replace(/[$,%]/g, "");
        if (field.type === "duration" && trimmed.includes(":")) {
          const sec = parseDuration(trimmed);
          trimmed = sec !== null ? String(sec) : trimmed;
        }
        if (trimmed !== "") {
          handleCellSave(clientId, allRows[targetRow].monthStr, deptId, field.key, trimmed, field.type);
          pasteCount++;
        }
      });
    });
    if (pasteCount > 0) {
      setPasteToast(`✓ Pasted ${pasteCount} cell${pasteCount !== 1 ? "s" : ""} from clipboard`);
      setTimeout(() => setPasteToast(null), 3000);
    }
  }, [allRows, allCols, handleCellSave]);

  // Selection helpers
  const getSelBounds = useCallback(() => {
    if (!selStart) return null;
    const end = selEnd || selStart;
    return {
      minRow: Math.min(selStart.row, end.row),
      maxRow: Math.max(selStart.row, end.row),
      minCol: Math.min(selStart.col, end.col),
      maxCol: Math.max(selStart.col, end.col),
    };
  }, [selStart, selEnd]);

  const isCellSelected = useCallback((row, col) => {
    const b = getSelBounds();
    if (!b) return false;
    return row >= b.minRow && row <= b.maxRow && col >= b.minCol && col <= b.maxCol;
  }, [getSelBounds]);

  const handleCellClick = useCallback((row, col, shiftKey) => {
    if (shiftKey && selStart) {
      setSelEnd({ row, col });
    } else {
      setSelStart({ row, col });
      setSelEnd(null);
    }
  }, [selStart]);

  // Delete selected cells
  const handleDeleteSelected = useCallback(async () => {
    const b = getSelBounds();
    if (!b) return;
    setDeleting(true);
    let deleteCount = 0;
    for (let r = b.minRow; r <= b.maxRow; r++) {
      for (let c = b.minCol; c <= b.maxCol; c++) {
        if (r >= allRows.length || c >= allCols.length) continue;
        const { clientId, clientName, monthStr } = allRows[r];
        const { deptId, field } = allCols[c];
        if (field.listingOnly && field.listingOnly !== clientName) continue;
        if (deptId === "leads") {
          const config = getLeadsConfig(clientName);
          if (!config.active.includes(field.key)) continue;
        }
        handleCellSave(clientId, monthStr, deptId, field.key, "", field.type);
        deleteCount++;
      }
    }
    setSelStart(null); setSelEnd(null); setDeleting(false);
    if (deleteCount > 0) {
      setPasteToast(`✓ Cleared ${deleteCount} cell${deleteCount !== 1 ? "s" : ""}`);
      setTimeout(() => setPasteToast(null), 3000);
    }
  }, [getSelBounds, allRows, allCols, handleCellSave]);

  // Keyboard: Delete/Backspace clears selection, Escape clears selection
  useEffect(() => {
    const handler = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selStart && !e.target.matches("input,textarea")) {
        e.preventDefault();
        handleDeleteSelected();
      }
      if (e.key === "Escape") {
        setSelStart(null); setSelEnd(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selStart, handleDeleteSelected]);

  if (authLoading || dataLoading) return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "#fff", fontFamily: F, fontSize: 15, marginBottom: 8 }}>Loading bulk editor...</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontFamily: F, fontSize: 12 }}>Fetching all client data</div>
      </div>
    </div>
  );

  if (!session || profile?.role !== "admin") return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F }}>
      <div style={{ background: C.white, borderRadius: 16, padding: "48px 40px", maxWidth: 400, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2 style={{ color: C.navy }}>Admin Only</h2>
        <p style={{ color: C.tl, fontSize: 13 }}>This page is for Jacob / Taggart admins only.</p>
        <a href="/admin" style={{ display: "inline-block", marginTop: 12, padding: "10px 24px", background: C.navy, color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Back to Admin</a>
      </div>
    </div>
  );

  const totalDeptFields = BULK_DEPTS.reduce((sum, d) => sum + d.fields.length, 0);
  const activeSaveCount = Object.keys(savingCells).length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>

      {/* ── Sticky nav ── */}
      <div style={{
        background: C.navy, padding: "0 20px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 200, boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/Taggart_Advertising_Logo.png" alt="Taggart" style={{ height: 32 }} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Bulk Data Editor</span>
          <span style={{ background: "rgba(0,201,232,0.2)", color: "#00c9e8", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>ADMIN ONLY</span>
          {activeSaveCount > 0 ? (
            <span style={{ background: C.o + "33", color: C.o, borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
              ↻ Saving {activeSaveCount} cell{activeSaveCount !== 1 ? "s" : ""}...
            </span>
          ) : lastRefresh ? (
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
              ✓ All saved · {clients.length} clients · {ALL_MONTHS.length} months · {totalDeptFields} fields
            </span>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10, fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
            {[
              { bg: "#eff6ff", bd: "#93c5fd", label: "API data" },
              { bg: "#f0fdf4", bd: "#10b981", label: "Imported" },
              { bg: "#fff",    bd: "#d0d5dd", label: "Manual (locked)" },
              { bg: "#f8fafc", bd: "#e4e7ec", label: "Empty" },
              { bg: "#fffbeb", bd: "#fde68a", label: "Editing" },
              { bg: null,      bd: "#ddd",    label: "N/A", striped: true },
            ].map(item => (
              <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{
                  width: 10, height: 10, borderRadius: 2, display: "inline-block",
                  background: item.striped ? undefined : item.bg,
                  backgroundImage: item.striped
                    ? "repeating-linear-gradient(45deg,#f0f0f0,#f0f0f0 2px,#e8e8e8 2px,#e8e8e8 4px)"
                    : undefined,
                  border: `1px solid ${item.bd}`,
                }} />
                {item.label}
              </span>
            ))}
          </div>
          <button onClick={loadData} disabled={refreshing}
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 6, padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: refreshing ? "not-allowed" : "pointer", fontFamily: F, opacity: refreshing ? 0.6 : 1 }}>
            {refreshing ? "↻ Refreshing..." : "↻ Refresh Data"}
          </button>
          <a href="/admin" style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>← Admin Panel</a>
        </div>
      </div>

      {/* ── Selection bar + toast ── */}
      {selStart && (() => {
        const b = getSelBounds();
        if (!b) return null;
        const count = (b.maxRow - b.minRow + 1) * (b.maxCol - b.minCol + 1);
        return (
          <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 999, background: C.navy, color: "#fff", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, fontFamily: F, boxShadow: "0 4px 16px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ color: "#fbbf24" }}>{count} cell{count !== 1 ? "s" : ""} selected</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Click = select · Shift+Click = range · Delete = clear</span>
            <button onClick={handleDeleteSelected} disabled={deleting} style={{ background: C.r, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
              {deleting ? "Clearing..." : "Delete Selected"}
            </button>
            <button onClick={() => { setSelStart(null); setSelEnd(null); }} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 11, cursor: "pointer", fontFamily: F }}>
              Esc
            </button>
          </div>
        );
      })()}
      {pasteToast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, background: C.g, color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 700, fontFamily: F, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
          {pasteToast}
        </div>
      )}

      {/* ── Scrollable grid ── */}
      <div style={{ overflow: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 12, fontFamily: F }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{
                position: "sticky", left: 0, top: 0, zIndex: 60,
                background: "#1e3a5f", color: "#fff", fontWeight: 700, fontSize: 11,
                padding: "8px 12px", textAlign: "left",
                width: 150, minWidth: 150, height: 28,
                borderRight: "3px solid #00c9e8",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                whiteSpace: "nowrap",
              }}>Client</th>
              <th rowSpan={2} style={{
                position: "sticky", left: 150, top: 0, zIndex: 60,
                background: "#1e3a5f", color: "#fff", fontWeight: 700, fontSize: 11,
                padding: "8px 10px", textAlign: "center",
                width: 75, minWidth: 75, height: 28,
                borderRight: "2px solid rgba(255,255,255,0.15)",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}>Month</th>
              <th rowSpan={2} style={{
                position: "sticky", left: 225, top: 0, zIndex: 60,
                background: "#1e3a5f", color: "#fff", fontWeight: 700, fontSize: 10,
                padding: "8px 6px", textAlign: "center",
                width: 44, minWidth: 44, height: 28,
                borderRight: "2px solid rgba(255,255,255,0.15)",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}>Fill %</th>
              {BULK_DEPTS.map(dept => (
                <th key={dept.id} colSpan={dept.fields.length}
                  style={{
                    position: "sticky", top: 0, zIndex: 50,
                    background: dept.color, color: "#fff",
                    fontSize: 10, fontWeight: 700,
                    padding: "6px 8px", textAlign: "center", height: 28,
                    borderRight: "3px solid #fff",
                    borderBottom: "1px solid rgba(255,255,255,0.3)",
                    whiteSpace: "nowrap", letterSpacing: "0.05em",
                  }}>
                  {dept.label}
                </th>
              ))}
            </tr>
            <tr>
              {BULK_DEPTS.map(dept =>
                dept.fields.map((f, fi) => (
                  <th key={`h_${dept.id}_${f.key}`}
                    style={{
                      position: "sticky", top: 28, zIndex: 50,
                      background: f.listingOnly ? dept.color + "99" : dept.color + "cc",
                      color: "#fff",
                      fontSize: 10, fontWeight: 600,
                      padding: "4px 5px", textAlign: "center",
                      width: 64, minWidth: 64, height: 24,
                      borderRight: fi === dept.fields.length - 1 ? "3px solid #fff" : `1px solid ${dept.color}88`,
                      borderBottom: `2px solid ${dept.color}`,
                      whiteSpace: "nowrap",
                    }}>
                    {f.label}
                    {f.listingOnly && (
                      <div style={{ fontSize: 8, opacity: 0.7, marginTop: 1 }}>GMF only</div>
                    )}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {clients.map((client, ci) => {
              const clientBg = ci % 2 === 0 ? "#f0f4ff" : "#f5f0ff";
              const leadsConfig = getLeadsConfig(client.name);
              let colOffset = 0; // tracks column index across depts

              return ALL_MONTHS.map((mon, mi) => {
                const rowIndex = ci * ALL_MONTHS.length + mi;
                colOffset = 0;
                const isFirstRow = mi === 0;
                const comp = getCompletion(client, mon.str);
                const rowBg = mi % 2 === 0 ? C.white : "#fafafa";
                const compColor = comp.pct === 100 ? C.g : comp.pct >= 50 ? C.o : comp.pct > 0 ? "#f59e0b88" : C.tl;

                return (
                  <tr key={`${client.id}_${mon.str}`}>
                    {isFirstRow && (
                      <td rowSpan={ALL_MONTHS.length}
                        style={{
                          position: "sticky", left: 0, zIndex: 10,
                          background: clientBg,
                          borderRight: "3px solid #00c9e8",
                          borderBottom: "3px solid #d0d5dd",
                          padding: "10px 12px", verticalAlign: "top",
                          width: 150, minWidth: 150,
                        }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.t, lineHeight: 1.3 }}>{client.name}</div>
                        <div style={{ fontSize: 10, color: C.tl, marginTop: 3 }}>{client.group_name}</div>
                      </td>
                    )}
                    <td style={{
                      position: "sticky", left: 150, zIndex: 10, background: rowBg,
                      borderRight: "2px solid rgba(0,0,0,0.06)",
                      borderBottom: `1px solid ${C.bl2}`,
                      padding: "4px 8px", textAlign: "center",
                      width: 75, minWidth: 75,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.t, whiteSpace: "nowrap" }}>{mon.label}</div>
                    </td>
                    <td style={{
                      position: "sticky", left: 225, zIndex: 10, background: rowBg,
                      borderRight: "2px solid rgba(0,0,0,0.08)",
                      borderBottom: `1px solid ${C.bl2}`,
                      padding: "4px 4px", textAlign: "center",
                      width: 44, minWidth: 44,
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: compColor }}>
                        {comp.pct > 0 ? `${comp.pct}%` : "—"}
                      </div>
                    </td>
                    {BULK_DEPTS.map(dept =>
                      dept.fields.map((f, fi) => {
                        const currentCol = colOffset++;
                        const deptData = allData[client.id]?.[mon.str]?.[dept.id] || {};
                        const val = deptData[f.key];
                        const isManualLocked = (deptData._manual_overrides || []).includes(f.key);
                        const isApiSourced = !!deptData._pulled_at && !isManualLocked;
                        const isImported = (deptData._imported_fields || []).includes(f.key) && !isManualLocked;

                        // Disable: leads fields not in client config
                        const isLeadsDisabled = dept.id === "leads" && !leadsConfig.active.includes(f.key);
                        // Disable: listing-only fields for non-matching clients
                        const isListingDisabled = f.listingOnly && f.listingOnly !== client.name;
                        const isDisabled = isLeadsDisabled || isListingDisabled;

                        let displayField = f;
                        if (dept.id === "leads" && leadsConfig.oemLabel) {
                          if (f.key === "oem_leads") displayField = { ...f, label: `${leadsConfig.oemLabel} Leads` };
                          if (f.key === "oem_sold")  displayField = { ...f, label: `${leadsConfig.oemLabel} Sold` };
                        }

                        return (
                          <BulkCell
                            key={`${client.id}_${mon.str}_${dept.id}_${f.key}`}
                            clientId={client.id}
                            monthStr={mon.str}
                            deptId={dept.id}
                            field={displayField}
                            deptColor={dept.color}
                            isLastInDept={fi === dept.fields.length - 1}
                            value={val}
                            isManualLocked={isManualLocked}
                            isApiSourced={isApiSourced}
                            isImported={isImported}
                            disabled={isDisabled}
                            onSave={handleCellSave}
                            rowIndex={rowIndex}
                            colIndex={currentCol}
                            onPasteMulti={handlePasteMulti}
                            selected={isCellSelected(rowIndex, currentCol)}
                            onCellClick={handleCellClick}
                          />
                        );
                      })
                    )}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
