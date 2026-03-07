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

export async function GET() {
  try {
    const auth = getOAuthClient();
    const { token: accessToken } = await auth.getAccessToken();

    const customerId = "4785711849";
    const mccId = process.env.GOOGLE_ADS_MCC_ID;
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const query = `SELECT metrics.impressions, metrics.clicks, metrics.cost_micros FROM customer WHERE segments.date BETWEEN '2026-02-01' AND '2026-02-28'`;

    const results = { token_length: accessToken?.length };

    for (const version of ["v16", "v17", "v18", "v19"]) {
      const url = `https://googleads.googleapis.com/${version}/customers/${customerId}/googleAds:search`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "developer-token": devToken,
            "login-customer-id": mccId,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        });
        const text = await res.text();
        results[version] = `${res.status}: ${text.substring(0, 200)}`;
      } catch (e) {
        results[version] = `ERROR: ${e.message}`;
      }
    }

    return Response.json(results);
  } catch (err) {
    return Response.json({ error: err.message });
  }
}
