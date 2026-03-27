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
const F = "'DM Sans', system-ui, sans-serif";

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
    { key: "avg_session_duration",label: "Avg Session Duration",     range: [120, 180],    unit: " sec", lowerBetter: false, note: "2-3 min is healthy" },
  ],
  google_ads: [
    { key: "ctr",              label: "Click-Through Rate",     range: [7, 10],    unit: "%",  lowerBetter: false, note: "Automotive search avg ~8.29%" },
    { key: "cpc",              label: "Cost Per Click",         range: [1.5, 3.0], unit: "$",  lowerBetter: true,  note: "Automotive avg ~$2.41" },
    { key: "cost_per_lead",    label: "Cost Per Lead",          range: [25, 45],   unit: "$",  lowerBetter: true,  note: "Automotive avg $25-45" },
    { key: "impression_share", label: "Impression Share",       range: [60, 80],   unit: "%",  lowerBetter: false, note: "60-80% is healthy coverage" },
    { key: "quality_score",    label: "Avg Quality Score",      range: [6, 8],     unit: "",   lowerBetter: false, note: "Above 6 is industry standard" },
  ],
  meta_ads: [
    { key: "cpc",              label: "Cost Per Click",         range: [0.5, 1.0], unit: "$",  lowerBetter: true,  note: "Automotive avg ~$0.79" },
    { key: "ctr",              label: "CTR",                    range: [1.5, 2.5], unit: "%",  lowerBetter: false, note: "Healthy for auto" },
    { key: "cost_per_lead",    label: "Cost Per Lead",          range: [25, 40],   unit: "$",  lowerBetter: true,  note: "Industry avg $25-40" },
    { key: "engagement_rate",  label: "Engagement Rate",        range: [2, 4],     unit: "%",  lowerBetter: false, note: "Above 4% is excellent" },
    { key: "frequency",        label: "Ad Frequency",           range: [1.5, 3.0], unit: "",   lowerBetter: false, note: "Watch for fatigue above 3.5" },
  ],
  gbp: [
    { key: "avg_rating",       label: "Average Rating",         range: [4.2, 4.5], unit: "★",  lowerBetter: false, note: "Above 4.5 is excellent" },
    { key: "new_reviews",      label: "New Reviews / mo",       range: [3, 6],     unit: "",   lowerBetter: false, note: "6+ is strong" },
    { key: "profile_views",    label: "Profile Views / mo",     range: [2000, 4000],unit: "",  lowerBetter: false, note: "Single-point dealer avg" },
    { key: "website_clicks",   label: "Website Clicks / mo",    range: [200, 400], unit: "",   lowerBetter: false, note: "Above 400 is excellent" },
    { key: "posts_published",  label: "Posts / mo",             range: [4, 8],     unit: "",   lowerBetter: false, note: "Consistent posting schedule" },
  ],
  social: [
    { key: "fb_visits",        label: "FB Monthly Visits",      range: [5000, 20000], unit: "", lowerBetter: false, note: "Varies by audience size" },
    { key: "ig_reach",         label: "IG Monthly Reach",       range: [3000, 15000], unit: "", lowerBetter: false, note: "Organic IG reach" },
    { key: "total_published",  label: "Posts / mo (total)",     range: [15, 25],   unit: "",   lowerBetter: false, note: "Across all platforms" },
    { key: "web_clicks",       label: "Social -> Web Clicks",   range: [100, 250], unit: "",   lowerBetter: false, note: "From GA4 Social channel" },
  ],
  email: [
    { key: "campaigns_sent",   label: "Campaigns / mo",         range: [2, 4],     unit: "",   lowerBetter: false, note: "Right frequency for auto" },
    { key: "audience_size",    label: "Audience Size",          range: [2000, 5000],unit: "",  lowerBetter: false, note: "Single-point dealer avg" },
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
  unknown: { label: "No Data",         bg: "#f0f2f5", color: "#8892a4", icon: "-" },
};

const DEPT_BENCH_LABELS = {
  seo: "🔍 SEO", google_ads: "📢 Google Ads", meta_ads: "📱 Meta Ads",
  gbp: "📍 Google Business Profile", social: "🎬 Organic Social", email: "✉️ Email",
};


const UPLOAD_DEPTS = ["email", "creative", "social", "seo", "meta_ads", "google_ads"];

