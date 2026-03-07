export async function GET(request) {
  const pageId = "104250745937907"; // Juneau Auto Mall
  const accessToken = process.env.META_ADS_ACCESS_TOKEN;
  const results = {};

  // First get page token
  const pageTokenRes = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}?fields=access_token&access_token=${accessToken}`
  );
  const pageTokenData = await pageTokenRes.json();
  const pageToken = pageTokenData.access_token;
  results.page_token_obtained = !!pageToken;
  results.page_token_error = pageTokenData.error?.message;

  if (!pageToken) {
    return Response.json(results);
  }

  // Test each metric individually
  const metrics = [
    "page_impressions",
    "page_impressions_unique",
    "page_engaged_users",
    "page_post_engagements",
    "page_daily_follows_unique",
    "page_follows",
    "page_fan_adds",
    "page_views_total",
  ];

  for (const metric of metrics) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/insights?metric=${metric}&period=day&since=2026-02-01&until=2026-02-28&access_token=${pageToken}`
      );
      const data = await res.json();
      results[metric] = data.error ? `ERROR: ${data.error.message}` : `OK (${data.data?.length} days)`;
    } catch (e) {
      results[metric] = `EXCEPTION: ${e.message}`;
    }
  }

  return Response.json(results);
}
