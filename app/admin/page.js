'use client';
import React, { useState, useEffect, useCallback, useRef } from "react";
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

const BENCHMARKS = {
  seo: [
    { key: "organic_sessions",    label: "Organic Sessions / mo",    range: [5000, 8000],  unit: "",     lowerBetter: false, note: "Single-point dealership avg" },
    { key: "ctr",                 label: "Organic CTR",              range: [3.5, 5.0],    unit: "%",    lowerBetter: false, note: "Search Console avg CTR" },
    { key: "page1_keywords",      label: "Page 1 Keywords",          range: [25, 40],      unit: "",     lowerBetter: false, note: "Well above avg = 40+" },
    { key: "organic_traffic_pct", label: "Organic % of Traffic",     range: [40, 55],      unit: "%",    lowerBetter: false, note: "From GA4 channel breakdown" },
    { key: "bounce_rate",         label: "Bounce Rate",              range: [40, 55],      unit: "%",    lowerBetter: true,  note: "Lower is better" },
    { key: "avg_session_duration",label: "Avg Session Duration",     range: [120, 180],    unit: " sec", lowerBetter: false, note: "2–3 min is healthy" },
  ],
  google_ads: [
    { key: "ctr",              label: "Click-Through Rate",     range: [7, 10],    unit: "%",  lowerBetter: false, note: "Automotive search avg ~8.29%" },
    { key: "cpc",              label: "Cost Per Click",         range: [1.5, 3.0], unit: "$",  lowerBetter: true,  note: "Automotive avg ~$2.41" },
    { key: "cost_per_lead",    label: "Cost Per Lead",          range: [25, 45],   unit: "$",  lowerBetter: true,  note: "Automotive avg $25–45" },
    { key: "impression_share", label: "Impression Share",       range: [60, 80],   unit: "%",  lowerBetter: false, note: "60–80% is healthy coverage" },
    { key: "quality_score",    label: "Avg Quality Score",      range: [6, 8],     unit: "",   lowerBetter: false, note: "Above 6 is industry standard" },
  ],
  meta_ads: [
    { key: "cpc",              label: "Cost Per Click",         range: [0.5, 1.0], unit: "$",  lowerBetter: true,  note: "Automotive avg ~$0.79" },
    { key: "ctr",              label: "CTR",                    range: [1.5, 2.5], unit: "%",  lowerBetter: false, note: "Healthy for auto" },
    { key: "cost_per_lead",    label: "Cost Per Lead",          range: [25, 40],   unit: "$",  lowerBetter: true,  note: "Industry avg $25–40" },
    { key: "engagement_rate",  label: "Engagement Rate",        range: [2, 4],     unit: "%",  lowerBetter: false, note: "Above 4% is excellent" },
    { key: "frequency",        label: "Ad Frequency",           range: [1.5, 3.0], unit: "",   lowerBetter: false, note: "Watch for fatigue above 3.5" },
    { key: "video_view_rate",  label: "Video View Rate",        range: [25, 35],   unit: "%",  lowerBetter: false, note: "Completion rate for video ads" },
  ],
  gbp: [
    { key: "avg_rating",       label: "Average Rating",         range: [4.2, 4.5], unit: "★",  lowerBetter: false, note: "Above 4.5 is excellent" },
    { key: "new_reviews",      label: "New Reviews / mo",       range: [3, 6],     unit: "",   lowerBetter: false, note: "6+ is strong" },
    { key: "profile_views",    label: "Profile Views / mo",     range: [2000, 4000],unit: "",  lowerBetter: false, note: "Single-point dealer avg" },
    { key: "website_clicks",   label: "Website Clicks / mo",    range: [200, 400], unit: "",   lowerBetter: false, note: "Above 400 is excellent" },
    { key: "posts_published",  label: "Posts / mo",             range: [4, 8],     unit: "",   lowerBetter: false, note: "Consistent posting schedule" },
  ],
  social: [
    { key: "fb_reach",         label: "FB Monthly Reach",       range: [5000, 20000], unit: "", lowerBetter: false, note: "Varies by audience size" },
    { key: "ig_reach",         label: "IG Monthly Reach",       range: [3000, 15000], unit: "", lowerBetter: false, note: "Organic IG reach" },
    { key: "posts_published",  label: "Posts / mo (total)",     range: [15, 25],   unit: "",   lowerBetter: false, note: "Across all platforms" },
    { key: "web_clicks",       label: "Social → Web Clicks",    range: [100, 250], unit: "",   lowerBetter: false, note: "From GA4 Social channel" },
  ],
  email: [
    { key: "avg_open_rate",    label: "Open Rate",              range: [20, 25],   unit: "%",  lowerBetter: false, note: "Automotive avg 20–25%" },
    { key: "avg_click_rate",   label: "Click Rate",             range: [2, 4],     unit: "%",  lowerBetter: false, note: "Strong CTA performance" },
    { key: "unsubscribe_rate", label: "Unsubscribe Rate",       range: [0.2, 0.5], unit: "%",  lowerBetter: true,  note: "Healthy list retention" },
    { key: "campaigns_sent",   label: "Campaigns / mo",         range: [2, 4],     unit: "",   lowerBetter: false, note: "Right frequency for auto" },
    { key: "list_size",        label: "List Size",              range: [2000, 5000],unit: "",  lowerBetter: false, note: "Single-point dealer avg" },
  ],
};

function getBenchmarkStatus(value, range, lowerBetter) {
  if (value === null || value === undefined || value === "" || isNaN(Number(value))) return "unknown";
  const v = Number(value);
  const [min, max] = range;
  if (lowerBetter) {
    if (v < min) return "above";
    if (v <= max) return "within";
    return "below";
  } else {
    if (v > max) return "above";
    if (v >= min) return "within";
    return "below";
  }
}

const BENCH_STATUS = {
  above:   { label: "Above Benchmark", bg: "#ecfdf5", color: "#10b981", icon: "▲" },
  within:  { label: "Within Range",    bg: "#e6f9fc", color: "#00a5bf", icon: "•" },
  below:   { label: "Below Benchmark", bg: "#fef2f2", color: "#ef4444", icon: "▼" },
  unknown: { label: "No Data",         bg: "#f0f2f5", color: "#8892a4", icon: "—" },
};

const DEPT_BENCH_LABELS = {
  seo: "🔍 SEO", google_ads: "📢 Google Ads", meta_ads: "📱 Meta Ads",
  gbp: "📍 Google Business Profile", social: "🎬 Organic Social", email: "✉️ Email",
};

const LIVE_APIS = {
  seo:       { label: "Search Console", endpoint: "/api/search-console" },
  ga4:       { label: "GA4",            endpoint: "/api/ga4" },
  google_ads:{ label: "Google Ads",     endpoint: "/api/google-ads" },
  callrail:  { label: "CallRail",       endpoint: "/api/callrail" },
  meta_ads:  { label: "Meta Ads",       endpoint: "/api/meta-ads" },
  social:    { label: "Social",         endpoint: "/api/social" },
  gbp:       { label: "GBP",            endpoint: "/api/gbp" },
};