const DEPT_FIELDS = {
  leads: [
    { key: "total_leads",      label: "Total Leads",         type: "number",   section: "Lead Sources",  hint: "Total leads from all sources combined" },
    { key: "website_leads",    label: "Website Leads",       type: "number",   section: "Lead Sources",  hint: "Leads from dealer website forms" },
    { key: "third_party",      label: "Third Party Leads",   type: "number",   section: "Lead Sources",  hint: "Leads from AutoTrader, Cars.com, CarGurus, etc." },
    { key: "facebook_leads",   label: "Facebook Leads",      type: "number",   section: "Lead Sources",  hint: "Leads from Facebook/Meta lead forms" },
    { key: "total_sold",       label: "Total Sold",          type: "number",   section: "Sales",         hint: "Total units sold from all lead sources" },
    { key: "website_sold",     label: "Website Sold",        type: "number",   section: "Sales",         hint: "Units sold from website leads" },
    { key: "third_party_sold", label: "Third Party Sold",    type: "number",   section: "Sales",         hint: "Units sold from third-party leads" },
    { key: "facebook_sold",    label: "Facebook Sold",       type: "number",   section: "Sales",         hint: "Units sold from Facebook leads" },
    { key: "phone_sold",       label: "Phone Sold",          type: "number",   section: "Sales",         hint: "Units sold from phone call leads" },
    { key: "notes",            label: "Notes",               type: "textarea", section: "Notes",         optional: true },
  ],
  callrail: [
    { key: "total_calls",   label: "Total Calls",        type: "number",   section: "Call Volume",  hint: "CallRail → Total calls for the month" },
    { key: "website_calls", label: "Calls from Website", type: "number",   section: "Call Volume",  hint: "CallRail → Calls attributed to website" },
    { key: "ads_calls",     label: "Calls from Ads",     type: "number",   section: "Call Volume",  hint: "CallRail → Calls attributed to Google/Meta ads" },
    { key: "gbp_calls",     label: "Calls from GBP",     type: "number",   section: "Call Volume",  hint: "CallRail → Calls attributed to Google Business Profile. Auto-syncs to GBP dept on save." },
    { key: "notes",         label: "Notes",              type: "textarea", section: "Notes",        optional: true },
  ],
  seo: [
    { key: "organic_sessions",      label: "Organic Sessions",           type: "number",   section: "Traffic",             hint: "GA4 → Acquisition → Traffic acquisition → Organic Search sessions" },
    { key: "direct_sessions",       label: "Direct Sessions",            type: "number",   section: "Traffic",             hint: "GA4 → Acquisition → Traffic acquisition → Direct sessions" },
    { key: "paid_sessions",         label: "Paid Sessions",              type: "number",   section: "Traffic",             hint: "GA4 → Acquisition → Traffic acquisition → Paid Search sessions" },
    { key: "social_sessions",       label: "Social Sessions",            type: "number",   section: "Traffic",             hint: "GA4 → Acquisition → Traffic acquisition → Organic Social sessions" },
    { key: "site_visits_from_email",label: "Site Visits from Email",     type: "number",   section: "Traffic",             hint: "GA4 → Acquisition → Traffic acquisition → Email sessions" },
    { key: "impressions",           label: "Impressions",                type: "number",   section: "Search Performance",  hint: "Search Console → Performance → Total impressions" },
    { key: "ctr",                   label: "CTR (%)",                    type: "decimal",  section: "Search Performance",  hint: "Search Console → Performance → Average CTR" },
    { key: "avg_position",          label: "Avg Position",               type: "decimal",  section: "Search Performance",  hint: "Search Console → Performance → Average position" },
    { key: "page1_keywords",        label: "Page 1 Keywords",            type: "number",   section: "Search Performance",  hint: "Search Console → Count of queries with average position ≤ 10" },
    { key: "organic_traffic_pct",   label: "Organic % of Traffic",       type: "decimal",  section: "Search Performance",  hint: "GA4 → % of total sessions from Organic Search" },
    { key: "form_submissions",      label: "Form Submissions",           type: "number",   section: "Conversions",         hint: "GA4 → Conversions or form tracking tool" },
    { key: "vdp_views",             label: "VDP Views",                  type: "number",   section: "Conversions",         hint: "Dealer website analytics → Vehicle Detail Page views" },
    { key: "bounce_rate",           label: "Bounce Rate (%)",            type: "decimal",  section: "Conversions",         hint: "GA4 → Reports → Engagement → Bounce rate %" },
    { key: "avg_session_duration",  label: "Avg Session Duration (sec)", type: "number",   section: "Conversions",         hint: "GA4 → Reports → Engagement → Average session duration (enter in seconds)" },
    { key: "top_queries",           label: "Top Queries (up to 10)",     type: "top_queries", section: "Top Queries",      optional: true },
    { key: "top_query",             label: "Top Query (legacy)",         type: "text",     section: "Top Queries",         optional: true, hint: "Legacy field — use Top Queries table above instead" },
    { key: "tracked_keywords",      label: "Tracked Keywords",           type: "keywords", section: "Tracked Keywords",    optional: true, hint: "Enter keywords + target positions to track ranking progress" },
    { key: "page_links",            label: "Page Links",                 type: "links",    section: "Tracked Keywords" },
    { key: "work_completed",        label: "Work Completed",             type: "textarea", section: "Summary" },
    { key: "wins",                  label: "Wins",                       type: "textarea", section: "Summary",             optional: true, hint: "One per line" },
    { key: "losses",                label: "Losses / Watch Items",       type: "textarea", section: "Summary",             optional: true, hint: "One per line" },
    { key: "next_month",            label: "What's Coming Next Month",   type: "textarea", section: "Summary",             hint: "One per line" },
  ],
  gbp: [
    { key: "profile_views",      label: "Profile Views",          type: "number",   section: "Visibility",        hint: "Google Business → Performance → Profile views" },
    { key: "search_appearances", label: "Search Appearances",     type: "number",   section: "Visibility",        hint: "Google Business → Performance → Searches shown in" },
    { key: "map_views",          label: "Map Views",              type: "number",   section: "Visibility",        hint: "Google Business → Performance → Maps views" },
    { key: "website_clicks",     label: "Website Clicks",         type: "number",   section: "Customer Actions",  hint: "Google Business → Performance → Website clicks" },
    { key: "phone_calls",        label: "Phone Calls",            type: "number",   section: "Customer Actions",  synced: true, hint: "Auto-synced from CallRail → GBP calls. Do not edit manually." },
    { key: "direction_requests", label: "Direction Requests",     type: "number",   section: "Customer Actions",  hint: "Google Business → Performance → Direction requests" },
    { key: "review_count",       label: "Total Reviews",          type: "number",   section: "Reviews",           hint: "Google Business → Reviews → Total review count" },
    { key: "avg_rating",         label: "Average Rating",         type: "decimal",  section: "Reviews",           hint: "Google Business → Reviews → Average star rating (e.g. 4.7)" },
    { key: "new_reviews",        label: "New Reviews This Month", type: "number",   section: "Reviews",           hint: "Count of new reviews received this month" },
    { key: "photo_count",        label: "Photos on Profile",      type: "number",   section: "Activity",          hint: "Google Business → Photos → Total photo count" },
    { key: "posts_published",    label: "Posts Published",        type: "number",   section: "Activity",          hint: "Count of GBP posts published this month" },
    { key: "work_completed",     label: "Work Completed",         type: "textarea", section: "Summary" },
    { key: "wins",               label: "Wins",                   type: "textarea", section: "Summary",           optional: true, hint: "One per line" },
    { key: "losses",             label: "Losses / Watch Items",   type: "textarea", section: "Summary",           optional: true, hint: "One per line" },
    { key: "next_month",         label: "What's Coming Next Month", type: "textarea", section: "Summary",         hint: "One per line" },
  ],
  google_ads: [
    { key: "conversions",      label: "Total Conversions",        type: "number",   section: "Performance",    hint: "Google Ads → Campaigns → Conversions column" },
    { key: "clicks",           label: "Total Clicks",             type: "number",   section: "Performance",    hint: "Google Ads → Campaigns → Clicks column" },
    { key: "impressions",      label: "Impressions",              type: "number",   section: "Performance",    hint: "Google Ads → Campaigns → Impressions column" },
    { key: "cost_per_lead",    label: "Cost Per Lead ($)",        type: "decimal",  section: "Performance",    hint: "Google Ads → Campaigns → Cost/conv. column" },
    { key: "total_spend",      label: "Total Spend ($)",          type: "decimal",  section: "Budget & Cost",  hint: "Google Ads → Campaigns → Cost column (total for month)" },
    { key: "budget",           label: "Monthly Budget ($)",       type: "decimal",  section: "Budget & Cost",  hint: "Monthly budget allocated — used for budget pacing bar" },
    { key: "cpc",              label: "Avg CPC ($)",              type: "decimal",  section: "Budget & Cost",  hint: "Google Ads → Campaigns → Avg. CPC column" },
    { key: "ctr",              label: "CTR (%)",                  type: "decimal",  section: "Budget & Cost",  hint: "Google Ads → Campaigns → CTR column" },
    { key: "quality_score",    label: "Avg Quality Score",        type: "decimal",  section: "Quality",        hint: "Google Ads → Keywords → Quality Score column (average, 1-10 scale)" },
    { key: "impression_share", label: "Impression Share (%)",     type: "decimal",  section: "Quality",        hint: "Google Ads → Campaigns → Search impr. share column" },
    { key: "top_campaign",     label: "Top Performing Campaign",  type: "text",     section: "Quality",        hint: "Name of best-performing campaign this month" },
    { key: "work_completed",   label: "Work Completed",           type: "textarea", section: "Summary" },
    { key: "wins",             label: "Wins",                     type: "textarea", section: "Summary",        optional: true, hint: "One per line" },
    { key: "losses",           label: "Losses / Watch Items",     type: "textarea", section: "Summary",        optional: true, hint: "One per line" },
    { key: "next_month",       label: "What's Coming Next Month", type: "textarea", section: "Summary",        hint: "One per line" },
  ],
  meta_ads: [
    { key: "conversions",          label: "Total Conversions",        type: "number",   section: "Performance",    hint: "Meta Ads Manager → Campaigns → Results column" },
    { key: "cost_per_lead",        label: "Cost Per Lead ($)",        type: "decimal",  section: "Performance",    hint: "Meta Ads Manager → Campaigns → Cost per result" },
    { key: "reach",                label: "Reach",                    type: "number",   section: "Performance",    hint: "Meta Ads Manager → Campaigns → Reach column" },
    { key: "impressions",          label: "Impressions",              type: "number",   section: "Performance",    hint: "Meta Ads Manager → Campaigns → Impressions column" },
    { key: "total_spend",          label: "Total Spend ($)",          type: "decimal",  section: "Budget & Cost",  hint: "Meta Ads Manager → Campaigns → Amount spent (total)" },
    { key: "monthly_budget",       label: "Monthly Budget ($)",       type: "decimal",  section: "Budget & Cost",  hint: "Monthly budget allocated — used for budget pacing bar" },
    { key: "cpc",                  label: "Avg CPC ($)",              type: "decimal",  section: "Budget & Cost",  hint: "Meta Ads Manager → Campaigns → CPC column" },
    { key: "ctr",                  label: "CTR (%)",                  type: "decimal",  section: "Budget & Cost",  hint: "Meta Ads Manager → Campaigns → CTR column" },
    { key: "frequency",            label: "Frequency",                type: "decimal",  section: "Engagement",     hint: "Meta Ads Manager → Campaigns → Frequency column" },
    { key: "engagement_rate",      label: "Engagement Rate (%)",      type: "decimal",  section: "Engagement",     hint: "Meta Ads Manager → Engagement rate %" },
    { key: "video_view_rate",      label: "Video View Rate (%)",      type: "decimal",  section: "Engagement",     hint: "Meta Ads Manager → Video plays → ThruPlay rate %" },
    { key: "lead_form_completion", label: "Lead Form Completion (%)", type: "decimal",  section: "Engagement",     hint: "Meta Ads Manager → Lead form completion rate %" },
    { key: "top_ad",               label: "Top Performing Ad",        type: "text",     section: "Engagement",     hint: "Name or description of best-performing ad this month" },
    { key: "work_completed",       label: "Work Completed",           type: "textarea", section: "Summary" },
    { key: "wins",                 label: "Wins",                     type: "textarea", section: "Summary",        optional: true, hint: "One per line" },
    { key: "losses",               label: "Losses / Watch Items",     type: "textarea", section: "Summary",        optional: true, hint: "One per line" },
    { key: "next_month",           label: "What's Coming Next Month", type: "textarea", section: "Summary",        hint: "One per line" },
  ],
  social: [
    { key: "fb_followers",          label: "FB Followers",             type: "number",   section: "Facebook",   hint: "Facebook Page → Total followers (end of month) — growth auto-calculated" },
    { key: "fb_visits",             label: "FB Visits",                type: "number",   section: "Facebook",   hint: "Facebook Page → Insights → Page visits" },
    { key: "fb_engagement",         label: "FB Engagement",            type: "number",   section: "Facebook",   hint: "Facebook Page → Insights → Engagement count" },
    { key: "fb_page_views",         label: "FB Page Views",            type: "number",   section: "Facebook",   hint: "Facebook Page → Insights → Page views" },
    { key: "fb_published",          label: "FB Published",             type: "number",   section: "Facebook",   hint: "Count of posts/videos published to Facebook this month" },
    { key: "ig_followers",          label: "IG Followers",             type: "number",   section: "Instagram",  hint: "Instagram → Profile → Total followers (end of month) — growth auto-calculated" },
    { key: "ig_reach",              label: "IG Reach",                 type: "number",   section: "Instagram",  hint: "Instagram → Insights → Accounts reached" },
    { key: "ig_impressions",        label: "IG Impressions",           type: "number",   section: "Instagram",  hint: "Instagram → Insights → Impressions" },
    { key: "ig_profile_views",      label: "IG Profile Views",         type: "number",   section: "Instagram",  hint: "Instagram → Insights → Profile visits" },
    { key: "ig_published",          label: "IG Published",             type: "number",   section: "Instagram",  hint: "Count of posts/reels published to Instagram this month" },
    { key: "yt_followers",          label: "YT Subscribers",           type: "number",   section: "YouTube",    hint: "YouTube Studio → Dashboard → Total subscribers (end of month) — growth auto-calculated" },
    { key: "yt_month_views",        label: "YT Views (Month)",         type: "number",   section: "YouTube",    hint: "YouTube Studio → Analytics → Views (this month)" },
    { key: "yt_month_likes",        label: "YT Likes (Month)",         type: "number",   section: "YouTube",    hint: "YouTube Studio → Analytics → Likes (this month)" },
    { key: "yt_month_comments",     label: "YT Comments (Month)",      type: "number",   section: "YouTube",    hint: "YouTube Studio → Analytics → Comments (this month)" },
    { key: "yt_total_views",        label: "YT Total Views",           type: "number",   section: "YouTube",    hint: "YouTube Studio → Dashboard → Total channel views (all time)" },
    { key: "yt_long_form_published",label: "YT Long Form Published",   type: "number",   section: "YouTube",    hint: "Count of standard YouTube videos uploaded this month (not Shorts)" },
    { key: "yt_shorts_published",   label: "YT Shorts Published",      type: "number",   section: "YouTube",    hint: "Count of YouTube Shorts uploaded this month" },
    { key: "tiktok_followers",      label: "TikTok Followers",         type: "number",   section: "TikTok",     hint: "TikTok → Profile → Total followers (end of month) — growth auto-calculated" },
    { key: "tiktok_profile_views",  label: "TikTok Profile Views",     type: "number",   section: "TikTok",     hint: "TikTok → Analytics → Profile views" },
    { key: "tiktok_views",          label: "TikTok Video Views",       type: "number",   section: "TikTok",     hint: "TikTok → Analytics → Video views (this month)" },
    { key: "tiktok_likes",          label: "TikTok Likes",             type: "number",   section: "TikTok",     hint: "TikTok → Analytics → Likes (this month)" },
    { key: "tiktok_published",      label: "TikTok Published",         type: "number",   section: "TikTok",     hint: "Count of TikTok videos published this month" },
    { key: "top_video",             label: "Top Performing Video",     type: "text",     section: "Highlights", hint: "Title or description of best-performing video this month" },
    { key: "top_video_views",       label: "Top Video Views",          type: "number",   section: "Highlights", hint: "View count of the top performing video" },
    { key: "web_clicks",            label: "Website Clicks",           type: "number",   section: "Highlights", hint: "Total clicks to website from all social platforms" },
    { key: "work_completed",        label: "Work Completed",           type: "textarea", section: "Summary" },
    { key: "wins",                  label: "Wins",                     type: "textarea", section: "Summary",    optional: true, hint: "One per line" },
    { key: "losses",                label: "Losses / Watch Items",     type: "textarea", section: "Summary",    optional: true, hint: "One per line" },
    { key: "next_month",            label: "What's Coming Next Month", type: "textarea", section: "Summary",    hint: "One per line" },
  ],
  email: [
    { key: "campaigns_sent",   label: "Campaigns Sent",       type: "number",        section: "Campaign Data",  hint: "Total email campaigns sent this month" },
    { key: "total_recipients", label: "Audience Size",         type: "number",        section: "Campaign Data",  hint: "Total recipients across all campaigns this month" },
    { key: "campaign_list",    label: "Campaigns This Month",  type: "campaign_list", section: "Campaign Data" },
    { key: "work_completed",   label: "Work Completed",        type: "textarea",      section: "Summary" },
    { key: "wins",             label: "Wins",                  type: "textarea",      section: "Summary",        optional: true, hint: "One per line" },
    { key: "losses",           label: "Losses / Watch Items",  type: "textarea",      section: "Summary",        optional: true, hint: "One per line" },
    { key: "next_month",       label: "What's Coming Next Month", type: "textarea",   section: "Summary",        hint: "One per line" },
  ],
  creative: [
    { key: "total_assets",    label: "Total Assets Delivered",    type: "number",   section: "Assets Delivered", hint: "Auto-sum of all asset types below, or enter total manually" },
    { key: "videos",          label: "Videos",                    type: "number",   section: "Assets Delivered", hint: "Video assets produced this month" },
    { key: "graphics",        label: "Graphics / Statics",        type: "number",   section: "Assets Delivered", hint: "Static graphics produced (social posts, display ads, etc.)" },
    { key: "banners",         label: "Banners",                   type: "number",   section: "Assets Delivered", hint: "Banner ads or web banners produced" },
    { key: "print",           label: "Print Pieces",              type: "number",   section: "Assets Delivered", hint: "Print materials produced (flyers, mailers, etc.)" },
    { key: "ad_creative",     label: "Ad Creative Sets",          type: "number",   section: "Assets Delivered", hint: "Ad creative sets built for Google/Meta campaigns" },
    { key: "email_headers",   label: "Email Headers / Templates", type: "number",   section: "Assets Delivered", hint: "Email headers or templates designed" },
    { key: "work_completed",  label: "Work Completed",            type: "textarea", section: "Summary" },
    { key: "next_month",      label: "What's Coming Next Month",  type: "textarea", section: "Summary",         hint: "One per line" },
  ],
};

