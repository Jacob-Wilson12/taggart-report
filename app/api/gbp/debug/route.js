import { google } from "googleapis";

function getOAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    "https://taggart-report.vercel.app/api/auth/callback"
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_GBP_REFRESH_TOKEN,
  });
  return oauth2Client;
}

export async function GET(request) {
  try {
    const auth = getOAuthClient();
    const { token: accessToken } = await auth.getAccessToken();

    // Test 1: Try the performance API with Juneau Auto Mall location ID
    const locationId = "525323113139353638";
    const url = `https://mybusinessperformance.googleapis.com/v1/locations/${locationId}:getDailyMetricsTimeSeries?dailyRange.startDate.year=2026&dailyRange.startDate.month=2&dailyRange.startDate.day=1&dailyRange.endDate.year=2026&dailyRange.endDate.month=2&dailyRange.endDate.day=28&dailyMetrics=WEBSITE_CLICKS&dailyMetrics=CALL_CLICKS`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const rawText = await response.text();

    // Test 2: Also try the business info API to verify location access
    const infoUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/locations/${locationId}?readMask=name,title`;
    const infoResponse = await fetch(infoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const infoText = await infoResponse.text();

    return Response.json({
      access_token_obtained: !!accessToken,
      performance_api: {
        status: response.status,
        raw: rawText.substring(0, 500),
      },
      info_api: {
        status: infoResponse.status,
        raw: infoText.substring(0, 500),
      },
    });

  } catch (err) {
    return Response.json({ error: err.message });
  }
}