const UPLOAD_DEPTS = ["email", "creative", "social", "seo", "meta_ads", "google_ads"];

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
    { key: "notes",            label: "Notes",               type: "textarea", optional: true },
  ],
  callrail: [
    { key: "total_calls",   label: "Total Calls",        type: "number" },
    { key: "website_calls", label: "Calls from Website", type: "number" },
    { key: "ads_calls",     label: "Calls from Ads",     type: "number" },
    { key: "gbp_calls",     label: "Calls from GBP",     type: "number" },
    { key: "notes",         label: "Notes",              type: "textarea", optional: true },
  ],
  seo: [
    { key: "phone_calls",           label: "Phone Calls (SEO)",          type: "number",   manual: true },
    { key: "form_submissions",      label: "Form Submissions",            type: "number",   api: true },
    { key: "organic_sessions",      label: "Organic Sessions",            type: "number",   api: true },
    { key: "direct_sessions",       label: "Direct Sessions",             type: "number",   manual: true, hint: "From GA4 — Direct channel" },
    { key: "paid_sessions",         label: "Paid Sessions",               type: "number",   manual: true, hint: "From GA4 — Paid channel" },
    { key: "social_sessions",       label: "Social Sessions",             type: "number",   manual: true, hint: "From GA4 — Social channel" },
    { key: "vdp_views",             label: "VDP Views",                   type: "number",   api: true },
    { key: "direction_requests",    label: "Direction Requests",          type: "number",   manual: true },
    { key: "chat_conversations",    label: "Chat Conversations",          type: "number",   manual: true },
    { key: "ctr",                   label: "CTR (%)",                     type: "decimal",  api: true },
    { key: "impressions",           label: "Impressions",                 type: "number",   api: true },
    { key: "page1_keywords",        label: "Page 1 Keywords",             type: "number",   api: true },
    { key: "avg_position",          label: "Avg Position",                type: "decimal",  api: true },
    { key: "bounce_rate",           label: "Bounce Rate (%)",             type: "decimal",  api: true,    hint: "From GA4" },
    { key: "avg_session_duration",  label: "Avg Session Duration (sec)",  type: "number",   api: true,    hint: "From GA4, in seconds" },
    { key: "organic_traffic_pct",   label: "Organic % of Traffic",        type: "decimal",  api: true,    hint: "From GA4 channel breakdown" },
    { key: "top_query",             label: "Top Performing Query",        type: "text",     api: true },
    { key: "tracked_keywords",      label: "Tracked Keywords",            type: "keywords", manual: true, optional: true, hint: "Enter keywords + target positions — positions auto-fill from Search Console" },
    { key: "page_links",            label: "Page Links (SEO)",            type: "links",    manual: true },
    { key: "work_completed",        label: "Work Completed",              type: "textarea", manual: true },
    { key: "wins",                  label: "Wins",                        type: "textarea", manual: true, optional: true, hint: "One per line" },
    { key: "losses",                label: "Losses / Watch Items",        type: "textarea", manual: true, optional: true, hint: "One per line" },
    { key: "next_month",            label: "What's Coming Next Month",    type: "textarea", manual: true, hint: "One per line" },
  ],
  gbp: [
    { key: "profile_views",      label: "Profile Views",          type: "number",   api: true },
    { key: "search_appearances", label: "Search Appearances",     type: "number",   api: true },
    { key: "map_views",          label: "Map Views",              type: "number",   api: true },
    { key: "website_clicks",     label: "Website Clicks",         type: "number",   api: true },
    { key: "phone_calls",        label: "Phone Calls",            type: "number",   api: true },
    { key: "direction_requests", label: "Direction Requests",     type: "number",   api: true },
    { key: "review_count",       label: "Total Reviews",          type: "number",   manual: true },
    { key: "avg_rating",         label: "Average Rating",         type: "decimal",  manual: true },
    { key: "new_reviews",        label: "New Reviews This Month", type: "number",   manual: true },
    { key: "photo_count",        label: "Photos on Profile",      type: "number",   manual: true },
    { key: "posts_published",    label: "Posts Published",        type: "number",   manual: true },
    { key: "work_completed",     label: "Work Completed",         type: "textarea", manual: true },
    { key: "wins",               label: "Wins",                   type: "textarea", optional: true, hint: "One per line" },
    { key: "losses",             label: "Losses / Watch Items",   type: "textarea", optional: true, hint: "One per line" },
    { key: "next_month",         label: "What's Coming Next Month", type: "textarea", hint: "One per line" },
  ],
  google_ads: [
    { key: "conversions",      label: "Total Conversions",        type: "number" },
    { key: "impressions",      label: "Impressions",              type: "number" },
    { key: "clicks",           label: "Total Clicks",             type: "number" },
    { key: "cost_per_lead",    label: "Cost Per Lead ($)",        type: "decimal" },
    { key: "total_spend",      label: "Total Spend ($)",          type: "decimal" },
    { key: "budget",           label: "Monthly Budget ($)",       type: "decimal" },
    { key: "ctr",              label: "CTR (%)",                  type: "decimal" },
    { key: "cpc",              label: "Avg CPC ($)",              type: "decimal" },
    { key: "impression_share", label: "Impression Share (%)",     type: "decimal" },
    { key: "quality_score",    label: "Avg Quality Score",        type: "decimal", hint: "1–10 scale, avg across active campaigns" },
    { key: "top_campaign",     label: "Top Performing Campaign",  type: "text" },
    { key: "work_completed",   label: "Work Completed",           type: "textarea" },
    { key: "wins",             label: "Wins",                     type: "textarea", optional: true, hint: "One per line" },
    { key: "losses",           label: "Losses / Watch Items",     type: "textarea", optional: true, hint: "One per line" },
    { key: "next_month",       label: "What's Coming Next Month", type: "textarea", hint: "One per line" },
  ],
  meta_ads: [
    { key: "conversions",          label: "Total Conversions",        type: "number" },
    { key: "impressions",          label: "Impressions",              type: "number" },
    { key: "cost_per_lead",        label: "Cost Per Lead ($)",        type: "decimal" },
    { key: "total_spend",          label: "Total Spend ($)",          type: "decimal" },
    { key: "reach",                label: "Reach",                    type: "number" },
    { key: "cpc",                  label: "Avg CPC ($)",              type: "decimal" },
    { key: "ctr",                  label: "CTR (%)",                  type: "decimal" },
    { key: "frequency",            label: "Frequency",                type: "decimal" },
    { key: "engagement_rate",      label: "Engagement Rate (%)",      type: "decimal" },
    { key: "video_view_rate",      label: "Video View Rate (%)",      type: "decimal", hint: "% of video ads watched to completion" },
    { key: "lead_form_completion", label: "Lead Form Completion (%)", type: "decimal" },
    { key: "top_ad",               label: "Top Performing Ad",        type: "text" },
    { key: "work_completed",       label: "Work Completed",           type: "textarea" },
    { key: "wins",                 label: "Wins",                     type: "textarea", optional: true, hint: "One per line" },
    { key: "losses",               label: "Losses / Watch Items",     type: "textarea", optional: true, hint: "One per line" },
    { key: "next_month",           label: "What's Coming Next Month", type: "textarea", hint: "One per line" },
  ],
  social: [
    { key: "fb_followers",      label: "FB Followers",            type: "number",   api: true },
    { key: "fb_reach",          label: "FB Reach",                type: "number",   api: true },
    { key: "fb_engagement",     label: "FB Engagement",           type: "number",   api: true },
    { key: "fb_new_followers",  label: "FB New Followers",        type: "number",   api: true },
    { key: "fb_page_views",     label: "FB Page Views",           type: "number",   api: true },
    { key: "ig_followers",      label: "IG Followers",            type: "number",   api: true },
    { key: "ig_reach",          label: "IG Reach",                type: "number",   api: true },
    { key: "ig_impressions",    label: "IG Impressions",          type: "number",   api: true },
    { key: "ig_profile_views",  label: "IG Profile Views",        type: "number",   api: true },
    { key: "ig_new_followers",  label: "IG New Followers",        type: "number",   api: true },
    { key: "yt_followers",      label: "YT Subscribers",          type: "number",   api: true },
    { key: "yt_month_views",    label: "YT Views (Month)",        type: "number",   api: true },
    { key: "yt_month_videos",   label: "YT Videos Published",     type: "number",   api: true },
    { key: "yt_month_likes",    label: "YT Likes (Month)",        type: "number",   api: true },
    { key: "yt_month_comments", label: "YT Comments (Month)",     type: "number",   api: true },
    { key: "yt_total_views",    label: "YT Total Views",          type: "number",   api: true },
    { key: "tiktok_followers",  label: "TikTok Followers",        type: "number",   manual: true },
    { key: "tiktok_reach",      label: "TikTok Reach",            type: "number",   manual: true },
    { key: "tiktok_views",      label: "TikTok Video Views",      type: "number",   manual: true },
    { key: "tiktok_likes",      label: "TikTok Likes",            type: "number",   manual: true },
    { key: "posts_published",   label: "Posts Published",         type: "number",   manual: true },
    { key: "videos_published",  label: "Videos Published",        type: "number",   api: true },
    { key: "web_clicks",        label: "Social → Website Clicks", type: "number",   api: true, hint: "From GA4 Social channel sessions" },
    { key: "top_video",         label: "Top Performing Video",    type: "text",     manual: true },
    { key: "top_video_views",   label: "Top Video Views (Month)", type: "number",   api: true },
    { key: "work_completed",    label: "Work Completed",          type: "textarea", manual: true },
    { key: "wins",              label: "Wins",                    type: "textarea", optional: true, hint: "One per line" },
    { key: "losses",            label: "Losses / Watch Items",    type: "textarea", optional: true, hint: "One per line" },
    { key: "next_month",        label: "What's Coming Next Month",type: "textarea", hint: "One per line" },
  ],
  email: [
    { key: "campaigns_sent",   label: "Campaigns Sent",          type: "number" },
    { key: "total_recipients", label: "Total Recipients",        type: "number" },
    { key: "avg_open_rate",    label: "Avg Open Rate (%)",       type: "decimal", hint: "Avg across all campaigns sent this month" },
    { key: "avg_click_rate",   label: "Avg Click Rate (%)",      type: "decimal", hint: "Avg across all campaigns sent this month" },
    { key: "site_visits",      label: "Site Visits from Email",  type: "number" },
    { key: "conversions",      label: "Conversions from Email",  type: "number" },
    { key: "unsubscribe_rate", label: "Unsubscribe Rate (%)",    type: "decimal", hint: "Avg unsubscribe rate across campaigns" },
    { key: "list_size",        label: "Total List Size",         type: "number" },
    { key: "work_completed",   label: "Work Completed",          type: "textarea" },
    { key: "wins",             label: "Wins",                    type: "textarea", optional: true, hint: "One per line" },
    { key: "losses",           label: "Losses / Watch Items",    type: "textarea", optional: true, hint: "One per line" },
    { key: "next_month",       label: "What's Coming Next Month", type: "textarea", hint: "One per line" },
  ],
  creative: [
    { key: "total_assets",    label: "Total Assets Delivered",    type: "number" },
    { key: "videos",          label: "Videos",                    type: "number" },
    { key: "graphics",        label: "Graphics / Statics",        type: "number" },
    { key: "banners",         label: "Banners",                   type: "number" },
    { key: "print",           label: "Print Pieces",              type: "number" },
    { key: "ad_creative",     label: "Ad Creative Sets",          type: "number", hint: "Display, search, and social ad graphics" },
    { key: "email_headers",   label: "Email Headers / Templates", type: "number" },
    { key: "work_completed",  label: "Work Completed",            type: "textarea" },
    { key: "next_month",      label: "What's Coming Next Month",  type: "textarea", hint: "One per line" },
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
  { key: "notes",          label: "Notes",             type: "textarea", optional: true },
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
  { key: "notes",        label: "Notes",                    type: "textarea", optional: true },
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

/* ─── SERVICE TOGGLE ─── */
function ServiceToggle({ clientId, deptId, onToggle }) {
  const [enabled, setEnabled] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("client_services")
        .select("enabled").eq("client_id", clientId).eq("department", deptId).single();
      setEnabled(data?.enabled !== false);
      setLoading(false);
    };
    load();
  }, [clientId, deptId]);

  const handleToggle = async () => {
    const newVal = !enabled;
    setEnabled(newVal);
    await supabase.from("client_services").upsert(
      { client_id: clientId, department: deptId, enabled: newVal, updated_at: new Date().toISOString() },
      { onConflict: "client_id,department" }
    );
    if (onToggle) onToggle(deptId, newVal);
  };

  if (loading) return null;

  return (
    <button onClick={handleToggle} title={enabled ? "Disable this service" : "Enable this service"}
      style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", fontSize: 13, opacity: 0.7 }}>
      {enabled ? "✅" : "⭕"}
    </button>
  );
}