// ── Lead layout constants ─────────────────────────────────────────────────────
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

// ── Multi-listing GBP config ──────────────────────────────────────────────────
const GBP_MULTI_LISTINGS = {
  "Goode Motor Ford": [
    { key: "ford",     label: "Goode Motor Ford",     color: "#1d4ed8" },
    { key: "overland", label: "Goode Motor Overland", color: "#059669" },
  ],
};
const GBP_LISTING_FIELDS_ADMIN = [
  { key: "profile_views",      label: "Profile Views",      type: "number"  },
  { key: "search_appearances", label: "Search Appearances", type: "number"  },
  { key: "map_views",          label: "Map Views",          type: "number"  },
  { key: "website_clicks",     label: "Website Clicks",     type: "number"  },
  { key: "phone_calls",        label: "Phone Calls",        type: "number"  },
  { key: "direction_requests", label: "Direction Requests", type: "number"  },
  { key: "review_count",       label: "Total Reviews",      type: "number"  },
  { key: "avg_rating",         label: "Avg Rating",         type: "decimal" },
  { key: "new_reviews",        label: "New Reviews",        type: "number"  },
  { key: "photo_count",        label: "Photos on Profile",  type: "number"  },
  { key: "posts_published",    label: "Posts Published",    type: "number"  },
];
const GBP_LISTING_SUM_FIELDS = [
  "profile_views","search_appearances","map_views","website_clicks",
  "phone_calls","direction_requests","review_count","new_reviews","posts_published",
];

