import { createClient } from "@supabase/supabase-js";

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

async function metaFetch(path, token) {
  const accessToken = token || process.env.META_ADS_ACCESS_TOKEN;
  const response = await fetch(
    `https://graph.facebook.com/v19.0${path}&access_token=${accessToken}`
  );
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }
  return response.json();
}

// ─── Get Page Access Token ────────────────────────────────────────────────────
async function getPageAccessToken(pageId) {
  const data = await metaFetch(`/${pageId}?fields=access_token`);
  if (!data.access_token) throw new Error("Could not get page access token");
  return data.access_token;
}

// ─── Facebook Page Insights ───────────────────────────────────────────────────
async function getFacebookData(pageId, year, month) {
  const { startDate, endDate } = getMonthRange(year, month);
  const pageToken = await getPageAccessToken(pageId);

  // Fetch metrics in two groups (some don't combine well)
  const metricsGroup1 = ["page_impressions_unique", "page_post_engagements", "page_views_total"].join(",");
  const metricsGroup2 = "page_daily_follows_unique";

  const [insightsData1, insightsData2, pageData] = await Promise.all([
    metaFetch(`/${pageId}/insights?metric=${metricsGroup1}&period=day&since=${startDate}&until=${endDate}`, pageToken),
    metaFetch(`/${pageId}/insights?metric=${metricsGroup2}&period=day&since=${startDate}&until=${endDate}`, pageToken),
    metaFetch(`/${pageId}?fields=fan_count,name`, pageToken),
  ]);

  const metrics = {};
  for (const item of [...(insightsData1.data || []), ...(insightsData2.data || [])]) {
    const total = (item.values || []).reduce((sum, v) => {
      const val = v.value || 0;
      return sum + (typeof val === "object" ? Object.values(val).reduce((a, b) => a + b, 0) : val);
    }, 0);
    metrics[item.name] = total;
  }

  return {
    name: pageData.name,
    followers: pageData.fan_count || 0,
    reach: metrics["page_impressions_unique"] || 0,
    post_engagements: metrics["page_post_engagements"] || 0,
    new_followers: metrics["page_daily_follows_unique"] || 0,
    page_views: metrics["page_views_total"] || 0,
  };
}

// ─── Instagram Insights ───────────────────────────────────────────────────────
async function getInstagramData(pageId, year, month) {
  const { startDate, endDate } = getMonthRange(year, month);
  const pageToken = await getPageAccessToken(pageId);

  // Get Instagram account ID via the linked Facebook Page
  const pageData = await metaFetch(
    `/${pageId}?fields=instagram_business_account`,
    pageToken
  );
  const igId = pageData.instagram_business_account?.id;
  if (!igId) throw new Error("No Instagram business account linked to this Facebook Page");

  const accountData = await metaFetch(
    `/${igId}?fields=followers_count,username`,
    pageToken
  );

  const metricsToFetch = ["impressions", "reach", "profile_views"].join(",");
  const insightsData = await metaFetch(
    `/${igId}/insights?metric=${metricsToFetch}&period=day&since=${startDate}&until=${endDate}`,
    pageToken
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

// ─── YouTube Public Data API ──────────────────────────────────────────────────
async function getYouTubeData(channelId, year, month) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const { startDate, endDate } = getMonthRange(year, month);

  // Channel stats (public)
  const channelRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`
  );
  if (!channelRes.ok) {
    const err = await channelRes.json();
    throw new Error(err.error?.message || `HTTP ${channelRes.status}`);
  }
  const channelData = await channelRes.json();
  const item = channelData.items?.[0];
  if (!item) throw new Error("Channel not found");

  const stats = item.statistics || {};
  const channelName = item.snippet?.title || "";

  // Videos published this month
  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&type=video&publishedAfter=${startDate}T00:00:00Z&publishedBefore=${endDate}T23:59:59Z&maxResults=50&key=${apiKey}`
  );
  const searchData = await searchRes.json();
  const videoIds = (searchData.items || []).map((v) => v.id.videoId).filter(Boolean);

  let monthViews = 0;
  let monthLikes = 0;
  let monthComments = 0;

  if (videoIds.length > 0) {
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(",")}&key=${apiKey}`
    );
    const videosData = await videosRes.json();
    for (const video of videosData.items || []) {
      monthViews    += parseInt(video.statistics?.viewCount || 0);
      monthLikes    += parseInt(video.statistics?.likeCount || 0);
      monthComments += parseInt(video.statistics?.commentCount || 0);
    }
  }

  return {
    channel_name: channelName,
    subscribers: parseInt(stats.subscriberCount || 0),
    total_views: parseInt(stats.viewCount || 0),
    total_videos: parseInt(stats.videoCount || 0),
    month_videos_published: videoIds.length,
    month_views: monthViews,
    month_likes: monthLikes,
    month_comments: monthComments,
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

      // Instagram via Facebook Page link
      try {
        results.instagram = await getInstagramData(config.facebook_page_id, year, month);
      } catch (e) {
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

    const fb  = results.facebook  || {};
    const ig  = results.instagram || {};
    const yt  = results.youtube   || {};

    // Flat keys that match DEPT_FIELDS social form fields in the admin panel
    const socialData = {
      // Flat display fields
      total_reach:      (fb.reach || 0) + (ig.reach || 0),
      total_engagement: (fb.post_engagements || 0),
      new_followers:    (fb.new_followers || 0) + (ig.new_followers || 0),
      fb_followers:     fb.followers || 0,
      ig_followers:     ig.followers || 0,
      yt_followers:     yt.subscribers || 0,
      website_clicks:   fb.page_views || 0,
      posts_published:  0,   // manual — API doesn't provide this reliably
      videos_published: yt.month_videos_published || 0,
      top_video:        "",  // manual
      top_video_views:  yt.month_views || 0,

      // Raw nested data preserved for reference / future use
      _facebook:  fb,
      _instagram: ig,
      _youtube:   yt,
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