/* ─── LINKS FIELD ─── */
function LinksField({ value, onChange, disabled }) {
  const links = Array.isArray(value) ? value : [];
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const addLink = () => {
    if (!newUrl) return;
    const updated = [...links, { url: newUrl, label: newLabel || newUrl }];
    onChange(updated);
    setNewUrl(""); setNewLabel("");
  };

  const removeLink = (i) => onChange(links.filter((_, idx) => idx !== i));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {links.map((link, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: C.cyanL, borderRadius: 6, padding: "6px 10px", border: `1px solid ${C.cyan}33` }}>
          <span style={{ fontSize: 12, color: C.cyanD, fontFamily: F, flex: 1 }}>
            <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: C.cyanD, textDecoration: "none", fontWeight: 600 }}>{link.label}</a>
          </span>
          {!disabled && <button onClick={() => removeLink(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.tl, fontSize: 14, padding: 0 }}>✕</button>}
        </div>
      ))}
      {!disabled && (
        <div style={{ display: "flex", gap: 6 }}>
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Label (optional)" style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.bd}`, fontSize: 12, fontFamily: F, outline: "none" }} />
          <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." style={{ flex: 2, padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.bd}`, fontSize: 12, fontFamily: F, outline: "none" }} onKeyDown={e => e.key === "Enter" && addLink()} />
          <button onClick={addLink} style={{ background: C.cyan, color: C.navy, border: "none", borderRadius: 6, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F }}>Add</button>
        </div>
      )}
    </div>
  );
}

/* ─── TRACKED KEYWORDS FIELD ─── */
function TrackedKeywordsField({ value, onChange, disabled, scData }) {
  const rows = Array.isArray(value) ? value : [];
  const [newKw, setNewKw] = useState("");
  const [newTarget, setNewTarget] = useState("");

  const scQueries = scData?._sc_queries || [];
  const queryMap = {};
  scQueries.forEach(q => { if (q.query) queryMap[q.query.toLowerCase()] = q; });

  const addRow = () => {
    if (!newKw.trim()) return;
    const updated = [...rows, { keyword: newKw.trim(), target_position: newTarget ? Number(newTarget) : null }];
    onChange(updated);
    setNewKw(""); setNewTarget("");
  };

  const removeRow = (i) => onChange(rows.filter((_, idx) => idx !== i));

  const updateRow = (i, field, val) => {
    const updated = rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
    onChange(updated);
  };

  const getStatus = (current, target) => {
    if (current == null) return null;
    if (target == null) return current <= 10 ? "top10" : "tracking";
    if (current <= target) return "on_target";
    if (current <= target + 3) return "close";
    return "off";
  };

  const STATUS_STYLE = {
    on_target: { bg: "#f0fdf4", color: "#166534", label: "✓ On Target" },
    close:     { bg: "#fffbeb", color: "#92400e", label: "~ Close" },
    off:       { bg: "#fef2f2", color: "#991b1b", label: "↓ Off" },
    top10:     { bg: "#e6f9fc", color: "#00a5bf", label: "Top 10" },
    tracking:  { bg: "#f8fafc", color: "#6b7280", label: "Tracking" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {rows.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 70px 80px 80px", gap: 6, padding: "6px 8px", background: "#f8fafc", borderRadius: "8px 8px 0 0", border: `1px solid ${C.bd}`, borderBottom: "none" }}>
          {["Keyword", "Target", "Position", "Clicks", "Impr.", "CTR", "Status"].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: F }}>{h}</div>
          ))}
        </div>
      )}
      {rows.map((row, i) => {
        const sc = queryMap[row.keyword?.toLowerCase()];
        const current = sc?.position != null ? Math.round(sc.position) : null;
        const status = getStatus(current, row.target_position);
        const st = status ? STATUS_STYLE[status] : null;
        return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 70px 80px 80px", gap: 6, padding: "8px 8px", border: `1px solid ${C.bd}`, borderTop: i === 0 && rows.length > 0 ? `1px solid ${C.bd}` : "none", background: i % 2 === 0 ? C.white : "#fafafa", borderRadius: i === rows.length - 1 && disabled ? "0 0 8px 8px" : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {!disabled && <button onClick={() => removeRow(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.tl, fontSize: 12, padding: 0, lineHeight: 1, flexShrink: 0 }}>✕</button>}
              <span style={{ fontSize: 12, fontFamily: F, color: C.t, fontWeight: 500 }}>{row.keyword}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              {disabled ? (
                <span style={{ fontSize: 12, fontFamily: F, color: C.tl }}>{row.target_position ?? "—"}</span>
              ) : (
                <input type="number" value={row.target_position ?? ""} onChange={e => updateRow(i, "target_position", e.target.value ? Number(e.target.value) : null)} placeholder="—" min="1" max="100"
                  style={{ width: "100%", padding: "4px 6px", borderRadius: 5, border: `1px solid ${C.bd}`, fontSize: 12, fontFamily: F, outline: "none" }} />
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: F, color: current != null ? C.navy : C.tl }}>{current != null ? `#${current}` : "—"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontFamily: F, color: C.t }}>{sc?.clicks != null ? sc.clicks.toLocaleString() : "—"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontFamily: F, color: C.t }}>{sc?.impressions != null ? (sc.impressions >= 1000 ? (sc.impressions / 1000).toFixed(1) + "k" : sc.impressions) : "—"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontFamily: F, color: C.t }}>{sc?.ctr != null ? (sc.ctr * 100).toFixed(1) + "%" : "—"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              {st ? (
                <span style={{ background: st.bg, color: st.color, borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 700, fontFamily: F, whiteSpace: "nowrap" }}>{st.label}</span>
              ) : <span style={{ fontSize: 11, color: C.tl, fontFamily: F }}>—</span>}
            </div>
          </div>
        );
      })}
      {!disabled && (
        <div style={{ display: "flex", gap: 6, marginTop: rows.length > 0 ? 10 : 0 }}>
          <input value={newKw} onChange={e => setNewKw(e.target.value)} onKeyDown={e => e.key === "Enter" && addRow()} placeholder='e.g. "ford dealer twin falls"'
            style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.bd}`, fontSize: 12, fontFamily: F, outline: "none" }} />
          <input type="number" value={newTarget} onChange={e => setNewTarget(e.target.value)} onKeyDown={e => e.key === "Enter" && addRow()} placeholder="Target #" min="1" max="100"
            style={{ width: 90, padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.bd}`, fontSize: 12, fontFamily: F, outline: "none" }} />
          <button onClick={addRow} style={{ background: C.cyan, color: C.navy, border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F }}>Add</button>
        </div>
      )}
      {scQueries.length === 0 && rows.length > 0 && (
        <div style={{ fontSize: 11, color: C.tl, fontFamily: F, marginTop: 8 }}>
          ⓘ Pull Search Console data to see live positions, clicks & CTR per keyword.
        </div>
      )}
      {scQueries.length > 0 && (
        <div style={{ fontSize: 11, color: "#166534", fontFamily: F, marginTop: 8 }}>
          ✓ Showing live data from Search Console · {scQueries.length} queries tracked
        </div>
      )}
    </div>
  );
}