// ── CallRail -> GBP phone_calls cascade helper ───────────────────────────────
async function cascadeCallRailToGbp(supabaseClient, clientId, clientName, month, gbpCalls, userId) {
  const { data: existingGbp } = await supabaseClient.from("report_data").select("data")
    .eq("client_id", clientId).eq("month", month).eq("department", "gbp").single();
  const gbpData = existingGbp?.data || {};
  const gbpOverrides = new Set(gbpData._manual_overrides || []);
  const ts = { last_updated_by: userId, last_updated_at: new Date().toISOString() };

  let updatedGbp = { ...gbpData, _callrail_synced_at: new Date().toISOString() };

  if (clientName === "Goode Motor Ford") {
    if (!gbpOverrides.has("gbp_ford_phone_calls")) {
      updatedGbp.gbp_ford_phone_calls = gbpCalls;
      const overland = Number(updatedGbp.gbp_overland_phone_calls) || 0;
      updatedGbp.phone_calls = (Number(gbpCalls) || 0) + overland || null;
    }
  } else {
    if (!gbpOverrides.has("phone_calls")) {
      updatedGbp.phone_calls = gbpCalls;
    }
  }

  await supabaseClient.from("report_data").upsert(
    { client_id: clientId, month, department: "gbp", data: updatedGbp, ...ts },
    { onConflict: "client_id,month,department" }
  );
}

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
    onChange([...links, { url: newUrl, label: newLabel || newUrl }]);
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
          {!disabled && <button onClick={() => removeLink(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.tl, fontSize: 14, padding: 0 }}>x</button>}
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

