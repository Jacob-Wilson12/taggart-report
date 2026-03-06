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

    // Step 1: List all accounts
    const accountsRes = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const accountsData = await accountsRes.json();

    if (!accountsRes.ok) {
      return Response.json({ error: "Failed to list accounts", details: accountsData });
    }

    const accounts = accountsData.accounts || [];
    const result = [];

    // Step 2: For each account, list locations
    for (const account of accounts) {
      const locRes = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,storefrontAddress`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const locData = await locRes.json();

      result.push({
        account_name: account.name,
        account_account_name: account.accountName,
        account_type: account.type,
        locations_status: locRes.status,
        locations: locData.locations || [],
        locations_error: locData.error || null,
      });
    }

    return Response.json({ accounts_found: accounts.length, accounts: result });

  } catch (err) {
    return Response.json({ error: err.message });
  }
}
