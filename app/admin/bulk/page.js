'use client';
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../../supabase";

const C = {
  white: "#fff", navy: "#0c1a2e", cyan: "#00c9e8", cyanD: "#00a5bf",
  cyanL: "#e6f9fc", t: "#1a1a2e", tl: "#6b7280", bd: "#d0d5dd",
  bl2: "#e4e7ec", g: "#10b981", gL: "#f0fdf4", r: "#ef4444",
  o: "#f59e0b", bg: "#f0f2f5"
};
const F = "Inter,system-ui,sans-serif";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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

// ── Master leads fields (union of all possible columns) ───────────────────────
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
      { key: "organic_sessions",     label: "Sessions",       type: "number"  },
      { key: "impressions",          label: "Impr.",          type: "number"  },
      { key: "ctr",                  label: "CTR%",           type: "decimal" },
      { key: "avg_position",         label: "Avg Pos",        type: "decimal" },
      { key: "page1_keywords",       label: "Pg1 KW",         type: "number"  },
      { key: "form_submissions",     label: "Forms",          type: "number"  },
      { key: "phone_calls",          label: "Calls",          type: "number"  },
      { key: "vdp_views",            label: "VDP Views",      type: "number"  },
      { key: "direction_requests",   label: "Directions",     type: "number"  },
      { key: "chat_conversations",   label: "Chats",          type: "number"  },
      { key: "bounce_rate",          label: "Bounce%",        type: "decimal" },
      { key: "avg_session_duration", label: "Sess. Dur",      type: "number"  },
      { key: "total_sessions",       label: "Total Sessions", type: "number"  },
    ]
  },
  {
    id: "gbp", label: "Google Business", color: "#d97706",
    fields: [
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
      { key: "fb_followers",      label: "FB Follow",     type: "number" },
      { key: "fb_reach",          label: "FB Reach",      type: "number" },
      { key: "fb_engagement",     label: "FB Engage",     type: "number" },
      { key: "fb_new_followers",  label: "FB New Follow", type: "number" },
      { key: "fb_page_views",     label: "FB Views",      type: "number" },
      { key: "ig_followers",      label: "IG Follow",     type: "number" },
      { key: "ig_reach",          label: "IG Reach",      type: "number" },
      { key: "ig_impressions",    label: "IG Impr.",      type: "number" },
      { key: "ig_profile_views",  label: "IG Views",      type: "number" },
      { key: "ig_new_followers",  label: "IG New Follow", type: "number" },
      { key: "yt_followers",      label: "YT Subs",       type: "number" },
      { key: "yt_month_views",    label: "YT Views",      type: "number" },
      { key: "yt_month_videos",   label: "YT Videos",     type: "number" },
      { key: "yt_month_likes",    label: "YT Likes",      type: "number" },
      { key: "yt_month_comments", label: "YT Comments",   type: "number" },
      { key: "yt_total_views",    label: "YT Total",      type: "number" },
      { key: "tiktok_followers",  label: "TT Follow",     type: "number" },
      { key: "tiktok_reach",      label: "TT Reach",      type: "number" },
      { key: "tiktok_views",      label: "TT Views",      type: "number" },
      { key: "tiktok_likes",      label: "TT Likes",      type: "number" },
      { key: "posts_published",   label: "Posts",         type: "number" },
      { key: "videos_published",  label: "Videos",        type: "number" },
      { key: "web_clicks",        label: "Web Clicks",    type: "number" },
      { key: "top_video_views",   label: "Top Vid Views", type: "number" },
    ]
  },
  {
    id: "email", label: "Email", color: "#dc2626",
    fields: [
      { key: "campaigns_sent",   label: "Campaigns",   type: "number"  },
      { key: "total_recipients", label: "Recipients",  type: "number"  },
      { key: "avg_open_rate",    label: "Open%",       type: "decimal" },
      { key: "avg_click_rate",   label: "Click%",      type: "decimal" },
      { key: "unsubscribe_rate", label: "Unsub%",      type: "decimal" },
      { key: "site_visits",      label: "Site Visits", type: "number"  },
      { key: "conversions",      label: "Conv.",       type: "number"  },
      { key: "list_size",        label: "List Size",   type: "number"  },
    ]
  },
  {
    id: "creative", label: "Creative", color: "#7c3aed",
    fields: [
      { key: "total_assets",  label: "Total Assets",  type: "number" },
      { key: "videos",        label: "Videos",        type: "number" },
      { key: "graphics",      label: "Graphics",      type: "number" },
      { key: "banners",       label: "Banners",       type: "number" },
      { key: "print",         label: "Print",         type: "number" },
      { key: "ad_creative",   label: "Ad Creative",   type: "number" },
      { key: "email_headers", label: "Email Headers", type: "number" },
    ]
  },
];