/* ─── UPLOAD SECTION ─── */
function UploadSection({ clientId, deptId, month }) {
  const [uploads, setUploads] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [addingLink, setAddingLink] = useState(false);
  const fileRef = useRef();

  const load = useCallback(async () => {
    const { data } = await supabase.from("report_uploads")
      .select("*").eq("client_id", clientId).eq("department", deptId).eq("month", month)
      .order("uploaded_at", { ascending: false });
    setUploads(data || []);
  }, [clientId, deptId, month]);

  useEffect(() => { load(); }, [load]);

  const handleFileUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${clientId}/${deptId}/${month}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("report-uploads").upload(path, file);
      if (uploadErr) { console.error(uploadErr); continue; }
      const { data: { publicUrl } } = supabase.storage.from("report-uploads").getPublicUrl(path);
      await supabase.from("report_uploads").insert({
        client_id: clientId, department: deptId, month,
        file_name: file.name, file_url: publicUrl,
        file_type: file.type || ext, label: file.name,
        uploaded_by: user.id,
      });
    }
    setUploading(false);
    await load();
  };

  const handleLinkSave = async () => {
    if (!linkUrl) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("report_uploads").insert({
      client_id: clientId, department: deptId, month,
      file_name: linkLabel || linkUrl, file_url: linkUrl,
      file_type: "link", label: linkLabel || linkUrl,
      uploaded_by: user.id,
    });
    setLinkUrl(""); setLinkLabel(""); setAddingLink(false);
    await load();
  };

  const handleDelete = async (id, fileUrl, fileType) => {
    if (fileType !== "link") {
      const path = fileUrl.split("/report-uploads/")[1];
      if (path) await supabase.storage.from("report-uploads").remove([path]);
    }
    await supabase.from("report_uploads").delete().eq("id", id);
    await load();
  };

  const getFileIcon = (type) => {
    if (!type) return "📄";
    if (type === "link") return "🔗";
    if (type.includes("image")) return "🖼️";
    if (type.includes("video")) return "🎬";
    if (type.includes("pdf")) return "📕";
    if (type.includes("word") || type === "doc" || type === "docx") return "📝";
    return "📄";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div style={{ marginTop: 28, borderTop: `1px solid ${C.bd}`, paddingTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: F }}>📎 Content & Uploads</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setAddingLink(v => !v)} style={{ background: C.pL, color: C.p, border: `1px solid ${C.p}33`, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>+ Add Link</button>
          <button onClick={() => fileRef.current?.click()} style={{ background: C.cyanL, color: C.cyanD, border: `1px solid ${C.cyan}33`, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>⬆ Upload File</button>
        </div>
      </div>
      {addingLink && (
        <div style={{ background: C.pL, border: `1px solid ${C.p}33`, borderRadius: 8, padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input value={linkLabel} onChange={e => setLinkLabel(e.target.value)} placeholder="Label (e.g. February Email Campaign)" style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.bd}`, fontSize: 12, fontFamily: F, outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.bd}`, fontSize: 12, fontFamily: F, outline: "none" }} onKeyDown={e => e.key === "Enter" && handleLinkSave()} />
            <button onClick={handleLinkSave} style={{ background: C.p, color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F }}>Save</button>
            <button onClick={() => setAddingLink(false)} style={{ background: "none", border: `1px solid ${C.bd}`, borderRadius: 6, padding: "8px 12px", fontSize: 12, cursor: "pointer", fontFamily: F, color: C.tl }}>Cancel</button>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" style={{ display: "none" }} onChange={e => handleFileUpload(e.target.files)} />
      <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
        style={{ border: `2px dashed ${C.bd}`, borderRadius: 10, padding: "20px", textAlign: "center", cursor: "pointer", background: "#fafafa", marginBottom: uploads.length ? 14 : 0 }}
        onClick={() => fileRef.current?.click()}>
        {uploading ? (
          <div style={{ fontSize: 13, color: C.tl, fontFamily: F }}>⬆ Uploading...</div>
        ) : (
          <div style={{ fontSize: 12, color: C.tl, fontFamily: F }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📁</div>
            Drag & drop files here, or click to browse<br />
            <span style={{ fontSize: 11, color: C.bd }}>Images, PDFs, Videos, Word docs · Auto-saves on upload</span>
          </div>
        )}
      </div>
      {uploads.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {uploads.map(u => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, background: C.white, border: `1px solid ${C.bd}`, borderRadius: 8, padding: "10px 14px" }}>
              <span style={{ fontSize: 18 }}>{getFileIcon(u.file_type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={u.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: C.t, fontFamily: F, textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {u.label || u.file_name}
                </a>
                <div style={{ fontSize: 11, color: C.tl, fontFamily: F }}>{new Date(u.uploaded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
              </div>
              <button onClick={() => handleDelete(u.id, u.file_url, u.file_type)} style={{ background: "none", border: "none", cursor: "pointer", color: C.tl, fontSize: 16, padding: 4 }} title="Delete">🗑</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── BACKFILL MODAL ─── */
function BackfillModal({ clients, onClose }) {
  const backfillMonths = getBackfillMonths();
  const apiDepts = Object.entries(LIVE_APIS);
  const total = clients.length * backfillMonths.length * apiDepts.length;

  const [mode, setMode] = useState("missing");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentLabel, setCurrentLabel] = useState("");
  const [log, setLog] = useState([]);
  const [counts, setCounts] = useState({ success: 0, skipped: 0, error: 0 });

  const addLog = (msg, type = "info") => setLog(prev => [...prev.slice(-49), { msg, type, ts: new Date().toLocaleTimeString() }]);

  const DEPT_MAP = {
    seo: "seo", ga4: "ga4", google_ads: "google_ads",
    callrail: "callrail", meta_ads: "meta_ads", social: "social"
  };

  const handleRun = async () => {
    setRunning(true); setLog([]); setProgress(0); setCounts({ success: 0, skipped: 0, error: 0 });
    let completed = 0, success = 0, skipped = 0, error = 0;

    let existingSet = new Set();
    if (mode === "missing") {
      const allClientIds = clients.map(c => c.id);
      const { data: existingRows } = await supabase
        .from("report_data")
        .select("client_id, month, department")
        .in("client_id", allClientIds);
      existingSet = new Set(
        (existingRows || []).map(r => `${r.client_id}_${r.month}_${r.department}`)
      );
    }

    for (const client of clients) {
      for (const { year, month } of backfillMonths) {
        const monthStr = `${year}-${String(month).padStart(2, "0")}-01`;
        for (const [deptId, api] of apiDepts) {
          const label = `${client.name} · ${MONTHS[month - 1]} ${year} · ${api.label}`;
          setCurrentLabel(label);
          const deptKey = DEPT_MAP[deptId] || deptId;
          const key = `${client.id}_${monthStr}_${deptKey}`;

          if (mode === "missing" && existingSet.has(key)) {
            skipped++; addLog(`— ${label} · already exists`, "skip");
            completed++; setProgress(completed); setCounts({ success, skipped, error });
            continue;
          }

          try {
            const res = await fetch(`${api.endpoint}?client_id=${client.id}&year=${year}&month=${month}&save=true`);
            const json = await res.json();
            if (json.success && json.saved) {
              success++; addLog(`✓ ${label}`, "success");
              existingSet.add(key);
            } else if (json.error?.includes("No ") && json.error?.includes("integration")) {
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

  const MODES = [
    { id: "missing", icon: "⚡", label: "Fill Missing Only", desc: "Skips months that already have data. Fast — only pulls what's empty.", color: C.g, bg: C.gL, border: "#bbf7d0" },
    { id: "full",    icon: "🔄", label: "Full Refresh",      desc: "Re-pulls every client, every month, every API. Use to fix bad data or after fixing an integration.", color: C.o, bg: C.oL, border: `${C.o}44` },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.bd}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.t, fontFamily: F }}>Historical Data Backfill</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: C.tl, fontFamily: F }}>
              {clients.length} clients × {backfillMonths.length} months × {apiDepts.length} APIs = <strong>{total} max requests</strong> · Jan 2024 → last month
            </p>
          </div>
          {!running && <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.tl, padding: 4 }}>✕</button>}
        </div>
        <div style={{ padding: 24, flex: 1, overflow: "auto" }}>
          {!running && !done && (
            <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                {MODES.map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)}
                    style={{ flex: 1, background: mode === m.id ? m.bg : C.white, border: `2px solid ${mode === m.id ? m.color : C.bd}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{m.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: mode === m.id ? m.color : C.t, fontFamily: F, marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: C.tl, fontFamily: F, lineHeight: 1.5 }}>{m.desc}</div>
                  </button>
                ))}
              </div>
              <div style={{ background: mode === "full" ? C.oL : C.gL, border: `1px solid ${mode === "full" ? `${C.o}44` : "#bbf7d0"}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: mode === "full" ? C.o : "#166534", marginBottom: 6, fontFamily: F }}>
                  {mode === "full" ? "⚠ Full Refresh — heads up" : "✓ Fill Missing — safe to run anytime"}
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: C.t, fontFamily: F, lineHeight: 1.8 }}>
                  {mode === "missing" ? (
                    <>
                      <li>Skips any month that already has data — no overwrites</li>
                      <li>Only hits the API for genuinely empty months</li>
                      <li>Much faster than a full refresh</li>
                      <li>Keep this browser tab open until complete</li>
                    </>
                  ) : (
                    <>
                      <li>Re-pulls <strong>all</strong> {total} combinations regardless of existing data</li>
                      <li>Will overwrite previously pulled API data</li>
                      <li>Manually entered fields are <strong>protected</strong> — they will not be overwritten</li>
                      <li>Estimated time: <strong>~{Math.round(total * 0.2 / 60)} minutes</strong> — keep this tab open</li>
                    </>
                  )}
                </ul>
              </div>
              <div style={{ background: "#f8fafc", border: `1px solid ${C.bd}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, fontFamily: F }}>APIs included</div>
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
                <span style={{ fontSize: 13, fontWeight: 600, color: C.t, fontFamily: F }}>
                  {done ? "Complete" : `Running ${mode === "missing" ? "Fill Missing" : "Full Refresh"}...`}
                </span>
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
              <button onClick={handleRun} style={{ background: mode === "full" ? C.o : C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
                {mode === "missing" ? "⚡ Fill Missing Data" : "🔄 Run Full Refresh"}
              </button>
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

/* ─── TRAFFIC CHANNEL PREVIEW ─── */
function TrafficChannelPreview({ data }) {
  const organic = Number(data.organic_sessions) || 0;
  const direct  = Number(data.direct_sessions)  || 0;
  const paid    = Number(data.paid_sessions)    || 0;
  const social  = Number(data.social_sessions)  || 0;
  const total   = organic + direct + paid + social;

  if (total === 0) return null;

  const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0;
  const channels = [
    { label: "Organic", value: organic, color: "#059669", pct: pct(organic) },
    { label: "Direct",  value: direct,  color: "#6366f1", pct: pct(direct)  },
    { label: "Paid",    value: paid,    color: "#f59e0b", pct: pct(paid)    },
    { label: "Social",  value: social,  color: "#c026d3", pct: pct(social)  },
  ];

  return (
    <div style={{
      gridColumn: "1 / -1",
      background: "#f8fafc", border: `1px solid ${C.bd}`,
      borderRadius: 10, padding: "14px 18px", marginTop: 4,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, fontFamily: F }}>
        📊 Traffic Channel Breakdown — Total: {total.toLocaleString()} sessions
      </div>
      <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 10, marginBottom: 12 }}>
        {channels.filter(ch => ch.pct > 0).map(ch => (
          <div key={ch.label} style={{ width: `${ch.pct}%`, background: ch.color, transition: "width 0.3s" }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {channels.map(ch => (
          <div key={ch.label} style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: ch.color, flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontFamily: F }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.t }}>{ch.pct}%</span>
              <span style={{ fontSize: 11, color: C.tl, marginLeft: 5 }}>{ch.label}</span>
              <div style={{ fontSize: 11, color: C.tl }}>{ch.value.toLocaleString()} sessions</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── FIELD INPUT ─── */
const FieldInput = ({ field, value, onChange, disabled, scData }) => {
  if (field.type === "links")     return <LinksField value={value} onChange={v => onChange(field.key, v)} disabled={disabled} />;
  if (field.type === "keywords")  return <TrackedKeywordsField value={value} onChange={v => onChange(field.key, v)} disabled={disabled} scData={scData} />;
  if (field.type === "rows_work") return <WorkRowsBuilder value={value} onChange={v => onChange(field.key, v)} disabled={disabled} />;
  if (field.type === "bullets")   return <BulletBuilder value={value} onChange={v => onChange(field.key, v)} disabled={disabled} placeholder={`Add ${field.label.toLowerCase()}...`} />;
  if (field.type === "rows")      return <RowBuilder value={value} onChange={v => onChange(field.key, v)} disabled={disabled} schema={field.schema} addLabel={`Add Row`} />;
  if (field.type === "clickup")   return <ClickUpField value={value} onChange={v => onChange(field.key, v)} disabled={disabled} />;
  const base = { width: "100%", padding: "10px 12px", borderRadius: 7, border: `1px solid ${field.api && value ? C.cyan + "88" : C.bd}`, fontSize: 13, fontFamily: F, outline: "none", boxSizing: "border-box", background: disabled ? "#f8fafc" : C.white, color: disabled ? C.tl : C.t, cursor: disabled ? "not-allowed" : "text" };
  if (field.type === "textarea") return (
    <textarea value={value || ""} onChange={e => onChange(field.key, e.target.value)} disabled={disabled} rows={3} placeholder={field.hint || `Enter ${field.label.toLowerCase()}...`} style={{ ...base, resize: "vertical", lineHeight: 1.5 }} />
  );
  return <input type={field.type === "number" || field.type === "decimal" ? "number" : "text"} step={field.type === "decimal" ? "0.01" : "1"} value={value ?? ""} onChange={e => onChange(field.key, e.target.value)} disabled={disabled} placeholder={field.hint || "0"} style={base} />;
};

/* ─── DEPT FORM ─── */
function DeptForm({ dept, clientId, clientName, month, monthIdx, year, userRole, userDept, onSaved, allClients, onApiPulled, serviceEnabled }) {
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

  // ALL hooks must come before any conditional return (Rules of Hooks)
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

  // Service disabled check — AFTER all hooks so React Rules of Hooks are satisfied
  if (serviceEnabled === false) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px", color: C.tl, fontFamily: F }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⭕</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.t, marginBottom: 8 }}>This service is not active for this client</div>
        <div style={{ fontSize: 13, color: C.tl }}>Toggle the ⭕ button next to the department name in the sidebar to enable it.</div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const ts = { last_updated_by: user.id, last_updated_at: new Date().toISOString() };

    // ── Build _manual_overrides ──
    const existingOverrides = new Set(data._manual_overrides || []);
    manualFields.forEach(f => {
      const v = data[f.key];
      let hasVal = false;
      if (f.type === "rows" || f.type === "rows_work") hasVal = Array.isArray(v) && v.length > 0;
      else if (f.type === "bullets") hasVal = Array.isArray(v) ? v.length > 0 : (typeof v === "string" && v.trim().length > 0);
      else if (f.type === "clickup" || f.type === "links" || f.type === "keywords") hasVal = Array.isArray(v) ? v.length > 0 : (typeof v === "string" && v.trim().length > 0);
      else hasVal = v !== undefined && v !== null && String(v).trim() !== "";
      if (hasVal) existingOverrides.add(f.key);
      else existingOverrides.delete(f.key);
    });

    const savePayload = {
      ...data,
      _manual_overrides: Array.from(existingOverrides),
    };

    await supabase.from("report_data").upsert(
      { client_id: clientId, month, department: dept.id, data: savePayload, ...ts },
      { onConflict: "client_id,month,department" }
    );

    setData(savePayload);

    if (isJuneauSource && allClients) {
      const sharedPayload = Object.fromEntries(SHARED_KEYS.map(k => [k, savePayload[k] ?? null]));
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

  const FULL_WIDTH_TYPES = new Set(["textarea","links","keywords","rows","rows_work","bullets","clickup"]);
  const SECTION_STARTS = {
    work_completed:   { label: "Work Summary",               icon: "📋" },
    wins:             { label: "Highlights & Watch Items",   icon: "✨" },
    competitors:      { label: "Competitive Intelligence",   icon: "🏁" },
    pages_built:      { label: "Content Work",               icon: "📄" },
    gbp_posts:        { label: "GBP Activity",               icon: "📍" },
    reviews:          { label: "Recent Reviews",             icon: "⭐" },
    top_content:      { label: "Top Performing Content",     icon: "🏆" },
    deliverables:     { label: "Deliverables",               icon: "🎨" },
    tracked_keywords: { label: "Keyword Tracking",           icon: "🔑" },
    page_links:       { label: "Page Links",                 icon: "🔗" },
    clickup_url:      { label: "Internal",                   icon: "🟣" },
  };

  const hasFieldContent = (field) => {
    const v = data[field.key];
    if (field.type === "rows" || field.type === "rows_work") return Array.isArray(v) && v.length > 0;
    if (field.type === "bullets") {
      if (Array.isArray(v)) return v.length > 0;
      return typeof v === "string" && v.trim().length > 0;
    }
    if (field.type === "clickup") return typeof v === "string" && v.trim().length > 0;
    if (field.type === "keywords" || field.type === "links") return Array.isArray(v) && v.length > 0;
    return v !== null && v !== undefined && String(v).trim() !== "";
  };

  const filledCount = fields.filter(f => !f.optional && hasFieldContent(f)).length;
  const requiredTotal = fields.filter(f => !f.optional).length;
  const pulledAt = data._pulled_at ? new Date(data._pulled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : null;

  const manualOverrides = new Set(data._manual_overrides || []);

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
      {manualOverrides.size > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 12, color: "#92400e", fontFamily: F }}>
          🔒 {manualOverrides.size} field{manualOverrides.size !== 1 ? "s are" : " is"} manually locked — API pulls will not overwrite them. Clear a field and save to unlock it.
        </div>
      )}
      {isJuneauSource && <div style={{ background: C.gL, border: `1px solid ${C.g}44`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#166534", fontFamily: F }}>📡 Saving here syncs Total, Website, Facebook & Phone leads to all Juneau stores.</div>}
      {isJuneauChild && <div style={{ background: C.cyanL, border: `1px solid ${C.cyan}44`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: C.cyanD, fontFamily: F }}>🔗 Total, Website, Facebook & Phone synced from Juneau Auto Mall. Enter {oemLabel} leads here.</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: C.tl, fontFamily: F }}>{filledCount} of {requiredTotal} required fields filled</div>
          <CompletionBar filled={filledCount} total={requiredTotal} />
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
                <FieldInput field={field} value={data[field.key]} onChange={handleChange} disabled={!editable} scData={data} />
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {(apiFields.length > 0 ? manualFields : fields).map(field => {
          const isSharedField = isJuneauChild && SHARED_KEYS.includes(field.key);
          const isFullWidth = FULL_WIDTH_TYPES.has(field.type);
          const isLocked = manualOverrides.has(field.key);
          const sectionStart = SECTION_STARTS[field.key];
          return (
            <React.Fragment key={field.key}>
              {sectionStart && (
                <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10, marginTop: 8, paddingBottom: 10, borderBottom: `2px solid ${C.bl2}` }}>
                  <span style={{ fontSize: 15 }}>{sectionStart.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: F }}>{sectionStart.label}</span>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: isFullWidth ? "1 / -1" : "auto" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.t, fontFamily: F }}>
                  {field.label}
                  {field.optional && <span style={{ color: C.tl, fontWeight: 400, marginLeft: 6, fontSize: 11 }}>optional</span>}
                  {isSharedField && <span style={{ color: C.cyan, fontWeight: 400, marginLeft: 6, fontSize: 11 }}>↔ synced</span>}
                  {isLocked && <span style={{ color: "#92400e", fontWeight: 600, marginLeft: 6, fontSize: 10 }}>🔒 locked</span>}
                  {field.hint && <span style={{ color: C.tl, fontWeight: 400, marginLeft: 4, fontSize: 11 }}>({field.hint})</span>}
                </label>
                <FieldInput field={field} value={data[field.key]} onChange={handleChange} disabled={!editable || isSharedField} scData={data} />
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {dept.id === "seo" && <TrafficChannelPreview data={data} />}

      {UPLOAD_DEPTS.includes(dept.id) && editable && (
        <UploadSection clientId={clientId} deptId={dept.id} month={month} />
      )}

      {dept.id === "social" && (data.fb_followers || data.ig_followers || data.yt_followers) && (
        <div style={{ marginTop: 24, borderTop: `1px solid ${C.bd}`, paddingTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14, fontFamily: F }}>📊 Per-Channel Breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.fb_followers > 0 && (
              <div style={{ background: "#f0f4ff", border: "1px solid #c7d2fe", borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#3730a3", fontFamily: F, marginBottom: 12 }}>📘 Facebook</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                  {[{ label: "Followers", value: data.fb_followers }, { label: "Reach", value: data.fb_reach }, { label: "Engagement", value: data.fb_engagement }, { label: "New Followers", value: data.fb_new_followers }, { label: "Page Views", value: data.fb_page_views }].map(stat => (
                    <div key={stat.label} style={{ background: C.white, border: "1px solid #c7d2fe", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#3730a3", fontFamily: F }}>{stat.value != null ? stat.value.toLocaleString() : "—"}</div>
                      <div style={{ fontSize: 10, color: C.tl, fontFamily: F, marginTop: 2 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.ig_followers > 0 && (
              <div style={{ background: "#fdf2f8", border: "1px solid #f9a8d4", borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#9d174d", fontFamily: F, marginBottom: 12 }}>📸 Instagram</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                  {[{ label: "Followers", value: data.ig_followers }, { label: "Reach", value: data.ig_reach }, { label: "Impressions", value: data.ig_impressions }, { label: "Profile Views", value: data.ig_profile_views }, { label: "New Followers", value: data.ig_new_followers }].map(stat => (
                    <div key={stat.label} style={{ background: C.white, border: "1px solid #f9a8d4", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#9d174d", fontFamily: F }}>{stat.value != null ? stat.value.toLocaleString() : "—"}</div>
                      <div style={{ fontSize: 10, color: C.tl, fontFamily: F, marginTop: 2 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.yt_followers > 0 && (
              <div style={{ background: "#fff7f0", border: "1px solid #fed7aa", borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#9a3412", fontFamily: F, marginBottom: 12 }}>▶️ YouTube</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                  {[{ label: "Subscribers", value: data.yt_followers }, { label: "Month Views", value: data.yt_month_views }, { label: "Month Videos", value: data.yt_month_videos }, { label: "Month Likes", value: data.yt_month_likes }, { label: "Month Comments", value: data.yt_month_comments }, { label: "Total Views", value: data.yt_total_views }].map(stat => (
                    <div key={stat.label} style={{ background: C.white, border: "1px solid #fed7aa", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#9a3412", fontFamily: F }}>{stat.value != null ? stat.value.toLocaleString() : "—"}</div>
                      <div style={{ fontSize: 10, color: C.tl, fontFamily: F, marginTop: 2 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(data.tiktok_followers > 0 || data.tiktok_reach > 0 || data.tiktok_views > 0) && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", fontFamily: F, marginBottom: 12 }}>🎵 TikTok <span style={{ fontSize: 11, fontWeight: 400, color: C.tl, marginLeft: 6 }}>manually entered</span></div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                  {[{ label: "Followers", value: data.tiktok_followers }, { label: "Reach", value: data.tiktok_reach }, { label: "Video Views", value: data.tiktok_views }, { label: "Likes", value: data.tiktok_likes }].map(stat => (
                    <div key={stat.label} style={{ background: C.white, border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#166534", fontFamily: F }}>{stat.value ? stat.value.toLocaleString() : "—"}</div>
                      <div style={{ fontSize: 10, color: C.tl, fontFamily: F, marginTop: 2 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {dept.id === "gbp" && Array.isArray(data.locations) && data.locations.length > 1 && (
        <div style={{ marginTop: 24, borderTop: `1px solid ${C.bd}`, paddingTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14, fontFamily: F }}>📍 Per-Location Breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.locations.map((loc, i) => {
              const m = loc.metrics || {};
              const hasError = !!loc.error;
              return (
                <div key={i} style={{ background: hasError ? C.rL : "#f8fafc", border: `1px solid ${hasError ? "#fecaca" : C.bd}`, borderRadius: 10, padding: "14px 18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: hasError ? C.r : C.t, fontFamily: F, marginBottom: hasError ? 4 : 12 }}>📍 {loc.label}</div>
                  {hasError ? (
                    <div style={{ fontSize: 12, color: C.r, fontFamily: F }}>⚠ {loc.error}</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                      {[{ label: "Website Clicks", value: m.website_clicks }, { label: "Call Clicks", value: m.call_clicks }, { label: "Direction Requests", value: m.direction_requests }, { label: "Total Impressions", value: m.total_impressions }, { label: "Desktop Maps", value: m.impressions_desktop_maps }, { label: "Desktop Search", value: m.impressions_desktop_search }, { label: "Mobile Maps", value: m.impressions_mobile_maps }, { label: "Mobile Search", value: m.impressions_mobile_search }].map(stat => (
                        <div key={stat.label} style={{ background: C.white, border: `1px solid ${C.bd}`, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, fontFamily: F }}>{stat.value != null ? stat.value.toLocaleString() : "—"}</div>
                          <div style={{ fontSize: 10, color: C.tl, fontFamily: F, marginTop: 2 }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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

/* ─── BENCHMARK PANEL ─── */
function BenchmarkPanel({ clientId, clientName, month, year, monthIdx }) {
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const depts = Object.keys(BENCHMARKS);
      const results = {};
      for (const dept of depts) {
        const { data } = await supabase.from("report_data").select("data").eq("client_id", clientId).eq("month", month).eq("department", dept).single();
        results[dept] = data?.data || {};
      }
      setAllData(results);
      setLoading(false);
    }
    load();
  }, [clientId, month]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.tl, fontFamily: F }}>Loading benchmark data…</div>;

  let aboveCount = 0, withinCount = 0, belowCount = 0, unknownCount = 0;
  Object.entries(BENCHMARKS).forEach(([dept, metrics]) => {
    metrics.forEach(m => {
      const val = allData[dept]?.[m.key];
      const status = getBenchmarkStatus(val, m.range, m.lowerBetter);
      if (status === "above") aboveCount++;
      else if (status === "within") withinCount++;
      else if (status === "below") belowCount++;
      else unknownCount++;
    });
  });
  const totalMetrics = aboveCount + withinCount + belowCount + unknownCount;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.t, margin: "0 0 4px", fontFamily: F }}>🎯 Industry Benchmarks</h3>
        <p style={{ fontSize: 12, color: C.tl, margin: 0, fontFamily: F }}>{MONTHS[monthIdx]} {year} — {clientName} — Admin only</p>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {[{ count: aboveCount, label: "Above Benchmark", bg: "#ecfdf5", color: "#10b981", border: "#d1fae5" }, { count: withinCount, label: "Within Range", bg: "#e6f9fc", color: "#00a5bf", border: "#a5f3fc" }, { count: belowCount, label: "Below Benchmark", bg: "#fef2f2", color: "#ef4444", border: "#fecaca" }, { count: unknownCount, label: "No Data Yet", bg: "#f0f2f5", color: "#8892a4", border: "#d0d5dd" }].map((s, i) => (
          <div key={i} style={{ flex: 1, minWidth: 110, textAlign: "center", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "14px 10px" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "Georgia, serif", lineHeight: 1 }}>{s.count}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: s.color, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: F }}>{s.label}</div>
          </div>
        ))}
        <div style={{ flex: 1, minWidth: 110, textAlign: "center", background: C.white, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "14px 10px" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.t, fontFamily: "Georgia, serif", lineHeight: 1 }}>{totalMetrics}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.tl, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: F }}>Total Tracked</div>
        </div>
      </div>
      {Object.entries(BENCHMARKS).map(([dept, metrics]) => {
        const deptData = allData[dept] || {};
        const deptCounts = { above: 0, within: 0, below: 0 };
        metrics.forEach(m => { const s = getBenchmarkStatus(deptData[m.key], m.range, m.lowerBetter); if (s !== "unknown") deptCounts[s]++; });
        return (
          <div key={dept} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.t, fontFamily: F }}>{DEPT_BENCH_LABELS[dept]}</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                {Object.entries(deptCounts).map(([s, n]) => n > 0 && (
                  <span key={s} style={{ padding: "2px 8px", borderRadius: 4, background: BENCH_STATUS[s].bg, color: BENCH_STATUS[s].color, fontSize: 10, fontWeight: 700 }}>
                    {n} {s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.bd}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F }}>
                <thead>
                  <tr style={{ background: "#f8f9fa" }}>
                    {["Metric", "Your Number", "Industry Range", "Status", "Note"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, color: C.tl, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid ${C.bd}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m, mi) => {
                    const raw = deptData[m.key];
                    const status = getBenchmarkStatus(raw, m.range, m.lowerBetter);
                    const cfg = BENCH_STATUS[status];
                    const displayVal = raw !== undefined && raw !== null && raw !== ""
                      ? (m.unit === "$" ? "$" + Number(raw).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                        : Number(raw).toLocaleString(undefined, { maximumFractionDigits: 2 }) + (m.unit === "$" ? "" : m.unit))
                      : "—";
                    const rangeDisplay = m.unit === "$" ? `$${m.range[0]}–$${m.range[1]}` : `${m.range[0]}–${m.range[1]}${m.unit}`;
                    return (
                      <tr key={mi} style={{ borderBottom: mi < metrics.length - 1 ? `1px solid ${C.bl2}` : "none" }}>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: C.t, fontWeight: 600 }}>{m.label}</td>
                        <td style={{ padding: "10px 12px", fontSize: 15, color: status === "unknown" ? C.tl : C.t, fontWeight: 700, fontFamily: "Georgia, serif" }}>{displayVal}</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: C.tl }}>{rangeDisplay}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: 4, background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>{cfg.icon} {cfg.label}</span>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 11, color: C.tl }}>{m.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      <div style={{ background: C.cyanL, border: "1px solid #a5f3fc", borderRadius: 10, padding: "14px 16px", display: "flex", gap: 10, marginTop: 4 }}>
        <span style={{ fontSize: 16 }}>📚</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t, marginBottom: 3, fontFamily: F }}>Benchmark Sources</div>
          <div style={{ fontSize: 11, color: C.tl, lineHeight: 1.6, fontFamily: F }}>Sources: Google/LocalIQ 2025 Automotive Benchmarks, Meta Business Suite Insights, BrightLocal Local Consumer Review Survey, Dealer Inspire Performance Reports, SEMRush Industry Data. Represents single-point US automotive dealership averages. Updated quarterly.</div>
        </div>
      </div>
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
  const [pullingLastMonth, setPullingLastMonth] = useState(false);
  const [pullLastMonthResult, setPullLastMonthResult] = useState("");
  const [serviceStates, setServiceStates] = useState({});

  const month = `${year}-${String(monthIdx + 1).padStart(2, "0")}-01`;

  useEffect(() => {
    const loadServices = async () => {
      const { data } = await supabase.from("client_services").select("department, enabled").eq("client_id", client.id);
      const map = {};
      (data || []).forEach(r => { map[r.department] = r.enabled; });
      setServiceStates(map);
    };
    loadServices();
  }, [client.id]);

  const getServiceEnabled = (deptId) => serviceStates[deptId] !== false;

  useEffect(() => {
    setDeptCompletion({}); setPullAllResult("");
    const loadStatus = async () => {
      const { data } = await supabase.from("monthly_reports").select("status").eq("client_id", client.id).eq("month", month).single();
      setReportStatus(data?.status || "draft");
    };
    loadStatus();
  }, [client.id, month]);

  const refreshCompletion = useCallback(async (deptId) => {
    const fields = (DEPT_FIELDS[deptId] || []).filter(f => !f.optional);
    const { data: row } = await supabase.from("report_data").select("data").eq("client_id", client.id).eq("month", month).eq("department", deptId).single();
    const d = row?.data || {};
    const filled = fields.filter(f => {
      const v = d[f.key];
      if (f.type === "rows" || f.type === "rows_work") return Array.isArray(v) && v.length > 0;
      if (f.type === "bullets") return Array.isArray(v) ? v.length > 0 : (typeof v === "string" && v.trim().length > 0);
      if (f.type === "keywords" || f.type === "links") return Array.isArray(v) && v.length > 0;
      return v !== null && v !== undefined && String(v).trim() !== "";
    }).length;
    setDeptCompletion(prev => ({ ...prev, [deptId]: { filled, total: fields.length } }));
  }, [client.id, month]);

  const handleSaved = useCallback(async (deptId) => {
    await refreshCompletion(deptId);
    const { data: existing } = await supabase.from("monthly_reports").select("status").eq("client_id", client.id).eq("month", month).single();
    if (!existing) { await supabase.from("monthly_reports").insert({ client_id: client.id, month, status: "in_progress" }); setReportStatus("in_progress"); }
    else if (existing.status === "draft") { await supabase.from("monthly_reports").update({ status: "in_progress" }).eq("client_id", client.id).eq("month", month); setReportStatus("in_progress"); }
  }, [client.id, month, refreshCompletion]);

  const handlePullAll = async () => {
    setPullingAll(true); setPullAllResult(""); setPullLastMonthResult("");
    const apiDepts = DEPARTMENTS.filter(d => LIVE_APIS[d.id] && getServiceEnabled(d.id));
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

  const handlePullLastMonth = async () => {
    const now = new Date();
    const lmDate = now.getMonth() === 0
      ? { year: now.getFullYear() - 1, month: 12 }
      : { year: now.getFullYear(), month: now.getMonth() };
    setPullingLastMonth(true); setPullLastMonthResult(""); setPullAllResult("");
    const apiDepts = DEPARTMENTS.filter(d => LIVE_APIS[d.id] && getServiceEnabled(d.id));
    const results = [];
    for (const dept of apiDepts) {
      const api = LIVE_APIS[dept.id];
      try {
        const res = await fetch(`${api.endpoint}?client_id=${client.id}&year=${lmDate.year}&month=${lmDate.month}&save=true`);
        const json = await res.json();
        if (json.success && json.saved) { results.push(`✓ ${dept.label}`); }
        else results.push(`⚠ ${dept.label}: ${json.error || "failed"}`);
      } catch (e) { results.push(`✗ ${dept.label}: ${e.message}`); }
    }
    for (const dept of apiDepts) { await refreshCompletion(dept.id); }
    const lmLabel = `${MONTHS[lmDate.month - 1]} ${lmDate.year}`;
    setPullLastMonthResult(`${lmLabel}: ${results.join(" · ")}`);
    setPullingLastMonth(false);
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
  const enabledApiDepts = DEPARTMENTS.filter(d => LIVE_APIS[d.id] && getServiceEnabled(d.id));

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
          <button onClick={handlePullAll} disabled={pullingAll || pullingLastMonth} style={{ background: C.cyanL, color: C.cyanD, border: `1px solid ${C.cyan}44`, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: (pullingAll || pullingLastMonth) ? "not-allowed" : "pointer", fontFamily: F, opacity: (pullingAll || pullingLastMonth) ? 0.7 : 1 }}>
            {pullingAll ? "⬇ Pulling..." : `⬇ Pull All APIs (${enabledApiDepts.length})`}
          </button>
          <button onClick={handlePullLastMonth} disabled={pullingAll || pullingLastMonth} title="Pull last calendar month's data for all APIs" style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: (pullingAll || pullingLastMonth) ? "not-allowed" : "pointer", fontFamily: F, opacity: (pullingAll || pullingLastMonth) ? 0.7 : 1, whiteSpace: "nowrap" }}>
            {pullingLastMonth ? "⬇ Pulling..." : "⬇ Last Month"}
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
      {pullAllResult && <div style={{ background: C.gL, border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#166834", fontFamily: F }}>{pullAllResult}</div>}
      {pullLastMonthResult && <div style={{ background: C.gL, border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#166834", fontFamily: F }}>📅 {pullLastMonthResult}</div>}
      {publishError && <div style={{ background: C.rL, border: "1px solid #fecaca", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: C.r, fontFamily: F }}>⚠️ {publishError}</div>}
      {reportStatus === "published" && <div style={{ background: C.gL, border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#166834", fontFamily: F }}>✓ This report is live. Clients can see it now.</div>}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ width: 210, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {DEPARTMENTS.map(dept => {
            const comp = deptCompletion[dept.id];
            const isActive = activeDept === dept.id;
            const enabled = getServiceEnabled(dept.id);
            const pct = comp ? Math.round((comp.filled / comp.total) * 100) : null;
            const hasApi = !!LIVE_APIS[dept.id];
            return (
              <div key={dept.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button onClick={() => setActiveDept(dept.id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: isActive ? C.navy : C.white, color: isActive ? "#fff" : enabled ? C.t : C.tl, fontFamily: F, fontSize: 13, fontWeight: isActive ? 700 : 500, boxShadow: isActive ? "none" : C.sh, textAlign: "left", opacity: enabled ? 1 : 0.5 }}>
                  <span>{dept.icon} {dept.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {hasApi && enabled && <span style={{ fontSize: 9, color: C.cyan, fontWeight: 700, background: isActive ? "rgba(0,201,232,0.2)" : "transparent", padding: "1px 4px", borderRadius: 3 }}>API</span>}
                    {!enabled && <span style={{ fontSize: 9, color: C.tl, fontWeight: 700 }}>OFF</span>}
                    {pct !== null && enabled && <span style={{ fontSize: 10, fontWeight: 700, color: pct === 100 ? (isActive ? "#6ee7b7" : C.g) : (isActive ? "#fca5a5" : C.tl) }}>{pct}%</span>}
                  </div>
                </button>
                {userRole === "admin" && (
                  <ServiceToggle clientId={client.id} deptId={dept.id} onToggle={(id, val) => setServiceStates(prev => ({ ...prev, [id]: val }))} />
                )}
              </div>
            );
          })}
          {userRole === "admin" && (
            <button onClick={() => setActiveDept("benchmarks")} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer", marginTop: 8, background: activeDept === "benchmarks" ? "#f59e0b" : C.white, color: activeDept === "benchmarks" ? "#fff" : C.o, fontFamily: F, fontSize: 13, fontWeight: 700, boxShadow: C.sh }}>
              <span>🎯 Benchmarks</span>
              <span style={{ fontSize: 9, background: activeDept === "benchmarks" ? "rgba(255,255,255,0.3)" : C.oL, color: activeDept === "benchmarks" ? "#fff" : C.o, padding: "1px 6px", borderRadius: 3, fontWeight: 700 }}>ADMIN</span>
            </button>
          )}
        </div>
        <div style={{ flex: 1, background: C.white, borderRadius: 12, padding: 24, border: `1px solid ${C.bd}`, boxShadow: C.sh }}>
          {activeDept === "benchmarks" ? (
            <BenchmarkPanel clientId={client.id} clientName={client.name} month={month} year={year} monthIdx={monthIdx} />
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.t, margin: "0 0 4px", fontFamily: F }}>{activeDeptObj?.icon} {activeDeptObj?.label}</h3>
                <p style={{ fontSize: 12, color: C.tl, margin: 0, fontFamily: F }}>{MONTHS[monthIdx]} {year} — {client.name}</p>
              </div>
              <DeptForm
                dept={activeDeptObj}
                clientId={client.id}
                clientName={client.name}
                month={month}
                monthIdx={monthIdx}
                year={year}
                userRole={userRole}
                userDept={userDept}
                onSaved={handleSaved}
                allClients={allClients}
                onApiPulled={refreshCompletion}
                serviceEnabled={getServiceEnabled(activeDept)}
              />
            </>
          )}
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
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: F }}>Pull all API data for all clients from Jan 2024 → last month · ~{totalBackfillRequests} requests · ~{estMinutes} min</div>
          </div>
          <button onClick={onBackfill} style={{ background: C.cyan, color: C.navy, border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F, whiteSpace: "nowrap" }}>⬇ Run Backfill</button>
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
