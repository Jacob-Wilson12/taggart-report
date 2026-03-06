import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  "https://taggart-report.vercel.app/api/auth/callback"
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return new Response(`
      <html><body style="font-family:sans-serif;padding:40px;">
        <h2 style="color:red;">❌ Authorization Failed</h2>
        <p>${error}</p>
      </body></html>
    `, { headers: { "Content-Type": "text/html" } });
  }

  if (!code) {
    return new Response(`
      <html><body style="font-family:sans-serif;padding:40px;">
        <h2 style="color:red;">❌ No authorization code received</h2>
      </body></html>
    `, { headers: { "Content-Type": "text/html" } });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    return new Response(`
      <html><body style="font-family:sans-serif;padding:40px;max-width:800px;">
        <h2 style="color:green;">✅ Authorization Successful!</h2>
        <p>Copy the refresh token below and add it to Vercel as <strong>GOOGLE_GBP_REFRESH_TOKEN</strong></p>
        <div style="background:#f0f0f0;padding:16px;border-radius:8px;word-break:break-all;font-family:monospace;font-size:13px;margin:16px 0;">
          ${tokens.refresh_token}
        </div>
        <p style="color:#666;font-size:13px;">Access token (expires in 1 hour — you don't need this):<br/>
        <span style="font-family:monospace;font-size:11px;">${tokens.access_token}</span></p>
        <hr/>
        <p style="color:#666;font-size:13px;">Once you've added the refresh token to Vercel, GBP data pulls will work automatically.</p>
      </body></html>
    `, { headers: { "Content-Type": "text/html" } });

  } catch (err) {
    return new Response(`
      <html><body style="font-family:sans-serif;padding:40px;">
        <h2 style="color:red;">❌ Token Exchange Failed</h2>
        <p>${err.message}</p>
      </body></html>
    `, { headers: { "Content-Type": "text/html" } });
  }
}
