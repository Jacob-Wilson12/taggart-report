import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const fmt = (d) => d.toISOString().split("T")[0];
  return { startDate: fmt(start), endDate: fmt(end) };
}

async function metaFetch(path) {
  const accessToken = process.env.META_ADS_ACCESS_TOKEN;
  const response = await fetch(
    `https://graph.facebook.com/v19.0${path}&access_token=${accessToken}`
  );
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }
  return response.json();
}

// ─── Facebook Page Insights ───────────────────────────────────────────────────
async function getFacebookData(pageId, year, month) {
  const { startDate, endDate } = getMonthRange(year, month);

  // Use period=day with since/until and sum the values
  const metricsToFetch = [
    "page_impressions",
    "page_impressions_unique",
    "page_engaged_users",
    "page_post_engagements",
    "page_fan_adds_unique",
  ].join(",");

  const insightsData = await metaFetch(
    `/${pageId}/insights?metric=${metricsToFetch}&period=day&since=${startDate}&until=${endDate}`
  );

  // Sum up daily values for the month
  const metrics = {};
  for (const item of insightsData.data || []) {
    const total = (item.values || []).reduce((sum, v) => {
      const val = v.value || 0;
      return sum + (typeof val === "object" ? Object.values(val).reduce((a, b) => a + b, 0) : val);
    }, 0);
    metrics[item.name] = total;
  }

  const pageData = await metaFetch(`/${pageId}?fields=fan_count,name`);

  return {
    name: pageData.name,
    followers: pageData.fan_count || 0,
    impressions: metrics["page_impressions"] || 0,
    reach: metrics["page_impressions_unique"] || 0,
    engaged_users: metrics["page_engaged_users"] || 0,
    post_engagements: metrics["page_post_engagements"] || 0,
    new_followers: metrics["page_fan_adds_unique"] || 0,
  };
}

// ─── Instagram Insights ───────────────────────────────────────────────────────
async function getInstagramData(pageId, year, month) {
  const { startDate, endDate } = getMonthRange(year, month);

  // Get Instagram account ID via the linked Facebook Page
  const pageData = await metaFetch(
    `/${pageId}?fields=instagram_business_account`
  );
  const igId = pageData.instagram_business_account?.id;
  if (!igId) throw new Error("No Instagram business account linked to this Facebook Page");

  // Account info
  const accountData = await metaFetch(
    `/${igId}?fields=followers_count,username`
  );

  // Instagram insights
  const metricsToFetch = ["impressions", "reach", "profile_views"].join(",");
  const insightsData = await metaFetch(
    `/${igId}/insights?metric=${metricsToFetch}&period=day&since=${startDate}&until=${endDate}`
  );

  const metrics = {};
  for (const item of insightsData.data || []) {
    const total = (item.values || []).reduce((sum, v) => sum + (v.value || 0), 0);
    metrics[item.name] = total;
  }

  return {
    username: accountData.username,
    followers: accountData.followers_count || 0,
    impressions: metrics["impressions"] || 0,
    reach: metrics["reach"] || 0,
    profile_views: metrics["profile_views"] || 0,
  };
}

// ─── YouTube Analytics (OAuth via taggartadvertising@gmail.com) ───────────────
async function getYouTubeData(channelId, year, month) {
  const { startDate, endDate } = getMonthRange(year, month);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_GBP_REFRESH_TOKEN,
  });

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth: oauth2Client });

  // Channel stats
  const channelResponse = await youtube.channels.list({
    part: ["statistics", "snippet"],
    id: [channelId],
  });

  const item = channelResponse.data.items?.[0];
  if (!item) throw new Error("Channel not found");

  const stats = item.statistics || {};
  const channelName = item.snippet?.title || "";

  // Analytics for the month
  const analyticsResponse = await youtubeAnalytics.reports.query({
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics: "views,estimatedMinutesWatched,averageViewDuration,likes,comments,shares,subscribersGained,subscribersLost",
  });

  const rows = analyticsResponse.data.rows?.[0] || [];
  const [views, watchMinutes, avgViewDuration, likes, comments, shares, subsGained, subsLost] = rows;

  return {
    channel_name: channelName,
    subscribers: parseInt(stats.subscriberCount || 0),
    total_views: parseInt(stats.viewCount || 0),
    total_videos: parseInt(stats.videoCount || 0),
    views: views || 0,
    watch_minutes: Math.round(watchMinutes || 0),
    avg_view_duration: Math.round(avgViewDuration || 0),
    likes: likes || 0,
    comments: comments || 0,
    shares: shares || 0,
    subscribers_gained: subsGained || 0,
    subscribers_lost: subsLost || 0,
  };
}

// ─── Main Route ───────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");
    const year = parseInt(searchParams.get("year"));
    const month = parseInt(searchParams.get("month"));

    if (!clientId || !year || !month) {
      return Response.json(
        { error: "Missing required params: client_id, year, month" },
        { status: 400 }
      );
    }

    const { data: integration, error: intErr } = await supabase
      .from("client_integrations")
      .select("config")
      .eq("client_id", clientId)
      .eq("platform", "social")
      .single();

    if (intErr || !integration) {
      return Response.json(
        { error: "No social integration found for this client." },
        { status: 404 }
      );
    }

    const config = integration.config;
    const results = {};
    const errors = {};

    if (config.facebook_page_id) {
      try {
        results.facebook = await getFacebookData(config.facebook_page_id, year, month);
      } catch (e) {
        errors.facebook = e.message;
      }
    }

    // Instagram is pulled via the Facebook Page link
    if (config.facebook_page_id) {
      try {
        results.instagram = await getInstagramData(config.facebook_page_id, year, month);
      } catch (e) {
        // Not all pages have Instagram linked - silently skip
        if (!e.message.includes("No Instagram business account")) {
          errors.instagram = e.message;
        }
      }
    }

    if (config.youtube_channel_id) {
      try {
        results.youtube = await getYouTubeData(config.youtube_channel_id, year, month);
      } catch (e) {
        errors.youtube = e.message;
      }
    }

    const socialData = {
      ...results,
      _errors: Object.keys(errors).length > 0 ? errors : undefined,
      _source: "social",
      _pulled_at: new Date().toISOString(),
    };

    const autoSave = searchParams.get("save") === "true";
    if (autoSave) {
      const monthStr = `${year}-${String(month).padStart(2, "0")}-01`;

      const { data: existing } = await supabase
        .from("report_data")
        .select("data")
        .eq("client_id", clientId)
        .eq("month", monthStr)
        .eq("department", "social")
        .single();

      const merged = { ...(existing?.data || {}), ...socialData };

      const { error: saveErr } = await supabase.from("report_data").upsert(
        {
          client_id: parseInt(clientId),
          month: monthStr,
          department: "social",
          data: merged,
          last_updated_at: new Date().toISOString(),
        },
        { onConflict: "client_id,month,department" }
      );

      if (saveErr) {
        return Response.json({
          success: true,
          saved: false,
          save_error: saveErr.message,
          data: socialData,
        });
      }

      return Response.json({
        success: true,
        saved: true,
        client_id: clientId,
        period: getMonthRange(year, month),
        data: socialData,
      });
    }

    return Response.json({
      success: true,
      saved: false,
      client_id: clientId,
      period: getMonthRange(year, month),
      data: socialData,
    });
  } catch (err) {
    console.error("Social API error:", err);
    return Response.json(
      { error: err.message, details: err.errors || null },
      { status: 500 }
    );
  }
}
