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

    // Check token info to see what scopes it has
    const tokenInfoRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`
    );
    const tokenInfo = await tokenInfoRes.json();

    return Response.json({
      token_length: accessToken?.length,
      token_info: tokenInfo,
    });
  } catch (err) {
    return Response.json({ error: err.message });
  }
}
