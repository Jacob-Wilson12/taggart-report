'use client';
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabase";

/* ─── CONSTANTS ─── */
const C = {
  white: "#fff", navy: "#0c1a2e", cyan: "#00c9e8", cyanD: "#00a5bf",
  cyanL: "#e6f9fc", t: "#1a1a2e", tl: "#6b7280", bd: "#d0d5dd",
  bl2: "#e4e7ec", g: "#10b981", gL: "#f0fdf4", r: "#ef4444", rL: "#fef2f2",
  o: "#f59e0b", oL: "#fffbeb", p: "#8b5cf6", pL: "#f5f3ff",
  sh: "0 2px 6px rgba(0,0,0,0.08)", bg: "#f0f2f5"
};
const F = "Inter,system-ui,sans-serif";

const DEPARTMENTS = [
  { id: "leads",      label: "Leads & CRM",     icon: "🎯", roles: ["admin","account_manager","editor"] },
  { id: "callrail",   label: "CallRail",         icon: "📞", roles: ["admin","account_manager","editor"] },
  { id: "seo",        label: "SEO",              icon: "🔍", roles: ["admin","account_manager","editor"] },
  { id: "gbp",        label: "Google Business",  icon: "📍", roles: ["admin","account_manager","editor"] },
  { id: "google_ads", label: "Google Ads",       icon: "📢", roles: ["admin","account_manager","editor"] },
  { id: "meta_ads",   label: "Meta Ads",         icon: "📱", roles: ["admin","account_manager","editor"] },
  { id: "social",     label: "Organic Social",   icon: "🎬", roles: ["admin","account_manager","editor"] },
  { id: "email",      label: "Email",            icon: "✉️", roles: ["admin","account_manager","editor"] },
  { id: "creative",   label: "Creative",         icon: "🎨", roles: ["admin","account_manager","editor"] },
];