const CLIENT_ORDER = [
  "Goode Motor Group","Goode Motor Ford","Goode Motor Mazda","Twin Falls Volkswagen",
  "Juneau Auto Mall","Juneau Subaru","Juneau CDJR","Juneau Toyota","Juneau Chevrolet",
  "Juneau Honda","Juneau Powersports","Cassia Car Rental","Explore Juneau"
];

// ── Juneau Auto Mall cascade config ───────────────────────────────────────────
// Edits to Juneau Auto Mall auto-populate to child stores
// except oem_leads and oem_sold (those are brand-specific per store)
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
  return months.reverse();
}

const ALL_MONTHS = getAllMonths();

// ── Inline editable cell ──────────────────────────────────────────────────────
function BulkCell({ clientId, monthStr, deptId, field, deptColor, isLastInDept, value, isManualLocked, isApiSourced, disabled, onSave }) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState("");
  const inputRef = useRef();

  const hasValue = value !== null && value !== undefined && String(value).trim() !== "";

  const bgColor = editing
    ? "#fffbeb"
    : isManualLocked && hasValue
    ? "#fff"
    : isApiSourced && hasValue
    ? "#eff6ff"
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
    const original = hasValue ? String(value) : "";
    if (trimmed !== original) {
      onSave(clientId, monthStr, deptId, field.key, trimmed, field.type);
    }
  };

  const displayVal = !hasValue ? "" : field.type === "decimal"
    ? parseFloat(value).toFixed(2)
    : String(value);

  return (
    <td style={{
      backgroundImage: disabled ? "repeating-linear-gradient(45deg,#f0f0f0,#f0f0f0 3px,#e8e8e8 3px,#e8e8e8 6px)" : undefined,
      background: disabled ? undefined : bgColor,
      borderRight: isLastInDept ? `2px solid ${deptColor}55` : `1px solid ${C.bl2}`,
      borderBottom: `1px solid ${C.bl2}`,
      padding: 0,
      width: 64,
      minWidth: 64,
      position: "relative",
    }}>
      {disabled ? (
        <div style={{
          width: "100%",
          height: "100%",
          padding: "5px",
          fontSize: 10,
          color: "#ccc",
          textAlign: "center",
          userSelect: "none",
          boxSizing: "border-box",
          lineHeight: "18px",
        }}>
          n/a
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="number"
            step={field.type === "decimal" ? "0.01" : "1"}
            value={editing ? localVal : displayVal}
            onChange={e => setLocalVal(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={e => {
              if (e.key === "Enter") e.target.blur();
              if (e.key === "Escape") { setLocalVal(hasValue ? String(value) : ""); setEditing(false); e.target.blur(); }
            }}
            placeholder="—"
            style={{
              width: "100%",
              border: "none",
              outline: editing ? `2px solid ${deptColor}` : "none",
              outlineOffset: "-2px",
              background: "transparent",
              padding: "5px 5px",
              fontSize: 11,
              fontFamily: F,
              color: hasValue || editing ? C.t : C.tl,
              textAlign: "right",
              cursor: "text",
              boxSizing: "border-box",
            }}
          />
          {hasValue && (
            <div style={{
              position: "absolute", top: 3, left: 3,
              width: 4, height: 4, borderRadius: "50%",
              background: isManualLocked ? deptColor : isApiSourced ? "#93c5fd" : "transparent",
              opacity: 0.7
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
  }, []);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    const { data: rows } = await supabase
      .from("report_data")
      .select("client_id,month,department,data");
    const map = {};
    (rows || []).forEach(r => {
      if (!map[r.client_id]) map[r.client_id] = {};
      if (!map[r.client_id][r.month]) map[r.client_id][r.month] = {};
      map[r.client_id][r.month][r.department] = r.data || {};
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

    // ── Build updated data object for any client ──
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

    // ── Save primary client ──
    const primaryExisting = allData[clientId]?.[monthStr]?.[deptId] || {};
    const primaryUpdated = buildUpdated(primaryExisting);

    setAllData(prev => ({
      ...prev,
      [clientId]: {
        ...(prev[clientId] || {}),
        [monthStr]: { ...(prev[clientId]?.[monthStr] || {}), [deptId]: primaryUpdated }
      }
    }));

    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("report_data").upsert(
      { client_id: clientId, month: monthStr, department: deptId, data: primaryUpdated, last_updated_by: user.id, last_updated_at: new Date().toISOString() },
      { onConflict: "client_id,month,department" }
    );

    // ── Cascade to Juneau child stores if applicable ──
    const savingClient = clients.find(c => c.id === clientId);
    if (savingClient?.name === JUNEAU_PARENT_NAME && !JUNEAU_NO_CASCADE.has(fieldKey)) {
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

  // Completion % — only counts active fields for leads dept
  const getCompletion = (client, monthStr) => {
    const leadsConfig = getLeadsConfig(client.name);
    let total = 0, filled = 0;
    BULK_DEPTS.forEach(dept => {
      dept.fields.forEach(f => {
        if (dept.id === "leads" && !leadsConfig.active.includes(f.key)) return;
        total++;
        const val = allData[client.id]?.[monthStr]?.[dept.id]?.[f.key];
        if (val !== null && val !== undefined && String(val).trim() !== "") filled++;
      });
    });
    return { total, filled, pct: total > 0 ? Math.round((filled / total) * 100) : 0 };
  };

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

  const totalFields = BULK_DEPTS.reduce((sum, d) => sum + d.fields.length, 0);
  const activeSaveCount = Object.keys(savingCells).length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>

      {/* ── Sticky nav bar ── */}
      <div style={{ background: C.navy, padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 200, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/Taggart_Advertising_Logo.png" alt="Taggart" style={{ height: 32 }} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Bulk Data Editor</span>
          <span style={{ background: "rgba(0,201,232,0.2)", color: C.cyan, borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>ADMIN ONLY</span>
          {activeSaveCount > 0 && (
            <span style={{ background: C.o + "33", color: C.o, borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
              ↻ Saving {activeSaveCount} cell{activeSaveCount !== 1 ? "s" : ""}...
            </span>
          )}
          {activeSaveCount === 0 && lastRefresh && (
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
              ✓ All saved · {clients.length} clients · {ALL_MONTHS.length} months · {totalFields} fields
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10, fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#eff6ff", border: "1px solid #93c5fd", display: "inline-block" }} /> API data
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#fff", border: "1px solid #d0d5dd", display: "inline-block" }} /> Manual (locked)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#f8fafc", border: "1px solid #e4e7ec", display: "inline-block" }} /> Empty
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#fffbeb", border: "1px solid #fde68a", display: "inline-block" }} /> Editing
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, backgroundImage: "repeating-linear-gradient(45deg,#f0f0f0,#f0f0f0 2px,#e8e8e8 2px,#e8e8e8 4px)", border: "1px solid #ddd", display: "inline-block" }} /> N/A
            </span>
          </div>
          <button
            onClick={loadData}
            disabled={refreshing}
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 6, padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: refreshing ? "not-allowed" : "pointer", fontFamily: F, opacity: refreshing ? 0.6 : 1 }}
          >
            {refreshing ? "↻ Refreshing..." : "↻ Refresh Data"}
          </button>
          <a href="/admin" style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>← Admin Panel</a>
        </div>
      </div>

      {/* ── Scrollable grid ── */}
      <div style={{ overflow: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 12, fontFamily: F }}>

          {/* ── Column headers — both rows sticky ── */}
         <thead>
            <tr>
              <th rowSpan={2} style={{ position: "sticky", top: 56, left: 0, zIndex: 70, background: "#1e3a5f", color: "#fff", fontWeight: 700, fontSize: 11, padding: "8px 12px", textAlign: "left", width: 150, minWidth: 150, borderRight: `3px solid ${C.cyan}`, borderBottom: `1px solid rgba(255,255,255,0.1)`, whiteSpace: "nowrap" }}>
                Client
              </th>
              <th rowSpan={2} style={{ position: "sticky", top: 56, left: 150, zIndex: 70, background: "#1e3a5f", color: "#fff", fontWeight: 700, fontSize: 11, padding: "8px 10px", textAlign: "center", width: 75, minWidth: 75, borderRight: `2px solid rgba(255,255,255,0.15)`, borderBottom: `1px solid rgba(255,255,255,0.1)` }}>
                Month
              </th>
              <th rowSpan={2} style={{ position: "sticky", top: 56, left: 225, zIndex: 70, background: "#1e3a5f", color: "#fff", fontWeight: 700, fontSize: 10, padding: "8px 6px", textAlign: "center", width: 44, minWidth: 44, borderRight: `2px solid rgba(255,255,255,0.15)`, borderBottom: `1px solid rgba(255,255,255,0.1)` }}>
                Fill %
              </th>
              {BULK_DEPTS.map(dept => (
                <th key={dept.id} colSpan={dept.fields.length}
                  style={{ position: "sticky", top: 56, zIndex: 50, background: dept.color, color: "#fff", fontSize: 10, fontWeight: 700, padding: "6px 8px", textAlign: "center", borderRight: "3px solid #fff", borderBottom: "1px solid rgba(255,255,255,0.3)", whiteSpace: "nowrap", letterSpacing: "0.05em" }}>
                  {dept.label}
                </th>
              ))}
            </tr>
            <tr>
              {BULK_DEPTS.map(dept =>
                dept.fields.map((f, fi) => (
                  <th key={`h_${dept.id}_${f.key}`}
                    style={{ position: "sticky", top: 89, zIndex: 50, background: dept.color + "cc", color: "#fff", fontSize: 10, fontWeight: 600, padding: "4px 5px", textAlign: "center", borderRight: fi === dept.fields.length - 1 ? "3px solid #fff" : `1px solid ${dept.color}88`, width: 64, minWidth: 64, whiteSpace: "nowrap", borderBottom: `2px solid ${dept.color}` }}>
                    {f.label}
                  </th>
                ))
              )}
            </tr>
          </thead>

          {/* ── Data rows ── */}
          <tbody>
            {clients.map((client, ci) => {
              const clientBg = ci % 2 === 0 ? "#f0f4ff" : "#f5f0ff";
              const leadsConfig = getLeadsConfig(client.name);
              return ALL_MONTHS.map((mon, mi) => {
                const isFirstRow = mi === 0;
                const comp = getCompletion(client, mon.str);
                const rowBg = mi % 2 === 0 ? C.white : "#fafafa";
                const compColor = comp.pct === 100 ? C.g : comp.pct >= 50 ? C.o : comp.pct > 0 ? "#f59e0b88" : C.tl;

                return (
                  <tr key={`${client.id}_${mon.str}`}>

                    {isFirstRow && (
                      <td rowSpan={ALL_MONTHS.length}
                        style={{ position: "sticky", left: 0, zIndex: 10, background: clientBg, borderRight: `3px solid ${C.cyan}`, borderBottom: `3px solid ${C.bd}`, padding: "10px 12px", verticalAlign: "top", width: 150, minWidth: 150 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.t, lineHeight: 1.3 }}>{client.name}</div>
                        <div style={{ fontSize: 10, color: C.tl, marginTop: 3 }}>{client.group_name}</div>
                      </td>
                    )}

                    <td style={{ position: "sticky", left: 150, zIndex: 10, background: rowBg, borderRight: `2px solid rgba(0,0,0,0.06)`, borderBottom: `1px solid ${C.bl2}`, padding: "4px 8px", textAlign: "center", width: 75, minWidth: 75 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.t, whiteSpace: "nowrap" }}>{mon.label}</div>
                    </td>

                    <td style={{ position: "sticky", left: 225, zIndex: 10, background: rowBg, borderRight: `2px solid rgba(0,0,0,0.08)`, borderBottom: `1px solid ${C.bl2}`, padding: "4px 4px", textAlign: "center", width: 44, minWidth: 44 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: compColor }}>{comp.pct > 0 ? `${comp.pct}%` : "—"}</div>
                    </td>

                    {BULK_DEPTS.map(dept =>
                      dept.fields.map((f, fi) => {
                        const deptData = allData[client.id]?.[mon.str]?.[dept.id] || {};
                        const val = deptData[f.key];
                        const isManualLocked = (deptData._manual_overrides || []).includes(f.key);
                        const isApiSourced = !!deptData._pulled_at && !isManualLocked;
                        const isDisabled = dept.id === "leads" && !leadsConfig.active.includes(f.key);

                        // Dynamic OEM label for Juneau brand stores
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
                            disabled={isDisabled}
                            onSave={handleCellSave}
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
