// Department field schemas — ported from app/admin/page.js so /v2/admin and
// /admin can share one definition. Complex field types from the legacy
// admin (top_queries, keywords, links, duration) are stubbed as "advanced"
// and rendered as a placeholder in v2 for now; the legacy /admin still
// handles them.

export const DEPT_FIELDS = {
  leads: [
    { key: 'total_leads',       label: 'Total Leads',         type: 'number',   section: 'Lead Sources', hint: 'Total leads from all sources combined' },
    { key: 'website_leads',     label: 'Website Leads',       type: 'number',   section: 'Lead Sources', hint: 'Leads from dealer website forms' },
    { key: 'third_party',       label: 'Third Party Leads',   type: 'number',   section: 'Lead Sources', hint: 'Leads from AutoTrader, Cars.com, CarGurus, etc.' },
    { key: 'facebook_leads',    label: 'Facebook Leads',      type: 'number',   section: 'Lead Sources', hint: 'Leads from Facebook/Meta lead forms' },
    { key: 'total_sold',        label: 'Total Sold',          type: 'number',   section: 'Sales',        hint: 'Total units sold from all lead sources' },
    { key: 'website_sold',      label: 'Website Sold',        type: 'number',   section: 'Sales',        hint: 'Units sold from website leads' },
    { key: 'third_party_sold',  label: 'Third Party Sold',    type: 'number',   section: 'Sales',        hint: 'Units sold from third-party leads' },
    { key: 'facebook_sold',     label: 'Facebook Sold',       type: 'number',   section: 'Sales',        hint: 'Units sold from Facebook leads' },
    { key: 'notes',             label: 'Notes',               type: 'textarea', section: 'Notes',        optional: true },
  ],
  callrail: [
    { key: 'total_calls',   label: 'Total Calls',        type: 'number',   section: 'Call Volume', hint: 'CallRail → Total calls for the month' },
    { key: 'website_calls', label: 'Calls from Website', type: 'number',   section: 'Call Volume', hint: 'CallRail → Calls attributed to website' },
    { key: 'ads_calls',     label: 'Calls from Ads',     type: 'number',   section: 'Call Volume', hint: 'CallRail → Calls attributed to Google/Meta ads' },
    { key: 'gbp_calls',     label: 'Calls from GBP',     type: 'number',   section: 'Call Volume', hint: 'CallRail → Calls attributed to Google Business Profile. Auto-syncs to GBP dept on save.' },
    { key: 'notes',         label: 'Notes',              type: 'textarea', section: 'Notes',       optional: true },
  ],
  seo: [
    { key: 'organic_sessions',       label: 'Organic Sessions',           type: 'number',   section: 'Traffic',            hint: 'GA4 → Organic Search sessions' },
    { key: 'direct_sessions',        label: 'Direct Sessions',            type: 'number',   section: 'Traffic',            hint: 'GA4 → Direct sessions' },
    { key: 'paid_sessions',          label: 'Paid Sessions',              type: 'number',   section: 'Traffic',            hint: 'GA4 → Paid Search sessions' },
    { key: 'social_sessions',        label: 'Social Sessions',            type: 'number',   section: 'Traffic',            hint: 'GA4 → Organic Social sessions' },
    { key: 'site_visits_from_email', label: 'Site Visits from Email',     type: 'number',   section: 'Traffic',            hint: 'GA4 → Email sessions' },
    { key: 'impressions',            label: 'Impressions',                type: 'number',   section: 'Search Performance', hint: 'Search Console → Total impressions' },
    { key: 'ctr',                    label: 'CTR (%)',                    type: 'decimal',  section: 'Search Performance', hint: 'Search Console → Average CTR' },
    { key: 'avg_position',           label: 'Avg Position',               type: 'decimal',  section: 'Search Performance', hint: 'Search Console → Average position' },
    { key: 'page1_keywords',         label: 'Page 1 Keywords',            type: 'number',   section: 'Search Performance', hint: 'Count of queries with avg position ≤ 10' },
    { key: 'organic_traffic_pct',    label: 'Organic % of Traffic',       type: 'decimal',  section: 'Search Performance', hint: 'GA4 → % of total sessions from Organic Search' },
    { key: 'phone_calls',            label: 'Phone Calls',                type: 'number',   section: 'Conversions',        hint: 'CallRail → Calls attributed to organic search' },
    { key: 'form_submissions',       label: 'Form Submissions',           type: 'number',   section: 'Conversions',        hint: 'GA4 → Form conversions or tracking tool' },
    { key: 'chat_conversations',     label: 'Chats & Texts',              type: 'number',   section: 'Conversions',        hint: 'Website chat / SMS widget total conversations', optional: true },
    { key: 'vdp_views',              label: 'VDP Views',                  type: 'number',   section: 'Conversions',        hint: 'Dealer website → Vehicle Detail Page views' },
    { key: 'bounce_rate',            label: 'Bounce Rate (%)',            type: 'decimal',  section: 'Conversions',        hint: 'GA4 → Bounce rate %' },
    { key: 'avg_session_duration',   label: 'Avg Session Duration',       type: 'advanced', section: 'Conversions',        hint: 'Duration — manage in legacy admin for now' },
    { key: 'top_queries',            label: 'Top Queries',                type: 'advanced', section: 'Advanced',           hint: 'Table — manage in legacy admin for now', optional: true },
    { key: 'tracked_keywords',       label: 'Tracked Keywords',           type: 'advanced', section: 'Advanced',           hint: 'Keyword table — manage in legacy admin for now', optional: true },
    { key: 'page_links',             label: 'Page Links',                 type: 'advanced', section: 'Advanced',           optional: true },
    { key: 'work_completed',         label: 'Work Completed',             type: 'textarea', section: 'Summary' },
    { key: 'wins',                   label: 'Wins',                       type: 'textarea', section: 'Summary',            optional: true, hint: 'One per line' },
    { key: 'losses',                 label: 'Losses / Watch Items',       type: 'textarea', section: 'Summary',            optional: true, hint: 'One per line' },
    { key: 'next_month',             label: "What's Coming Next Month",   type: 'textarea', section: 'Summary',            hint: 'One per line' },
  ],
  gbp: [
    { key: 'profile_views',      label: 'Profile Views',          type: 'number',   section: 'Visibility',       hint: 'GBP → Performance → Profile views' },
    { key: 'search_appearances', label: 'Search Appearances',     type: 'number',   section: 'Visibility',       hint: 'GBP → Performance → Searches shown in' },
    { key: 'map_views',          label: 'Map Views',              type: 'number',   section: 'Visibility',       hint: 'GBP → Performance → Maps views' },
    { key: 'website_clicks',     label: 'Website Clicks',         type: 'number',   section: 'Customer Actions', hint: 'GBP → Performance → Website clicks' },
    { key: 'phone_calls',        label: 'Phone Calls',            type: 'number',   section: 'Customer Actions', synced: true, hint: 'Auto-synced from CallRail → GBP calls. Do not edit manually.' },
    { key: 'direction_requests', label: 'Direction Requests',     type: 'number',   section: 'Customer Actions', hint: 'GBP → Performance → Direction requests' },
    { key: 'review_count',       label: 'Total Reviews',          type: 'number',   section: 'Reviews',          hint: 'GBP → Reviews → Total review count' },
    { key: 'avg_rating',         label: 'Average Rating',         type: 'decimal',  section: 'Reviews',          hint: 'GBP → Reviews → Average star rating (e.g. 4.7)' },
    { key: 'new_reviews',        label: 'New Reviews This Month', type: 'number',   section: 'Reviews',          hint: 'Count of new reviews received this month' },
    { key: 'photo_count',        label: 'Photos on Profile',      type: 'number',   section: 'Activity',         hint: 'GBP → Photos → Total photo count' },
    { key: 'posts_published',    label: 'Posts Published',        type: 'number',   section: 'Activity',         hint: 'Count of GBP posts published this month' },
    { key: 'work_completed',     label: 'Work Completed',         type: 'textarea', section: 'Summary' },
    { key: 'wins',               label: 'Wins',                   type: 'textarea', section: 'Summary',          optional: true, hint: 'One per line' },
    { key: 'losses',             label: 'Losses / Watch Items',   type: 'textarea', section: 'Summary',          optional: true, hint: 'One per line' },
    { key: 'next_month',         label: "What's Coming Next Month", type: 'textarea', section: 'Summary',        hint: 'One per line' },
  ],
  google_ads: [
    { key: 'conversions',      label: 'Total Conversions',        type: 'number',   section: 'Performance',   hint: 'Google Ads → Campaigns → Conversions column' },
    { key: 'clicks',           label: 'Total Clicks',             type: 'number',   section: 'Performance',   hint: 'Google Ads → Campaigns → Clicks column' },
    { key: 'impressions',      label: 'Impressions',              type: 'number',   section: 'Performance',   hint: 'Google Ads → Campaigns → Impressions column' },
    { key: 'cost_per_lead',    label: 'Cost Per Lead ($)',        type: 'decimal',  section: 'Performance',   hint: 'Google Ads → Campaigns → Cost/conv. column' },
    { key: 'total_spend',      label: 'Total Spend ($)',          type: 'decimal',  section: 'Budget & Cost', hint: 'Google Ads → Campaigns → Cost column (total for month)' },
    { key: 'budget',           label: 'Monthly Budget ($)',       type: 'decimal',  section: 'Budget & Cost', hint: 'Monthly budget allocated — used for budget pacing bar' },
    { key: 'cpc',              label: 'Avg CPC ($)',              type: 'decimal',  section: 'Budget & Cost', hint: 'Google Ads → Campaigns → Avg. CPC column' },
    { key: 'ctr',              label: 'CTR (%)',                  type: 'decimal',  section: 'Budget & Cost', hint: 'Google Ads → Campaigns → CTR column' },
    { key: 'quality_score',    label: 'Avg Quality Score',        type: 'decimal',  section: 'Quality',       hint: 'Google Ads → Keywords → Quality Score column (average)' },
    { key: 'impression_share', label: 'Impression Share (%)',     type: 'decimal',  section: 'Quality',       hint: 'Google Ads → Campaigns → Search impr. share' },
    { key: 'top_campaign',     label: 'Top Performing Campaign',  type: 'text',     section: 'Quality',       hint: 'Name of best-performing campaign this month' },
    { key: 'work_completed',   label: 'Work Completed',           type: 'textarea', section: 'Summary' },
    { key: 'wins',             label: 'Wins',                     type: 'textarea', section: 'Summary',       optional: true, hint: 'One per line' },
    { key: 'losses',           label: 'Losses / Watch Items',     type: 'textarea', section: 'Summary',       optional: true, hint: 'One per line' },
    { key: 'next_month',       label: "What's Coming Next Month", type: 'textarea', section: 'Summary',       hint: 'One per line' },
  ],
  meta_ads: [
    { key: 'conversions',          label: 'Total Conversions',        type: 'number',   section: 'Performance',   hint: 'Meta Ads Manager → Campaigns → Results column' },
    { key: 'cost_per_lead',        label: 'Cost Per Lead ($)',        type: 'decimal',  section: 'Performance',   hint: 'Meta Ads Manager → Cost per result' },
    { key: 'reach',                label: 'Reach',                    type: 'number',   section: 'Performance',   hint: 'Meta Ads Manager → Reach column' },
    { key: 'impressions',          label: 'Impressions',              type: 'number',   section: 'Performance',   hint: 'Meta Ads Manager → Impressions column' },
    { key: 'total_spend',          label: 'Total Spend ($)',          type: 'decimal',  section: 'Budget & Cost', hint: 'Meta Ads Manager → Amount spent (total)' },
    { key: 'monthly_budget',       label: 'Monthly Budget ($)',       type: 'decimal',  section: 'Budget & Cost', hint: 'Monthly budget — used for pacing bar' },
    { key: 'cpc',                  label: 'Avg CPC ($)',              type: 'decimal',  section: 'Budget & Cost', hint: 'Meta Ads Manager → CPC column' },
    { key: 'ctr',                  label: 'CTR (%)',                  type: 'decimal',  section: 'Budget & Cost', hint: 'Meta Ads Manager → CTR column' },
    { key: 'frequency',            label: 'Frequency',                type: 'decimal',  section: 'Engagement',    hint: 'Meta Ads Manager → Frequency column' },
    { key: 'engagement_rate',      label: 'Engagement Rate (%)',      type: 'decimal',  section: 'Engagement',    hint: 'Meta Ads Manager → Engagement rate %' },
    { key: 'video_view_rate',      label: 'Video View Rate (%)',      type: 'decimal',  section: 'Engagement',    hint: 'Meta Ads Manager → ThruPlay rate %' },
    { key: 'lead_form_completion', label: 'Lead Form Completion (%)', type: 'decimal',  section: 'Engagement',    hint: 'Meta Ads Manager → Lead form completion %' },
    { key: 'top_ad',               label: 'Top Performing Ad',        type: 'text',     section: 'Engagement',    hint: 'Name of best-performing ad' },
    { key: 'work_completed',       label: 'Work Completed',           type: 'textarea', section: 'Summary' },
    { key: 'wins',                 label: 'Wins',                     type: 'textarea', section: 'Summary',       optional: true, hint: 'One per line' },
    { key: 'losses',               label: 'Losses / Watch Items',     type: 'textarea', section: 'Summary',       optional: true, hint: 'One per line' },
    { key: 'next_month',           label: "What's Coming Next Month", type: 'textarea', section: 'Summary',       hint: 'One per line' },
  ],
  social: [
    { key: 'fb_followers',           label: 'FB Followers',             type: 'number',   section: 'Facebook',   hint: 'FB Page → Total followers (end of month)' },
    { key: 'fb_visits',              label: 'FB Visits',                type: 'number',   section: 'Facebook',   hint: 'FB Page → Insights → Page visits' },
    { key: 'fb_engagement',          label: 'FB Engagement',            type: 'number',   section: 'Facebook',   hint: 'FB Page → Insights → Engagement count' },
    { key: 'fb_page_views',          label: 'FB Page Views',            type: 'number',   section: 'Facebook',   hint: 'FB Page → Insights → Page views' },
    { key: 'fb_published',           label: 'FB Published',             type: 'number',   section: 'Facebook',   hint: 'Count of posts/videos published to FB this month' },
    { key: 'ig_followers',           label: 'IG Followers',             type: 'number',   section: 'Instagram',  hint: 'IG → Profile → Total followers' },
    { key: 'ig_reach',               label: 'IG Reach',                 type: 'number',   section: 'Instagram',  hint: 'IG → Insights → Accounts reached' },
    { key: 'ig_impressions',         label: 'IG Impressions',           type: 'number',   section: 'Instagram',  hint: 'IG → Insights → Impressions' },
    { key: 'ig_profile_views',       label: 'IG Profile Views',         type: 'number',   section: 'Instagram',  hint: 'IG → Insights → Profile visits' },
    { key: 'ig_published',           label: 'IG Published',             type: 'number',   section: 'Instagram',  hint: 'Count of posts/reels published to IG' },
    { key: 'yt_followers',           label: 'YT Subscribers',           type: 'number',   section: 'YouTube',    hint: 'YT Studio → Total subscribers' },
    { key: 'yt_month_views',         label: 'YT Views (Month)',         type: 'number',   section: 'YouTube',    hint: 'YT Studio → Analytics → Views (this month)' },
    { key: 'yt_month_likes',         label: 'YT Likes (Month)',         type: 'number',   section: 'YouTube',    hint: 'YT Studio → Analytics → Likes' },
    { key: 'yt_month_comments',      label: 'YT Comments (Month)',      type: 'number',   section: 'YouTube',    hint: 'YT Studio → Analytics → Comments' },
    { key: 'yt_long_form_published', label: 'YT Long Form Published',   type: 'number',   section: 'YouTube',    hint: 'Count of standard YouTube videos uploaded' },
    { key: 'yt_shorts_published',    label: 'YT Shorts Published',      type: 'number',   section: 'YouTube',    hint: 'Count of YouTube Shorts uploaded' },
    { key: 'tiktok_followers',       label: 'TikTok Followers',         type: 'number',   section: 'TikTok',     hint: 'TikTok → Profile → Total followers' },
    { key: 'tiktok_profile_views',   label: 'TikTok Profile Views',     type: 'number',   section: 'TikTok',     hint: 'TikTok → Analytics → Profile views' },
    { key: 'tiktok_views',           label: 'TikTok Video Views',       type: 'number',   section: 'TikTok',     hint: 'TikTok → Analytics → Video views' },
    { key: 'tiktok_likes',           label: 'TikTok Likes',             type: 'number',   section: 'TikTok',     hint: 'TikTok → Analytics → Likes' },
    { key: 'tiktok_published',       label: 'TikTok Published',         type: 'number',   section: 'TikTok',     hint: 'Count of TikTok videos published' },
    { key: 'top_video',              label: 'Top Performing Video',     type: 'text',     section: 'Highlights', hint: 'Title / description of top video' },
    { key: 'top_video_views',        label: 'Top Video Views',          type: 'number',   section: 'Highlights', hint: 'View count of the top video' },
    { key: 'web_clicks',             label: 'Website Clicks',           type: 'number',   section: 'Highlights', hint: 'Total clicks to website from all social' },
    { key: 'work_completed',         label: 'Work Completed',           type: 'textarea', section: 'Summary' },
    { key: 'wins',                   label: 'Wins',                     type: 'textarea', section: 'Summary',    optional: true, hint: 'One per line' },
    { key: 'losses',                 label: 'Losses / Watch Items',     type: 'textarea', section: 'Summary',    optional: true, hint: 'One per line' },
    { key: 'next_month',             label: "What's Coming Next Month", type: 'textarea', section: 'Summary',    hint: 'One per line' },
  ],
};

