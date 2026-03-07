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

    const customerId = "4785711849"; // Juneau Auto Mall
    const mccId = process.env.GOOGLE_ADS_MCC_ID;
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

    // Test v17
    const url = `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": devToken,
        "login-customer-id": mccId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `SELECT metrics.impressions, metrics.clicks, metrics.cost_micros FROM customer WHERE segments.date BETWEEN '2026-02-01' AND '2026-02-28'`,
      }),
    });

    const rawText = await response.text();

    return Response.json({
      status: response.status,
      customer_id: customerId,
      mcc_id: mccId,
      dev_token_present: !!devToken,
      access_token_present: !!accessToken,
      token_length: accessToken?.length,
      raw: rawText.substring(0, 800),
    });

  } catch (err) {
    return Response.json({ error: err.message });
  }
}
