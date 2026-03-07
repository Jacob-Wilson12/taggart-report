import { google } from "googleapis";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const test = searchParams.get("test") || "facebook";
  const results = {};

  // ─── Test Facebook metrics one at a time ───
  if (test === "facebook") {
    const pageId = "104250745937907"; // Juneau Auto Mall
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    const metrics = [
      "page_impressions",
      "page_impressions_unique", 
      "page_engaged_users",
      "page_post_engagements",
      "page_fan_adds_unique",
      "page_fans",
      "page_views_total",
    ];

    for (const metric of metrics) {
      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${pageId}/insights?metric=${metric}&period=day&since=2026-02-01&until=2026-02-28&access_token=${accessToken}`
        );
        const data = await res.json();
        results[metric] = data.error ? `ERROR: ${data.error.message}` : "OK";
      } catch (e) {
        results[metric] = `EXCEPTION: ${e.message}`;
      }
    }
  }

  // ─── Test YouTube access ───
  if (test === "youtube") {
    const channelId = "UCL7Gtmvc1eNQPBMl5IBpOrA"; // Juneau Auto Mall
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET
      );
      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_GBP_REFRESH_TOKEN,
      });

      const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth: oauth2Client });
      const res = await youtubeAnalytics.reports.query({
        ids: `channel==${channelId}`,
        startDate: "2026-02-01",
        endDate: "2026-02-28",
        metrics: "views",
      });
      results.youtube = { success: true, data: res.data };
    } catch (e) {
      results.youtube = { error: e.message, code: e.code };
    }

    // Also test token scopes
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET
      );
      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_GBP_REFRESH_TOKEN,
      });
      const { token } = await oauth2Client.getAccessToken();
      const tokenInfo = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`);
      results.token_scopes = await tokenInfo.json();
    } catch (e) {
      results.token_scopes = { error: e.message };
    }
  }

  return Response.json(results);
}