/** Admin-side departments in display order. Keep in sync with sidebar. */
export const ADMIN_DEPARTMENTS = [
  { id: 'leads',      label: 'Leads',           icon: 'leads' },
  { id: 'callrail',   label: 'CallRail',        icon: 'leads' },  // reuse icon for now
  { id: 'seo',        label: 'SEO',             icon: 'seo' },
  { id: 'gbp',        label: 'Google Business', icon: 'gbp' },
  { id: 'google_ads', label: 'Google Ads',      icon: 'google_ads' },
  { id: 'meta_ads',   label: 'Meta Ads',        icon: 'meta_ads' },
  { id: 'social',     label: 'Organic Social',  icon: 'social' },
];

/** Count how many "real" (non-optional, non-advanced) fields a dept has. */
export function fieldCount(deptId) {
  const fields = DEPT_FIELDS[deptId] || [];
  return fields.filter((f) => !f.optional && f.type !== 'advanced').length;
}

/** Which fields have a value in the data blob. */
export function filledCount(deptId, data = {}) {
  const fields = DEPT_FIELDS[deptId] || [];
  return fields.filter((f) => {
    if (f.optional || f.type === 'advanced') return false;
    const v = data[f.key];
    return v != null && v !== '';
  }).length;
}

/** Sections in a dept's form, in insertion order. */
export function sectionsFor(deptId) {
  const fields = DEPT_FIELDS[deptId] || [];
  const seen = new Set();
  const sections = [];
  fields.forEach((f) => {
    if (!seen.has(f.section)) {
      seen.add(f.section);
      sections.push(f.section);
    }
  });
  return sections;
}
