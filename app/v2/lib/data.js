// Data-loading helpers for /v2. Factored out of app/page.js so the shell and
// pages stay thin. Keep the field lists in sync with the v1 lists until we
// move everything over and delete v1.

import { supabase } from '../../../supabase';
import { toMonthStr } from './theme';

const SUM_FIELDS = {
  seo:        ['organic_sessions','total_sessions','impressions','vdp_views','phone_calls','form_submissions','direction_requests','chat_conversations','site_visits_from_email'],
  gbp:        ['profile_views','search_appearances','map_views','website_clicks','phone_calls','direction_requests','new_reviews'],
  google_ads: ['conversions','total_spend','impressions','clicks'],
  meta_ads:   ['conversions','total_spend','reach','impressions'],
  social:     ['fb_visits','fb_page_views','ig_reach','ig_profile_views','tiktok_profile_views','fb_engagement','ig_engagement','tiktok_likes','fb_new_followers','ig_new_followers','total_published','fb_published','ig_published','yt_long_form_published','yt_shorts_published','tiktok_published','web_clicks','yt_month_views','yt_month_videos','yt_month_likes','yt_month_comments','tiktok_views','fb_followers','ig_followers','yt_followers','tiktok_followers'],
  callrail:   ['total_calls','website_calls','ads_calls','gbp_calls'],
  leads:      ['total_leads','website_leads','third_party','facebook_leads','total_sold','website_sold','third_party_sold','facebook_sold','ford_leads','ford_sold','mazda_leads','mazda_sold','vw_leads','vw_sold','oem_leads','oem_sold'],
};
const AVG_FIELDS = {
  seo:        ['ctr','avg_position','bounce_rate','avg_session_duration'],
  gbp:        ['avg_rating'],
  google_ads: ['ctr','impression_share','quality_score'],
  meta_ads:   ['ctr','frequency','engagement_rate','video_view_rate','lead_form_completion'],
};

export function aggregateDept(dataArr, dept) {
  if (!dataArr.length) return {};
  if (dataArr.length === 1) return dataArr[0];
  const result = { ...dataArr[dataArr.length - 1] };
  (SUM_FIELDS[dept] || []).forEach((f) => {
    const total = dataArr.reduce((acc, d) => acc + (Number(d[f]) || 0), 0);
    result[f] = total > 0 ? total : null;
  });
  (AVG_FIELDS[dept] || []).forEach((f) => {
    const vals = dataArr.map((d) => d[f]).filter((v) => v != null && !isNaN(Number(v)));
    result[f] = vals.length ? vals.reduce((a, b) => a + Number(b), 0) / vals.length : null;
  });
  return result;
}

export function aggregateRange(range, byMonth) {
  const allDepts = new Set();
  range.forEach((m) => {
    const key = toMonthStr(m);
    Object.keys(byMonth[key] || {}).forEach((d) => allDepts.add(d));
  });
  const result = {};
  allDepts.forEach((dept) => {
    const rows = range.map((m) => byMonth[toMonthStr(m)]?.[dept]).filter(Boolean);
    result[dept] = aggregateDept(rows, dept);
  });
  return result;
}

export function lastMonth() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function monthsBefore(m, n) {
  const out = [];
  for (let i = n; i > 0; i--) {
    const d = new Date(m.year, m.month - 1 - i, 1);
    out.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return out;
}

/**
 * Load clients the authenticated user can see. Mirrors the v1 fetch — admin
 * roles see everyone, otherwise filter by user_client_access.
 */
export async function loadClients(session) {
  if (!session) return [];
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  const isAdmin = ['admin', 'editor', 'account_manager'].includes(
    profile?.role?.toLowerCase()
  );
  let data;
  if (isAdmin) {
    ({ data } = await supabase
      .from('clients')
      .select('id,name,group_name')
      .eq('active', true));
  } else {
    const { data: access } = await supabase
      .from('user_client_access')
      .select('client_id')
      .eq('user_id', session.user.id);
    const ids = access?.map((r) => r.client_id) || [];
    ({ data } = await supabase
      .from('clients')
      .select('id,name,group_name')
      .eq('active', true)
      .in('id', ids));
  }
  return (data || []).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Load the raw report_data rows for a client across a list of months.
 * Returns { byMonth: { 'yyyy-mm-01': { seo: {...}, gbp: {...}, ... } } }.
 */
export async function loadReportData(clientId, months) {
  const monthStrs = months.map(toMonthStr);
  const { data, error } = await supabase
    .from('report_data')
    .select('department, data, month')
    .eq('client_id', clientId)
    .in('month', monthStrs);
  if (error) throw error;
  const byMonth = {};
  (data || []).forEach((r) => {
    const key = typeof r.month === 'string' ? r.month.substring(0, 10) : toMonthStr(r);
    if (!byMonth[key]) byMonth[key] = {};
    byMonth[key][r.department] = r.data || {};
  });
  return byMonth;
}

/**
 * Load client_services → map of { dept: enabled } so we can hide departments
 * the client doesn't pay for.
 */
export async function loadServices(clientId) {
  const { data } = await supabase
    .from('client_services')
    .select('department, enabled')
    .eq('client_id', clientId);
  const map = {};
  (data || []).forEach((r) => {
    map[r.department] = r.enabled !== false;
  });
  return map;
}