const DEPT_FIELDS = {
  leads: [
    { key: "total_leads",    label: "Total Leads",       type: "number" },
    { key: "website_leads",  label: "Website Leads",     type: "number" },
    { key: "third_party",    label: "Third Party Leads", type: "number" },
    { key: "facebook_leads", label: "Facebook Leads",    type: "number" },
    { key: "total_sold",     label: "Total Sold",        type: "number" },
    { key: "website_sold",   label: "Website Sold",      type: "number" },
    { key: "third_party_sold",label: "Third Party Sold", type: "number" },
    { key: "facebook_sold",  label: "Facebook Sold",     type: "number" },
    { key: "phone_sold",     label: "Phone Sold",        type: "number" },
    { key: "notes",          label: "Notes",             type: "textarea" },
  ],
  callrail: [
    { key: "total_calls",    label: "Total Calls",           type: "number" },
    { key: "website_calls",  label: "Calls from Website",    type: "number" },
    { key: "ads_calls",      label: "Calls from Ads",        type: "number" },
    { key: "gbp_calls",      label: "Calls from GBP",        type: "number" },
    { key: "notes",          label: "Notes",                 type: "textarea" },
  ],
  seo: [
    { key: "phone_calls",       label: "Phone Calls (SEO)",      type: "number" },
    { key: "form_submissions",  label: "Form Submissions",       type: "number" },
    { key: "ctr",               label: "CTR (%)",                type: "decimal" },
    { key: "organic_sessions",  label: "Organic Sessions",       type: "number" },
    { key: "page1_keywords",    label: "Page 1 Keywords",        type: "number" },
    { key: "impressions",       label: "Impressions",            type: "number" },
    { key: "vdp_views",         label: "VDP Views",              type: "number" },
    { key: "direction_requests",label: "Direction Requests",     type: "number" },
    { key: "chat_conversations",label: "Chat Conversations",     type: "number" },
    { key: "top_query",         label: "Top Performing Query",   type: "text" },
    { key: "work_completed",    label: "Work Completed",         type: "textarea" },
    { key: "wins",              label: "Wins",                   type: "textarea", hint: "One per line" },
    { key: "losses",            label: "Losses / Watch Items",   type: "textarea", hint: "One per line" },
    { key: "next_month",        label: "What's Coming Next Month", type: "textarea", hint: "One per line" },
  ],
  gbp: [
    { key: "profile_views",     label: "Profile Views",          type: "number" },
    { key: "search_appearances",label: "Search Appearances",     type: "number" },
    { key: "map_views",         label: "Map Views",              type: "number" },
    { key: "website_clicks",    label: "Website Clicks",         type: "number" },
    { key: "phone_calls",       label: "Phone Calls",            type: "number" },
    { key: "direction_requests",label: "Direction Requests",     type: "number" },
    { key: "review_count",      label: "Total Reviews",          type: "number" },
    { key: "avg_rating",        label: "Average Rating",         type: "decimal" },
    { key: "new_reviews",       label: "New Reviews This Month", type: "number" },
    { key: "photo_count",       label: "Photos on Profile",      type: "number" },
    { key: "posts_published",   label: "Posts Published",        type: "number" },
    { key: "work_completed",    label: "Work Completed",         type: "textarea" },
    { key: "wins",              label: "Wins",                   type: "textarea", hint: "One per line" },
    { key: "losses",            label: "Losses / Watch Items",   type: "textarea", hint: "One per line" },
    { key: "next_month",        label: "What's Coming Next Month", type: "textarea", hint: "One per line" },
  ],
  google_ads: [
    { key: "conversions",       label: "Total Conversions",      type: "number" },
    { key: "cost_per_lead",     label: "Cost Per Lead ($)",      type: "decimal" },
    { key: "total_spend",       label: "Total Spend ($)",        type: "decimal" },
    { key: "budget",            label: "Monthly Budget ($)",     type: "decimal" },
    { key: "ctr",               label: "CTR (%)",                type: "decimal" },
    { key: "cpc",               label: "Avg CPC ($)",            type: "decimal" },
    { key: "impression_share",  label: "Impression Share (%)",   type: "decimal" },
    { key: "top_campaign",      label: "Top Performing Campaign",type: "text" },
    { key: "work_completed",    label: "Work Completed",         type: "textarea" },
    { key: "wins",              label: "Wins",                   type: "textarea", hint: "One per line" },
    { key: "losses",            label: "Losses / Watch Items",   type: "textarea", hint: "One per line" },
    { key: "next_month",        label: "What's Coming Next Month", type: "textarea", hint: "One per line" },
  ],
  meta_ads: [
    { key: "conversions",       label: "Total Conversions",      type: "number" },
    { key: "cost_per_lead",     label: "Cost Per Lead ($)",      type: "decimal" },
    { key: "reach",             label: "Reach",                  type: "number" },
    { key: "cpc",               label: "Avg CPC ($)",            type: "decimal" },
    { key: "frequency",         label: "Frequency",              type: "decimal" },
    { key: "engagement_rate",   label: "Engagement Rate (%)",    type: "decimal" },
    { key: "lead_form_completion", label: "Lead Form Completion (%)", type: "decimal" },
    { key: "top_ad",            label: "Top Performing Ad",      type: "text" },
    { key: "work_completed",    label: "Work Completed",         type: "textarea" },
    { key: "wins",              label: "Wins",                   type: "textarea", hint: "One per line" },
    { key: "losses",            label: "Losses / Watch Items",   type: "textarea", hint: "One per line" },
    { key: "next_month",        label: "What's Coming Next Month", type: "textarea", hint: "One per line" },
  ],
  social: [
    { key: "total_reach",       label: "Total Reach",            type: "number" },
    { key: "total_engagement",  label: "Total Engagement",       type: "number" },
    { key: "new_followers",     label: "New Followers",          type: "number" },
    { key: "posts_published",   label: "Posts Published",        type: "number" },
    { key: "videos_published",  label: "Videos Published",       type: "number" },
    { key: "website_clicks",    label: "Website Clicks",         type: "number" },
    { key: "ig_followers",      label: "Instagram Followers",    type: "number" },
    { key: "fb_followers",      label: "Facebook Followers",     type: "number" },
    { key: "tiktok_followers",  label: "TikTok Followers",       type: "number" },
    { key: "yt_followers",      label: "YouTube Subscribers",    type: "number" },
    { key: "top_video",         label: "Top Performing Video",   type: "text" },
    { key: "top_video_views",   label: "Top Video Views",        type: "number" },
    { key: "work_completed",    label: "Work Completed",         type: "textarea" },
    { key: "wins",              label: "Wins",                   type: "textarea", hint: "One per line" },
    { key: "losses",            label: "Losses / Watch Items",   type: "textarea", hint: "One per line" },
    { key: "next_month",        label: "What's Coming Next Month", type: "textarea", hint: "One per line" },
  ],
  email: [
    { key: "campaigns_sent",    label: "Campaigns Sent",         type: "number" },
    { key: "total_recipients",  label: "Total Recipients",       type: "number" },
    { key: "site_visits",       label: "Site Visits from Email", type: "number" },
    { key: "conversions",       label: "Conversions from Email", type: "number" },
    { key: "work_completed",    label: "Work Completed",         type: "textarea" },
    { key: "wins",              label: "Wins",                   type: "textarea", hint: "One per line" },
    { key: "losses",            label: "Losses / Watch Items",   type: "textarea", hint: "One per line" },
    { key: "next_month",        label: "What's Coming Next Month", type: "textarea", hint: "One per line" },
  ],
  creative: [
    { key: "total_assets",      label: "Total Assets Delivered", type: "number" },
    { key: "videos",            label: "Videos",                 type: "number" },
    { key: "graphics",          label: "Graphics / Statics",     type: "number" },
    { key: "banners",           label: "Banners",                type: "number" },
    { key: "print",             label: "Print Pieces",           type: "number" },
    { key: "next_month",        label: "What's Coming Next Month", type: "textarea", hint: "One per line" },
  ],
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const canEdit = (role, department, deptId) => {
  if (role === "admin") return true;
  if (role === "account_manager") return true;
  if (role === "editor" && department === deptId) return true;
  return false;
};

const canPublish = (role) => role === "admin" || role === "account_manager";

/* ─── SMALL UI HELPERS ─── */
const Badge = ({ label, color = C.cyan }) => (
  <span style={{ background: color + "22", color, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: F }}>{label}</span>
);

const StatusBadge = ({ status }) => {
  const map = {
    draft:       { label: "Draft",       color: C.tl },
    in_progress: { label: "In Progress", color: C.o },
    review:      { label: "Ready for Review", color: C.p },
    published:   { label: "Published",   color: C.g },
  };
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

/* ─── FIELD INPUT ─── */
const FieldInput = ({ field, value, onChange, disabled }) => {
  const base = {
    width: "100%", padding: "10px 12px", borderRadius: 7,
    border: `1px solid ${C.bd}`, fontSize: 13, fontFamily: F,
    outline: "none", boxSizing: "border-box",
    background: disabled ? "#f8fafc" : C.white,
    color: disabled ? C.tl : C.t,
    cursor: disabled ? "not-allowed" : "text",
  };
  if (field.type === "textarea") return (
    <textarea
      value={value || ""}
      onChange={e => onChange(field.key, e.target.value)}
      disabled={disabled}
      rows={3}
      placeholder={field.hint || `Enter ${field.label.toLowerCase()}...`}
      style={{ ...base, resize: "vertical", lineHeight: 1.5 }}
    />
  );
  return (
    <input
      type={field.type === "number" || field.type === "decimal" ? "number" : "text"}
      step={field.type === "decimal" ? "0.01" : "1"}
      value={value || ""}
      onChange={e => onChange(field.key, e.target.value)}
      disabled={disabled}
      placeholder={field.hint || "0"}
      style={base}
    />
  );
};

/* ─── DEPARTMENT FORM ─── */
function DeptForm({ dept, clientId, month, userRole, userDept, onSaved }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fields = DEPT_FIELDS[dept.id] || [];
  const editable = canEdit(userRole, userDept, dept.id);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: row } = await supabase
        .from("report_data")
        .select("data")
        .eq("client_id", clientId)
        .eq("month", month)
        .eq("department", dept.id)
        .single();
      setData(row?.data || {});
      setLoading(false);
    };
    load();
  }, [clientId, month, dept.id]);

  const handleChange = (key, val) => {
    setData(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("report_data").upsert({
      client_id: clientId,
      month,
      department: dept.id,
      data,
      last_updated_by: user.id,
      last_updated_at: new Date().toISOString(),
    }, { onConflict: "client_id,month,department" });
    setSaving(false);
    setSaved(true);
    if (onSaved) onSaved(dept.id);
  };

  const filledCount = fields.filter(f => data[f.key] && String(data[f.key]).trim() !== "").length;

  if (loading) return (
    <div style={{ padding: 24, textAlign: "center", color: C.tl, fontFamily: F, fontSize: 13 }}>Loading...</div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: C.tl, fontFamily: F }}>
            {filledCount} of {fields.length} fields filled
          </div>
          <CompletionBar filled={filledCount} total={fields.length} />
        </div>
        {editable && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saved ? C.g : C.navy, color: "#fff", border: "none",
              borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: F, minWidth: 100,
            }}
          >
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save"}
          </button>
        )}
      </div>

      {!editable && (
        <div style={{ background: C.oL, border: `1px solid ${C.o}22`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: C.o, fontFamily: F }}>
          👁 View only — you can edit <strong>{userDept}</strong> data only.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {fields.map(field => (
          <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.t, fontFamily: F }}>
              {field.label}
              {field.hint && <span style={{ color: C.tl, fontWeight: 400, marginLeft: 4 }}>({field.hint})</span>}
            </label>
            <FieldInput
              field={field}
              value={data[field.key]}
              onChange={handleChange}
              disabled={!editable}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── CLIENT REPORT VIEW ─── */
function ClientReport({ client, userRole, userDept, onBack }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIdx, setMonthIdx] = useState(now.getMonth() === 0 ? 11 : now.getMonth() - 1);
  const [activeDept, setActiveDept] = useState(DEPARTMENTS[0].id);
  const [reportStatus, setReportStatus] = useState("draft");
  const [publishing, setPublishing] = useState(false);
  const [deptCompletion, setDeptCompletion] = useState({});

  const month = `${year}-${String(monthIdx + 1).padStart(2, "0")}-01`;

  useEffect(() => {
    const loadStatus = async () => {
      const { data } = await supabase
        .from("monthly_reports")
        .select("status")
        .eq("client_id", client.id)
        .eq("month", month)
        .single();
      setReportStatus(data?.status || "draft");
    };
    loadStatus();
  }, [client.id, month]);

  const handleSaved = useCallback(async (deptId) => {
    const fields = DEPT_FIELDS[deptId] || [];
    const { data: row } = await supabase
      .from("report_data")
      .select("data")
      .eq("client_id", client.id)
      .eq("month", month)
      .eq("department", deptId)
      .single();
    const filled = fields.filter(f => row?.data?.[f.key] && String(row.data[f.key]).trim() !== "").length;
    setDeptCompletion(prev => ({ ...prev, [deptId]: { filled, total: fields.length } }));

    // Auto-update status to in_progress
    if (reportStatus === "draft") {
      await supabase.from("monthly_reports").upsert({
        client_id: client.id, month, status: "in_progress"
      }, { onConflict: "client_id,month" });
      setReportStatus("in_progress");
    }
  }, [client.id, month, reportStatus]);

  const handlePublish = async () => {
    if (!canPublish(userRole)) return;
    setPublishing(true);
    const { data: { user } } = await supabase.auth.getUser();
    const newStatus = reportStatus === "published" ? "review" : "published";
    await supabase.from("monthly_reports").upsert({
      client_id: client.id, month, status: newStatus,
      published_at: newStatus === "published" ? new Date().toISOString() : null,
      published_by: newStatus === "published" ? user.id : null,
    }, { onConflict: "client_id,month" });
    setReportStatus(newStatus);
    setPublishing(false);
  };

  const handleMarkReview = async () => {
    await supabase.from("monthly_reports").upsert({
      client_id: client.id, month, status: "review"
    }, { onConflict: "client_id,month" });
    setReportStatus("review");
  };

  const activeDeptObj = DEPARTMENTS.find(d => d.id === activeDept);

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.cyan, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: F, padding: 0 }}>
          ← All Clients
        </button>
        <span style={{ color: C.tl }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.t, fontFamily: F }}>{client.name}</span>
      </div>

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.t, margin: "0 0 4px", fontFamily: F }}>{client.name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusBadge status={reportStatus} />
            <span style={{ fontSize: 12, color: C.tl, fontFamily: F }}>{client.group_name}</span>
          </div>
        </div>

        {/* Month/Year selector */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={monthIdx}
            onChange={e => setMonthIdx(Number(e.target.value))}
            style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${C.bd}`, fontSize: 13, fontFamily: F, background: C.white, cursor: "pointer" }}
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${C.bd}`, fontSize: 13, fontFamily: F, background: C.white, cursor: "pointer" }}
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {/* Action buttons */}
          {userRole !== "viewer" && reportStatus !== "published" && (
            <button
              onClick={handleMarkReview}
              style={{ background: C.pL, color: C.p, border: `1px solid ${C.p}44`, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F }}
            >
              Mark Ready for Review
            </button>
          )}
          {canPublish(userRole) && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              style={{
                background: reportStatus === "published" ? C.oL : C.g,
                color: reportStatus === "published" ? C.o : "#fff",
                border: "none", borderRadius: 8, padding: "8px 18px",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F,
              }}
            >
              {publishing ? "..." : reportStatus === "published" ? "Unpublish" : "Publish Report"}
            </button>
          )}
        </div>
      </div>

      {/* Department tabs + form */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* Sidebar */}
        <div style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {DEPARTMENTS.map(dept => {
            const comp = deptCompletion[dept.id];
            const isActive = activeDept === dept.id;
            const pct = comp ? Math.round((comp.filled / comp.total) * 100) : null;
            return (
              <button
                key={dept.id}
                onClick={() => setActiveDept(dept.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: isActive ? C.navy : C.white,
                  color: isActive ? "#fff" : C.t,
                  fontFamily: F, fontSize: 13, fontWeight: isActive ? 700 : 500,
                  boxShadow: isActive ? "none" : C.sh,
                  textAlign: "left",
                }}
              >
                <span>{dept.icon} {dept.label}</span>
                {pct !== null && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: pct === 100 ? (isActive ? "#6ee7b7" : C.g) : (isActive ? "#fca5a5" : C.tl)
                  }}>{pct}%</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Form panel */}
        <div style={{ flex: 1, background: C.white, borderRadius: 12, padding: 24, border: `1px solid ${C.bd}`, boxShadow: C.sh }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.t, margin: "0 0 4px", fontFamily: F }}>
              {activeDeptObj?.icon} {activeDeptObj?.label}
            </h3>
            <p style={{ fontSize: 12, color: C.tl, margin: 0, fontFamily: F }}>
              {MONTHS[monthIdx]} {year} — {client.name}
            </p>
          </div>
          <DeptForm
            dept={activeDeptObj}
            clientId={client.id}
            month={month}
            userRole={userRole}
            userDept={userDept}
            onSaved={handleSaved}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── OVERVIEW / CLIENT LIST ─── */
function Overview({ clients, userRole, onSelectClient }) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}-01`;
  const lastMonth = now.getMonth() === 0
    ? `${now.getFullYear() - 1}-12-01`
    : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}-01`;

  const [statuses, setStatuses] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("monthly_reports")
        .select("client_id, status, month")
        .in("client_id", clients.map(c => c.id));
      const map = {};
      (data || []).forEach(r => { map[`${r.client_id}_${r.month}`] = r.status; });
      setStatuses(map);
    };
    if (clients.length) load();
  }, [clients]);

  const groups = [...new Set(clients.map(c => c.group_name))];
  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const statusCounts = { draft: 0, in_progress: 0, review: 0, published: 0 };
  clients.forEach(c => {
    const s = statuses[`${c.id}_${lastMonth}`] || "draft";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Total Clients", value: clients.length, color: C.navy },
          { label: "Published", value: statusCounts.published, color: C.g },
          { label: "In Review", value: statusCounts.review, color: C.p },
          { label: "In Progress", value: statusCounts.in_progress, color: C.o },
          { label: "Not Started", value: statusCounts.draft, color: C.tl },
        ].map((s, i) => (
          <div key={i} style={{ background: C.white, borderRadius: 10, padding: "16px 20px", flex: 1, minWidth: 120, boxShadow: C.sh, border: `1px solid ${C.bd}`, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.tl, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, fontFamily: F }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: s.color, fontFamily: F }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search clients..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", maxWidth: 320, padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.bd}`, fontSize: 13, fontFamily: F, outline: "none", marginBottom: 20, boxSizing: "border-box" }}
      />

      {/* Client list by group */}
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
                  <button
                    key={client.id}
                    onClick={() => onSelectClient(client)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: C.white, border: `1px solid ${C.bd}`, borderRadius: 10,
                      padding: "14px 20px", cursor: "pointer", textAlign: "left",
                      boxShadow: C.sh, fontFamily: F, transition: "box-shadow 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = C.sh}
                  >
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

/* ─── TEAM MANAGEMENT ─── */
function TeamPage({ currentUserId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviteDept, setInviteDept] = useState("seo");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("user_profiles").select("*").order("created_at");
    setMembers(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (id, role) => {
    await supabase.from("user_profiles").update({ role }).eq("id", id);
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
  };

  const handleDeptChange = async (id, department) => {
    await supabase.from("user_profiles").update({ department }).eq("id", id);
    setMembers(prev => prev.map(m => m.id === id ? { ...m, department } : m));
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    setInviteMsg("");
    const { error } = await supabase.auth.admin?.inviteUserByEmail
      ? await supabase.auth.admin.inviteUserByEmail(inviteEmail)
      : { error: null };

    // Fallback: just show instructions since admin invite requires service key
    setInviteMsg(`To add ${inviteEmail}: Go to Supabase → Authentication → Users → Invite User. Then run:\nINSERT INTO user_profiles (id, email, role, department, full_name)\nSELECT id, email, '${inviteRole}', '${inviteDept}', email FROM auth.users WHERE email = '${inviteEmail}';`);
    setInviting(false);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.tl, fontFamily: F }}>Loading team...</div>;

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: C.t, margin: "0 0 20px", fontFamily: F }}>Team Members</h3>

      {/* Current members */}
      <div style={{ background: C.white, border: `1px solid ${C.bd}`, borderRadius: 12, overflow: "hidden", boxShadow: C.sh, marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F, fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Name / Email", "Role", "Department", ""].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.tl, fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m, i) => (
              <tr key={m.id} style={{ borderTop: `1px solid ${C.bd}` }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontWeight: 600, color: C.t }}>{m.full_name || "—"}</div>
                  <div style={{ fontSize: 11, color: C.tl }}>{m.email}</div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {m.id === currentUserId ? (
                    <Badge label={m.role} color={C.cyan} />
                  ) : (
                    <select
                      value={m.role || "editor"}
                      onChange={e => handleRoleChange(m.id, e.target.value)}
                      style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.bd}`, fontSize: 12, fontFamily: F, cursor: "pointer" }}
                    >
                      {["admin", "account_manager", "editor", "viewer"].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {m.role === "editor" ? (
                    <select
                      value={m.department || "seo"}
                      onChange={e => handleDeptChange(m.id, e.target.value)}
                      style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.bd}`, fontSize: 12, fontFamily: F, cursor: "pointer" }}
                    >
                      {["seo", "ads", "social", "creative", "account", "admin"].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ fontSize: 12, color: C.tl }}>All departments</span>
                  )}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {m.id !== currentUserId && (
                    <span style={{ fontSize: 11, color: C.tl }}>{new Date(m.created_at).toLocaleDateString()}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add team member */}
      <div style={{ background: C.white, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 20, boxShadow: C.sh }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: C.t, margin: "0 0 16px", fontFamily: F }}>Add Team Member</h4>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.tl, display: "block", marginBottom: 4, fontFamily: F }}>Email</label>
            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="name@email.com"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 7, border: `1px solid ${C.bd}`, fontSize: 13, fontFamily: F, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.tl, display: "block", marginBottom: 4, fontFamily: F }}>Role</label>
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 7, border: `1px solid ${C.bd}`, fontSize: 13, fontFamily: F, cursor: "pointer" }}>
              {["admin", "account_manager", "editor", "viewer"].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {inviteRole === "editor" && (
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.tl, display: "block", marginBottom: 4, fontFamily: F }}>Department</label>
              <select value={inviteDept} onChange={e => setInviteDept(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 7, border: `1px solid ${C.bd}`, fontSize: 13, fontFamily: F, cursor: "pointer" }}>
                {["seo", "ads", "social", "creative", "account"].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          <button onClick={handleInvite} disabled={inviting}
            style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
            {inviting ? "..." : "Get Instructions"}
          </button>
        </div>
        {inviteMsg && (
          <div style={{ marginTop: 16, background: "#f8fafc", border: `1px solid ${C.bd}`, borderRadius: 8, padding: "12px 16px", fontSize: 12, fontFamily: "monospace", color: C.t, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {inviteMsg}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── ROOT ADMIN APP ─── */
export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activePage, setActivePage] = useState("overview");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session); setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      const { data: prof } = await supabase.from("user_profiles").select("*").eq("id", session.user.id).single();
      setProfile(prof);

      // Block viewers from admin panel
      if (prof?.role === "viewer") return;

      let data;
      if (prof?.role === "admin") {
        ({ data } = await supabase.from("clients").select("id,name,group_name,tier").eq("active", true));
      } else {
        const { data: access } = await supabase.from("user_client_access").select("client_id").eq("user_id", session.user.id);
        const ids = access?.map(r => r.client_id) || [];
        ({ data } = await supabase.from("clients").select("id,name,group_name,tier").eq("active", true).in("id", ids));
      }

      const CLIENT_ORDER = ["Goode Motor Group","Goode Motor Ford","Goode Motor Mazda","Twin Falls Volkswagen","Juneau Auto Mall","Juneau Subaru","Juneau CDJR","Juneau Toyota","Juneau Chevrolet","Juneau Honda","Juneau Powersports","Cassia Car Rental","Explore Juneau"];
      const sorted = (data || []).sort((a, b) => {
        const ai = CLIENT_ORDER.indexOf(a.name), bi = CLIENT_ORDER.indexOf(b.name);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1; if (bi !== -1) return 1;
        return a.name.localeCompare(b.name);
      });
      setClients(sorted);
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

  const navItems = [
    { id: "overview", label: "📊 Overview" },
    { id: "team",     label: "👥 Team",    adminOnly: true },
  ];

  return (
    <div style={{ minHeight: "100vh", fontFamily: F, background: C.bg }}>
      {/* Header */}
      <div style={{ background: C.navy, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src="/Taggart_Advertising_Logo.png" alt="Taggart" style={{ height: 36 }} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: F }}>Admin Panel</span>
          <span style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
            {profile?.role}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{session.user.email}</span>
          <a href="/" style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>← Client View</a>
          <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: F }}>Sign Out</button>
        </div>
      </div>

      {/* Sub-nav */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.bd}`, padding: "0 24px", display: "flex", gap: 4 }}>
        {navItems.filter(n => !n.adminOnly || profile?.role === "admin").map(n => (
          <button
            key={n.id}
            onClick={() => { setActivePage(n.id); setSelectedClient(null); }}
            style={{
              padding: "11px 16px", border: "none", cursor: "pointer", background: "transparent",
              fontSize: 13, fontWeight: 600, fontFamily: F,
              color: activePage === n.id ? C.cyanD : C.tl,
              borderBottom: activePage === n.id ? `2px solid ${C.cyan}` : "2px solid transparent",
            }}
          >{n.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "28px 24px", maxWidth: 1200, margin: "0 auto" }}>
        {activePage === "overview" && !selectedClient && (
          <Overview clients={clients} userRole={profile?.role} onSelectClient={c => { setSelectedClient(c); setActivePage("overview"); }} />
        )}
        {activePage === "overview" && selectedClient && (
          <ClientReport
            client={selectedClient}
            userRole={profile?.role}
            userDept={profile?.department}
            onBack={() => setSelectedClient(null)}
          />
        )}
        {activePage === "team" && profile?.role === "admin" && (
          <TeamPage currentUserId={session.user.id} />
        )}
      </div>
    </div>
  );
}