/* ─── CAMPAIGN LIST FIELD (new for Email) ─── */
function CampaignListField({ value, onChange, disabled }) {
  const campaigns = Array.isArray(value) ? value : [];
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");

  const addCampaign = () => {
    if (!newName.trim()) return;
    onChange([...campaigns, { name: newName.trim(), date_sent: newDate || "" }]);
    setNewName(""); setNewDate("");
  };
  const removeCampaign = (i) => onChange(campaigns.filter((_, idx) => idx !== i));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {campaigns.length > 0 && (
        <div style={{ border: `1px solid ${C.bd}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 36px", padding: "6px 10px", background: "#f8fafc", borderBottom: `1px solid ${C.bd}` }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: F }}>Campaign</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: F }}>Date Sent</span>
            <span />
          </div>
          {campaigns.map((c, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 140px 36px", padding: "8px 10px", borderBottom: i < campaigns.length - 1 ? `1px solid ${C.bl2}` : "none", background: i % 2 === 0 ? C.white : "#fafafa", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: C.t, fontFamily: F, fontWeight: 500 }}>{c.name}</span>
              <span style={{ fontSize: 12, color: C.tl, fontFamily: F }}>{c.date_sent || "—"}</span>
              {!disabled && (
                <button onClick={() => removeCampaign(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.tl, fontSize: 14, padding: 0, textAlign: "center" }}>x</button>
              )}
            </div>
          ))}
        </div>
      )}
      {!disabled && (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCampaign()}
            placeholder='Campaign name (e.g. "Presidents Day Sale")'
            style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.bd}`, fontSize: 12, fontFamily: F, outline: "none" }}
          />
          <input
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            style={{ width: 140, padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.bd}`, fontSize: 12, fontFamily: F, outline: "none" }}
          />
          <button onClick={addCampaign} style={{ background: C.cyan, color: C.navy, border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, whiteSpace: "nowrap" }}>Add</button>
        </div>
      )}
      {campaigns.length === 0 && disabled && (
        <div style={{ fontSize: 12, color: C.tl, fontFamily: F, fontStyle: "italic" }}>No campaigns entered for this period</div>
      )}
    </div>
  );
}

/* ─── TOP QUERIES FIELD (new for SEO — replaces single top_query for client view) ─── */
function TopQueriesField({ value, onChange, disabled }) {
  const queries = Array.isArray(value) ? value : [];
  const [newQuery, setNewQuery] = useState("");
  const [newClicks, setNewClicks] = useState("");
  const [newImpressions, setNewImpressions] = useState("");
  const [newPosition, setNewPosition] = useState("");

  const addQuery = () => {
    if (!newQuery.trim()) return;
    onChange([...queries, {
      query: newQuery.trim(),
      clicks: newClicks ? Number(newClicks) : null,
      impressions: newImpressions ? Number(newImpressions) : null,
      position: newPosition ? Number(newPosition) : null,
    }]);
    setNewQuery(""); setNewClicks(""); setNewImpressions(""); setNewPosition("");
  };
  const removeQuery = (i) => onChange(queries.filter((_, idx) => idx !== i));
  const updateQuery = (i, field, val) => {
    const updated = queries.map((q, idx) => {
      if (idx !== i) return q;
      const numVal = val === "" ? null : Number(val);
      return { ...q, [field]: field === "query" ? val : (isNaN(numVal) ? null : numVal) };
    });
    onChange(updated);
  };

  const MAX_QUERIES = 10;
  const inputStyle = { width: "100%", padding: "5px 7px", borderRadius: 5, border: `1px solid ${C.bd}`, fontSize: 12, fontFamily: F, outline: "none", background: C.white, boxSizing: "border-box" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 11, color: C.tl, fontFamily: F }}>
        Enter up to {MAX_QUERIES} top organic queries. All rows are editable — click any cell to update. Hit Save when done.
      </div>
      {queries.length > 0 && (
        <div style={{ border: `1px solid ${C.bd}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 90px 36px", padding: "6px 10px", background: "#f8fafc", borderBottom: `1px solid ${C.bd}` }}>
            {["Query", "Clicks", "Impressions", "Position", ""].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: F }}>{h}</span>
            ))}
          </div>
          {queries.map((q, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 90px 36px", padding: "6px 8px", borderBottom: i < queries.length - 1 ? `1px solid ${C.bl2}` : "none", background: i % 2 === 0 ? C.white : "#fafafa", alignItems: "center", gap: 6 }}>
              {/* Query — editable text */}
              {disabled
                ? <span style={{ fontSize: 12, fontWeight: 500, color: C.t, fontFamily: F }}>{q.query}</span>
                : <input value={q.query ?? ""} onChange={e => updateQuery(i, "query", e.target.value)}
                    style={{ ...inputStyle, fontWeight: 500 }} placeholder="Query" />
              }
              {/* Clicks */}
              {disabled
                ? <span style={{ fontSize: 12, color: C.t, fontFamily: F }}>{q.clicks?.toLocaleString() ?? "—"}</span>
                : <input type="number" value={q.clicks ?? ""} onChange={e => updateQuery(i, "clicks", e.target.value)}
                    style={inputStyle} placeholder="0" />
              }
              {/* Impressions */}
              {disabled
                ? <span style={{ fontSize: 12, color: C.tl, fontFamily: F }}>{q.impressions?.toLocaleString() ?? "—"}</span>
                : <input type="number" value={q.impressions ?? ""} onChange={e => updateQuery(i, "impressions", e.target.value)}
                    style={inputStyle} placeholder="opt" />
              }
              {/* Position */}
              {disabled
                ? <span style={{ fontSize: 12, color: C.t, fontFamily: F }}>
                    {q.position != null ? (
                      <span style={{ background: q.position <= 3 ? "#ecfdf5" : q.position <= 10 ? "#e6f9fc" : "#f0f2f5", color: q.position <= 3 ? "#059669" : q.position <= 10 ? C.cyanD : C.tl, padding: "1px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{q.position.toFixed(1)}</span>
                    ) : "—"}
                  </span>
                : <input type="number" step="0.1" value={q.position ?? ""} onChange={e => updateQuery(i, "position", e.target.value)}
                    style={inputStyle} placeholder="0.0" />
              }
              {/* Remove */}
              {!disabled
                ? <button onClick={() => removeQuery(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.tl, fontSize: 14, padding: 0, textAlign: "center" }}>x</button>
                : <span />
              }
            </div>
          ))}
        </div>
      )}
      {!disabled && queries.length < MAX_QUERIES && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 90px auto", gap: 6, alignItems: "center" }}>
          <input value={newQuery} onChange={e => setNewQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && addQuery()} placeholder="Add query..."
            style={{ padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.cyan}88`, fontSize: 12, fontFamily: F, outline: "none", background: "#f0fdff" }} />
          <input type="number" value={newClicks} onChange={e => setNewClicks(e.target.value)} placeholder="Clicks"
            style={{ padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.cyan}88`, fontSize: 12, fontFamily: F, outline: "none", background: "#f0fdff" }} />
          <input type="number" value={newImpressions} onChange={e => setNewImpressions(e.target.value)} placeholder="Impr. (opt)"
            style={{ padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.cyan}88`, fontSize: 12, fontFamily: F, outline: "none", background: "#f0fdff" }} />
          <input type="number" step="0.1" value={newPosition} onChange={e => setNewPosition(e.target.value)} placeholder="Pos."
            style={{ padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.cyan}88`, fontSize: 12, fontFamily: F, outline: "none", background: "#f0fdff" }} />
          <button onClick={addQuery} style={{ background: C.cyan, color: C.navy, border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, whiteSpace: "nowrap" }}>+ Add</button>
        </div>
      )}
      {queries.length >= MAX_QUERIES && !disabled && (
        <div style={{ fontSize: 11, color: C.tl, fontFamily: F }}>Maximum of {MAX_QUERIES} queries reached.</div>
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
    onChange([...rows, { keyword: newKw.trim(), target_position: newTarget ? Number(newTarget) : null }]);
    setNewKw(""); setNewTarget("");
  };
  const removeRow = (i) => onChange(rows.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) => onChange(rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const getStatus = (current, target) => {
    if (current == null) return null;
    if (target == null) return current <= 10 ? "top10" : "tracking";
    if (current <= target) return "on_target";
    if (current <= target + 3) return "close";
    return "off";
  };
  const STATUS_STYLE = {
    on_target: { bg: "#f0fdf4", color: "#166534", label: "On Target" },
    close:     { bg: "#fffbeb", color: "#92400e", label: "Close" },
    off:       { bg: "#fef2f2", color: "#991b1b", label: "Off" },
    top10:     { bg: "#e6f9fc", color: "#00a5bf", label: "Top 10" },
    tracking:  { bg: "#f8fafc", color: "#6b7280", label: "Tracking" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {rows.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 70px 80px 80px", gap: 6, padding: "6px 8px", background: "#f8fafc", borderRadius: "8px 8px 0 0", border: `1px solid ${C.bd}`, borderBottom: "none" }}>
          {["Keyword","Target","Position","Clicks","Impr.","CTR","Status"].map(h => (
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
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 70px 80px 80px", gap: 6, padding: "8px 8px", border: `1px solid ${C.bd}`, borderTop: "none", background: i % 2 === 0 ? C.white : "#fafafa" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {!disabled && <button onClick={() => removeRow(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.tl, fontSize: 12, padding: 0 }}>x</button>}
              <span style={{ fontSize: 12, fontFamily: F, color: C.t }}>{row.keyword}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              {disabled ? <span style={{ fontSize: 12, fontFamily: F, color: C.tl }}>{row.target_position ?? "-"}</span> : (
                <input type="number" value={row.target_position ?? ""} onChange={e => updateRow(i, "target_position", e.target.value ? Number(e.target.value) : null)} placeholder="-" min="1" max="100"
                  style={{ width: "100%", padding: "4px 6px", borderRadius: 5, border: `1px solid ${C.bd}`, fontSize: 12, fontFamily: F, outline: "none" }} />
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: F, color: current != null ? C.navy : C.tl }}>{current != null ? `#${current}` : "-"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontFamily: F, color: C.t }}>{sc?.clicks != null ? sc.clicks.toLocaleString() : "-"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontFamily: F, color: C.t }}>{sc?.impressions != null ? (sc.impressions >= 1000 ? (sc.impressions / 1000).toFixed(1) + "k" : sc.impressions) : "-"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontFamily: F, color: C.t }}>{sc?.ctr != null ? (sc.ctr * 100).toFixed(1) + "%" : "-"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              {st ? <span style={{ background: st.bg, color: st.color, borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 700, fontFamily: F }}>{st.label}</span>
                : <span style={{ fontSize: 11, color: C.tl, fontFamily: F }}>-</span>}
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
      {scQueries.length === 0 && rows.length > 0 && <div style={{ fontSize: 11, color: C.tl, fontFamily: F, marginTop: 8 }}>Pull Search Console data to see live positions.</div>}
      {scQueries.length > 0 && <div style={{ fontSize: 11, color: "#166534", fontFamily: F, marginTop: 8 }}>Showing live data from Search Console - {scQueries.length} queries tracked</div>}
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
      const path = `${clientId}/${deptId}/${month}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("report-uploads").upload(path, file);
      if (uploadErr) { console.error(uploadErr); continue; }
      const { data: { publicUrl } } = supabase.storage.from("report-uploads").getPublicUrl(path);
      await supabase.from("report_uploads").insert({
        client_id: clientId, department: deptId, month,
        file_name: file.name, file_url: publicUrl,
        file_type: file.type, label: file.name, uploaded_by: user.id,
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
      file_type: "link", label: linkLabel || linkUrl, uploaded_by: user.id,
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
    return "📄";
  };

  return (
    <div style={{ marginTop: 28, borderTop: `1px solid ${C.bd}`, paddingTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: F }}>📎 Content & Uploads</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setAddingLink(v => !v)} style={{ background: C.pL, color: C.p, border: `1px solid ${C.p}33`, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>+ Add Link</button>
          <button onClick={() => fileRef.current?.click()} style={{ background: C.cyanL, color: C.cyanD, border: `1px solid ${C.cyan}33`, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>Upload File</button>
        </div>
      </div>
      {addingLink && (
        <div style={{ background: C.pL, border: `1px solid ${C.p}33`, borderRadius: 8, padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input value={linkLabel} onChange={e => setLinkLabel(e.target.value)} placeholder="Label" style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.bd}`, fontSize: 12, fontFamily: F, outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.bd}`, fontSize: 12, fontFamily: F, outline: "none" }} onKeyDown={e => e.key === "Enter" && handleLinkSave()} />
            <button onClick={handleLinkSave} style={{ background: C.p, color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F }}>Save</button>
            <button onClick={() => setAddingLink(false)} style={{ background: "none", border: `1px solid ${C.bd}`, borderRadius: 6, padding: "8px 12px", fontSize: 12, cursor: "pointer", fontFamily: F, color: C.tl }}>Cancel</button>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" style={{ display: "none" }} onChange={e => handleFileUpload(e.target.files)} />
      <div onDrop={e => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }} onDragOver={e => e.preventDefault()}
        style={{ border: `2px dashed ${C.bd}`, borderRadius: 10, padding: "20px", textAlign: "center", cursor: "pointer", background: "#fafafa", marginBottom: uploads.length ? 14 : 0 }}
        onClick={() => fileRef.current?.click()}>
        {uploading ? <div style={{ fontSize: 13, color: C.tl, fontFamily: F }}>Uploading...</div> : (
          <div style={{ fontSize: 12, color: C.tl, fontFamily: F }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📁</div>
            Drag & drop files here, or click to browse
          </div>
        )}
      </div>
      {uploads.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {uploads.map(u => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, background: C.white, border: `1px solid ${C.bd}`, borderRadius: 8, padding: "10px 14px" }}>
              <span style={{ fontSize: 18 }}>{getFileIcon(u.file_type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={u.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: C.t, fontFamily: F, textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.label || u.file_name}</a>
                <div style={{ fontSize: 11, color: C.tl, fontFamily: F }}>{new Date(u.uploaded_at).toLocaleDateString()}</div>
              </div>
              <button onClick={() => handleDelete(u.id, u.file_url, u.file_type)} style={{ background: "none", border: "none", cursor: "pointer", color: C.tl, fontSize: 16, padding: 4 }}>🗑</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── BACKFILL MODAL ─── */
function BackfillModal({ onClose }) {
  // API backfill removed — all data is manual entry
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 32, maxWidth: 400, fontFamily: F }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: C.t }}>API Backfill Removed</div>
        <div style={{ fontSize: 13, color: C.tl, marginBottom: 20 }}>All data entry is now manual. API integrations have been removed.</div>
        <button onClick={onClose} style={{ background: C.cyan, color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Close</button>
      </div>
    </div>
  );
}

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
    <div style={{ gridColumn: "1 / -1", background: "#f8fafc", border: `1px solid ${C.bd}`, borderRadius: 10, padding: "14px 18px", marginTop: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, fontFamily: F }}>
        Traffic Channel Breakdown - Total: {total.toLocaleString()} sessions
      </div>
      <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 10, marginBottom: 12 }}>
        {channels.filter(ch => ch.pct > 0).map(ch => <div key={ch.label} style={{ width: `${ch.pct}%`, background: ch.color }} />)}
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

/* ─── PUBLISHED BREAKDOWN PREVIEW (Social admin) ─── */
function PublishedBreakdownPreview({ data }) {
  const fb     = Number(data.fb_published)          || 0;
  const ig     = Number(data.ig_published)          || 0;
  const ytLong = Number(data.yt_long_form_published) || 0;
  const ytShort= Number(data.yt_shorts_published)   || 0;
  const tt     = Number(data.tiktok_published)       || 0;
  const total  = fb + ig + ytLong + ytShort + tt;
  if (total === 0) return null;

  const PLATFORM_COLORS = {
    fb: "#1877F2", ig: "#E1306C", ytLong: "#FF0000", ytShort: "#FF6B6B", tt: "#69C9D0",
  };
  const segments = [
    { key: "fb",     label: "Facebook",     value: fb,      color: PLATFORM_COLORS.fb },
    { key: "ig",     label: "Instagram",    value: ig,      color: PLATFORM_COLORS.ig },
    { key: "ytLong", label: "YT Long Form", value: ytLong,  color: PLATFORM_COLORS.ytLong },
    { key: "ytShort",label: "YT Shorts",    value: ytShort, color: PLATFORM_COLORS.ytShort },
    { key: "tt",     label: "TikTok",       value: tt,      color: PLATFORM_COLORS.tt },
  ].filter(s => s.value > 0);

  return (
    <div style={{ gridColumn: "1 / -1", background: "#f8fafc", border: `1px solid ${C.bd}`, borderRadius: 10, padding: "14px 18px", marginTop: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, fontFamily: F }}>
        Published Breakdown - Total: {total} pieces
      </div>
      <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 8, marginBottom: 10, gap: 2 }}>
        {segments.map(s => (
          <div key={s.key} style={{ width: `${Math.round((s.value / total) * 100)}%`, background: s.color, borderRadius: 3 }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {segments.map(s => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.tl }}>{s.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.t }}>{s.value}</span>
          </div>
        ))}
      </div>
      {(ytLong > 0 || ytShort > 0) && (
        <div style={{ marginTop: 8, fontSize: 11, color: C.tl, fontFamily: F }}>
          YouTube total: <strong style={{ color: C.t }}>{ytLong + ytShort}</strong> ({ytLong} long form + {ytShort} shorts)
        </div>
      )}
    </div>
  );
}

/* ─── FIELD INPUT ─── */
const FieldInput = ({ field, value, onChange, disabled, scData }) => {
  if (field.type === "links")         return <LinksField value={value} onChange={v => onChange(field.key, v)} disabled={disabled} />;
  if (field.type === "keywords")      return <TrackedKeywordsField value={value} onChange={v => onChange(field.key, v)} disabled={disabled} scData={scData} />;
  if (field.type === "campaign_list") return <CampaignListField value={value} onChange={v => onChange(field.key, v)} disabled={disabled} />;
  if (field.type === "top_queries")   return <TopQueriesField value={value} onChange={v => onChange(field.key, v)} disabled={disabled} />;
  const base = { width: "100%", padding: "10px 12px", borderRadius: 7, border: `1px solid ${field.api && value ? C.cyan + "88" : C.bd}`, fontSize: 13, fontFamily: F, outline: "none", boxSizing: "border-box", background: disabled ? "#f8fafc" : C.white, color: disabled ? C.tl : C.t, cursor: disabled ? "not-allowed" : "text" };
  if (field.type === "textarea") return (
    <textarea value={value || ""} onChange={e => onChange(field.key, e.target.value)} disabled={disabled} rows={3} placeholder={field.hint || `Enter ${field.label.toLowerCase()}...`} style={{ ...base, resize: "vertical", lineHeight: 1.5 }} />
  );
  return <input type={field.type === "number" || field.type === "decimal" ? "number" : "text"} step={field.type === "decimal" ? "0.01" : "1"} value={value ?? ""} onChange={e => onChange(field.key, e.target.value)} disabled={disabled} placeholder={field.hint || "0"} style={base} />;
};

/* ─── DEPT FORM ─── */
function InfoBanner({ children, variant = "info" }) {
  const styles = {
    info:  { bg: C.cyanL, border: `1px solid ${C.cyan}44`, color: C.cyanD },
    sync:  { bg: "#e6f9fc", border: "1px solid #a5f3fc", color: C.cyanD },
    warn:  { bg: "#fffbeb", border: "1px solid #fde68a", color: "#92400e" },
    success: { bg: C.gL, border: `1px solid ${C.g}44`, color: "#166534" },
  }[variant];
  return (
    <div style={{ background: styles.bg, border: styles.border, borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 12, color: styles.color, fontFamily: F }}>
      {children}
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div style={{ gridColumn: "1 / -1", marginTop: 16, marginBottom: 4, paddingBottom: 6, borderBottom: `2px solid ${C.bd}`, display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 3, height: 14, background: C.cyan, borderRadius: 2 }} />
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.tl, fontFamily: F }}>{title}</span>
    </div>
  );
}

function DeptForm({ dept, clientId, clientName, month, monthIdx, year, userRole, userDept, onSaved, allClients, serviceEnabled }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [listingTab, setListingTab] = useState("ford");

  const isGoode        = dept.id === "leads" && clientName === GOODE_MOTOR_GROUP;
  const oemLabel       = dept.id === "leads" ? JUNEAU_OEM_LABEL[clientName] : null;
  const isJuneau       = !!oemLabel;
  const isJuneauSource = isJuneau && clientName === JUNEAU_LEAD_SOURCE;
  const isJuneauChild  = isJuneau && !isJuneauSource;
  const isMultiGBP      = dept.id === "gbp" && !!GBP_MULTI_LISTINGS[clientName];
  const multiGBPListings= isMultiGBP ? GBP_MULTI_LISTINGS[clientName] : null;

  const fields     = isGoode ? LEADS_FIELDS_GOODE : isJuneau ? leadsFieldsJuneau(oemLabel) : (DEPT_FIELDS[dept.id] || []);
  const editable   = canEdit(userRole, userDept, dept.id);
  // All fields are manual entry now

  const load = useCallback(async () => {
    setLoading(true);
    const { data: row } = await supabase.from("report_data").select("data")
      .eq("client_id", clientId).eq("month", month).eq("department", dept.id).single();
    setData(row?.data || {});
    setLoading(false);
  }, [clientId, month, dept.id]);

  useEffect(() => { load(); }, [load]);

  // Cmd+S / Ctrl+S to save
  const saveRef = React.useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (saveRef.current && editable && !saving) saveRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editable, saving]);



  const autoSaveTimer = useRef(null);
  const handleChange = (key, val) => {
    setData(prev => ({ ...prev, [key]: val }));
    setSaved(false);
    // Debounced auto-save: 1.5s after last change
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (saveRef.current && editable && !saving) saveRef.current();
    }, 1500);
  };
  // Cleanup timer on unmount
  useEffect(() => () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); }, []);

  if (serviceEnabled === false) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px", color: C.tl, fontFamily: F }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⭕</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.t, marginBottom: 8 }}>This service is not active for this client</div>
        <div style={{ fontSize: 13, color: C.tl }}>Toggle the button next to the department name in the sidebar to enable it.</div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const ts = { last_updated_by: user.id, last_updated_at: new Date().toISOString() };

    const savePayload = { ...data };

    // ── Auto-compute total_published for Social from per-channel fields ──
    if (dept.id === "social") {
      const totalPublished = (Number(savePayload.fb_published) || 0)
        + (Number(savePayload.ig_published) || 0)
        + (Number(savePayload.yt_long_form_published) || 0)
        + (Number(savePayload.yt_shorts_published) || 0)
        + (Number(savePayload.tiktok_published) || 0);
      if (totalPublished > 0) {
        savePayload.total_published = totalPublished;
        // Also set yt_month_videos for backward compat
        savePayload.yt_month_videos = (Number(savePayload.yt_long_form_published) || 0) + (Number(savePayload.yt_shorts_published) || 0);
      }
    }

    // ── Auto-compute GBP combined totals from per-listing fields ──
    if (isMultiGBP && multiGBPListings) {
      GBP_LISTING_SUM_FIELDS.forEach(f => {
        const total = multiGBPListings.reduce((acc, l) => {
          const v = Number(savePayload[`gbp_${l.key}_${f}`]);
          return acc + (isNaN(v) ? 0 : v);
        }, 0);
        if (total > 0) savePayload[f] = total;
      });
    }

    await supabase.from("report_data").upsert(
      { client_id: clientId, month, department: dept.id, data: savePayload, ...ts },
      { onConflict: "client_id,month,department" }
    );

    setData(savePayload);

    if (dept.id === "callrail") {
      const gbpCalls = savePayload.gbp_calls ?? null;
      await cascadeCallRailToGbp(supabase, clientId, clientName, month, gbpCalls, user.id);
    }

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
  saveRef.current = handleSave;

  const FULL_WIDTH_TYPES = new Set(["textarea","links","keywords","campaign_list","top_queries"]);
  // Section headers derived from field.section property

  const hasFieldContent = (field) => {
    const v = data[field.key];
    if (field.type === "keywords" || field.type === "links" || field.type === "campaign_list" || field.type === "top_queries") return Array.isArray(v) && v.length > 0;
    if (field.type === "textarea") return typeof v === "string" && v.trim().length > 0;
    return v !== null && v !== undefined && String(v).trim() !== "";
  };

  const filledCount   = fields.filter(f => !f.optional && hasFieldContent(f)).length;
  const requiredTotal = fields.filter(f => !f.optional).length;
  // Track which sections have been rendered to insert headers

  if (loading) return <div style={{ padding: 24, textAlign: "center", color: C.tl, fontFamily: F, fontSize: 13 }}>Loading...</div>;

  return (
    <div>
      {/* Department-specific info banners */}
      {dept.id === "callrail" && (
        <InfoBanner variant="sync">Saving CallRail data will automatically sync GBP Calls to Google Business Profile phone calls.</InfoBanner>
      )}
      {dept.id === "gbp" && data._callrail_synced_at && (
        <InfoBanner variant="sync">Phone Calls synced from CallRail - {new Date(data._callrail_synced_at).toLocaleDateString()}</InfoBanner>
      )}
      {dept.id === "email" && (
        <InfoBanner variant="info">💡 Site Visits from Email is entered on the <strong>SEO form</strong> by David — GA4 → Acquisition → Traffic Acquisition → Email channel sessions.</InfoBanner>
      )}
      {dept.id === "social" && (
        <InfoBanner variant="info">💡 Enter total follower counts as of end of month — growth is auto-calculated vs prior month. Enter published counts per channel — Total Published is auto-calculated.</InfoBanner>
      )}
      {isJuneauSource && <InfoBanner variant="success">Saving here syncs Total, Website, Facebook & Phone leads to all Juneau stores.</InfoBanner>}
      {isJuneauChild && <InfoBanner variant="info">Total, Website, Facebook & Phone synced from Juneau Auto Mall. Enter {oemLabel} leads here.</InfoBanner>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: C.tl, fontFamily: F }}>{filledCount} of {requiredTotal} required fields filled</div>
          <CompletionBar filled={filledCount} total={requiredTotal} />
        </div>
        {editable && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: saving ? C.o : saved ? C.g : C.tl, fontFamily: F, fontWeight: 600 }}>
              {saving ? "⟳ Auto-saving..." : saved ? "✓ Saved" : "Auto-save enabled"}
            </span>
            <button onClick={handleSave} disabled={saving} style={{ background: saved ? C.g : C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : "Save Now"}
            </button>
          </div>
        )}
      </div>

      {!editable && <div style={{ background: C.oL, border: `1px solid ${C.o}22`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: C.o, fontFamily: F }}>View only - you can edit {userDept} data only.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {fields.map((field, idx) => {
          const isSharedField = isJuneauChild && SHARED_KEYS.includes(field.key);
          const isFullWidth   = FULL_WIDTH_TYPES.has(field.type);
          const isSynced      = field.synced;
          const prevSection   = idx > 0 ? fields[idx - 1].section : null;
          const showSection   = field.section && field.section !== prevSection;
          return (
            <React.Fragment key={field.key}>
              {showSection && <SectionHeader title={field.section} />}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: isFullWidth ? "1 / -1" : "auto", ...(isSynced ? { background: "#e6f9fc", borderRadius: 8, padding: "10px 12px", border: "1px solid #a5f3fc" } : {}) }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.t, fontFamily: F }}>
                  {field.label}
                  {field.optional && <span style={{ color: C.tl, fontWeight: 400, marginLeft: 6, fontSize: 11 }}>optional</span>}
                  {isSharedField && <span style={{ color: C.cyan, fontWeight: 400, marginLeft: 6, fontSize: 11 }}>synced</span>}
                  {isSynced && <span style={{ color: C.cyanD, fontWeight: 700, marginLeft: 6, fontSize: 11 }}>🔗 from CallRail</span>}
                </label>
                {field.hint && <div style={{ fontSize: 11, color: C.tl, fontFamily: F, marginTop: -2 }}>{field.hint}</div>}
                <FieldInput field={field} value={data[field.key]} onChange={handleChange} disabled={!editable || isSharedField || isSynced} scData={data} />
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {dept.id === "seo" && <TrafficChannelPreview data={data} />}
      {dept.id === "social" && <PublishedBreakdownPreview data={data} />}

      {UPLOAD_DEPTS.includes(dept.id) && editable && (
        <UploadSection clientId={clientId} deptId={dept.id} month={month} />
      )}

      {/* ── Multi-listing GBP entry ── */}
      {isMultiGBP && multiGBPListings && (
        <div style={{ marginTop: 24, borderTop: `1px solid ${C.bd}`, paddingTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14, fontFamily: F }}>
            📍 Per-Listing Data Entry
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            {multiGBPListings.map(l => (
              <button key={l.key} onClick={() => setListingTab(l.key)}
                style={{ padding: "8px 18px", borderRadius: 8, border: `2px solid ${listingTab === l.key ? l.color : C.bd}`,
                  background: listingTab === l.key ? l.color + "15" : C.white,
                  color: listingTab === l.key ? l.color : C.tl,
                  fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
                📍 {l.label}
              </button>
            ))}
            <div style={{ marginLeft: "auto", fontSize: 11, color: C.cyanD, fontFamily: F, background: C.cyanL, padding: "4px 10px", borderRadius: 6 }}>
              Combined totals auto-computed on Save
            </div>
          </div>
          {multiGBPListings.filter(l => l.key === listingTab).map(l => (
            <div key={l.key} style={{ background: "#f8fafc", borderRadius: 10, padding: 16, border: `2px solid ${l.color}33` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: l.color, fontFamily: F, marginBottom: 14 }}>{l.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                {GBP_LISTING_FIELDS_ADMIN.map(field => {
                  const fKey = `gbp_${l.key}_${field.key}`;
                  return (
                    <div key={fKey} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: C.t, fontFamily: F }}>{field.label}</label>
                      <input type="number" step={field.type === "decimal" ? "0.01" : "1"} value={data[fKey] ?? ""} onChange={e => handleChange(fKey, e.target.value)} disabled={!editable} placeholder="0"
                        style={{ padding: "9px 12px", borderRadius: 7, border: `1px solid ${C.bd}`, fontSize: 13, fontFamily: F, outline: "none", background: editable ? C.white : "#f8fafc", color: editable ? C.t : C.tl }} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goode Motor Group sold % by brand */}
      {isGoode && [data.ford_leads, data.mazda_leads, data.vw_leads].some(v => v) && (
        <div style={{ marginTop: 24, borderTop: `1px solid ${C.bd}`, paddingTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.tl, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, fontFamily: F }}>Sold % by Brand (auto-calculated)</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[{ brand: "Ford", leads: data.ford_leads, sold: data.ford_sold }, { brand: "Mazda", leads: data.mazda_leads, sold: data.mazda_sold }, { brand: "Volkswagen", leads: data.vw_leads, sold: data.vw_sold }].map(s => {
              const p = s.leads > 0 && s.sold >= 0 ? Math.round((Number(s.sold) / Number(s.leads)) * 1000) / 10 : null;
              return (
                <div key={s.brand} style={{ background: C.white, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "14px 20px", flex: 1, minWidth: 120, textAlign: "center", boxShadow: C.sh }}>
                  <div style={{ fontSize: 11, color: C.tl, fontWeight: 700, textTransform: "uppercase", fontFamily: F, marginBottom: 4 }}>{s.brand}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: p !== null ? C.cyan : C.tl, fontFamily: F }}>{p !== null ? `${p}%` : "-"}</div>
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

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.tl, fontFamily: F }}>Loading benchmark data...</div>;

  let aboveCount = 0, withinCount = 0, belowCount = 0, unknownCount = 0;
  Object.entries(BENCHMARKS).forEach(([dept, metrics]) => {
    metrics.forEach(m => {
      const status = getBenchmarkStatus(allData[dept]?.[m.key], m.range, m.lowerBetter);
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
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.t, margin: "0 0 4px", fontFamily: F }}>Industry Benchmarks</h3>
        <p style={{ fontSize: 12, color: C.tl, margin: 0, fontFamily: F }}>{MONTHS[monthIdx]} {year} - {clientName} - Admin only</p>
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
                    {["Metric","Your Number","Industry Range","Status","Note"].map(h => (
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
                      ? (m.unit === "$" ? "$" + Number(raw).toLocaleString(undefined, { maximumFractionDigits: 2 })
                        : Number(raw).toLocaleString(undefined, { maximumFractionDigits: 2 }) + (m.unit === "$" ? "" : m.unit))
                      : "-";
                    const rangeDisplay = m.unit === "$" ? `$${m.range[0]}-$${m.range[1]}` : `${m.range[0]}-${m.range[1]}${m.unit}`;
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
    setDeptCompletion({});
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
      if (f.type === "keywords" || f.type === "links" || f.type === "campaign_list" || f.type === "top_queries") return Array.isArray(v) && v.length > 0;
      return v !== null && v !== undefined && String(v).trim() !== "";
    }).length;
    setDeptCompletion(prev => ({ ...prev, [deptId]: { filled, total: fields.length } }));
  }, [client.id, month]);

  const handleSaved = useCallback(async (deptId) => {
    await refreshCompletion(deptId);
    if (deptId === "callrail") await refreshCompletion("gbp");
    const { data: existing } = await supabase.from("monthly_reports").select("status").eq("client_id", client.id).eq("month", month).single();
    if (!existing) { await supabase.from("monthly_reports").insert({ client_id: client.id, month, status: "in_progress" }); setReportStatus("in_progress"); }
    else if (existing.status === "draft") { await supabase.from("monthly_reports").update({ status: "in_progress" }).eq("client_id", client.id).eq("month", month); setReportStatus("in_progress"); }
  }, [client.id, month, refreshCompletion]);

  // API pull functions removed — all data is manual entry

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
  // API pull removed — all manual entry

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.cyan, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: F, padding: 0 }}>Back to All Clients</button>
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
      {publishError && <div style={{ background: C.rL, border: "1px solid #fecaca", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: C.r, fontFamily: F }}>{publishError}</div>}
      {reportStatus === "published" && <div style={{ background: C.gL, border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#166834", fontFamily: F }}>This report is live. Clients can see it now.</div>}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ width: 210, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {DEPARTMENTS.map(dept => {
            const comp = deptCompletion[dept.id];
            const isActive = activeDept === dept.id;
            const enabled = getServiceEnabled(dept.id);
            const pct = comp ? Math.round((comp.filled / comp.total) * 100) : null;
            return (
              <div key={dept.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button onClick={() => setActiveDept(dept.id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: isActive ? C.navy : C.white, color: isActive ? "#fff" : enabled ? C.t : C.tl, fontFamily: F, fontSize: 13, fontWeight: isActive ? 700 : 500, boxShadow: isActive ? "none" : C.sh, textAlign: "left", opacity: enabled ? 1 : 0.5 }}>
                  <span>{dept.icon} {dept.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
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
                <p style={{ fontSize: 12, color: C.tl, margin: 0, fontFamily: F }}>{MONTHS[monthIdx]} {year} - {client.name}</p>
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
  // API backfill removed

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
                      <div style={{ fontSize: 11, color: C.tl }}>Tier {client.tier} - Click to enter data</div>
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
    setInviteMsg(`To add ${inviteEmail}:\n1. Go to Supabase Authentication - Users - Invite User\n2. Enter their email\n3. Run this SQL:\n\nINSERT INTO user_profiles (id, email, role, department, full_name)\nSELECT id, email, '${inviteRole}', '${inviteDept}', email\nFROM auth.users WHERE email = '${inviteEmail}';`);
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
                <td style={{ padding: "12px 16px" }}><div style={{ fontWeight: 600, color: C.t }}>{m.full_name || "-"}</div><div style={{ fontSize: 11, color: C.tl }}>{m.email}</div></td>
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
        if (ai !== -1) return -1; if (bi !== -1) return 1;
        return a.name.localeCompare(b.name);
      }));
    };
    load();
  }, [session]);

  const handleLogout = async () => { await supabase.auth.signOut(); setSession(null); };

  if (authLoading) return <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "#fff", fontFamily: F }}>Loading...</div></div>;

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
          <a href="/" style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>Client View</a>
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
