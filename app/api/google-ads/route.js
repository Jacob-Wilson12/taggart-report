import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { startDate: fmt(start), endDate: fmt(end) };
}

async function runGadsQuery(accessToken, customerId, mccId, query) {
  const url = `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      "login-customer-id": mccId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const text = await response.text();
  if (!response.ok) {
    let msg = `HTTP ${response.status}`;
    try { 
      const parsed = JSON.parse(text);
      msg = parsed?.error?.message || parsed?.[0]?.error?.message || msg; 
    } catch {}
    throw new Error(msg);
  }
  return JSON.parse(text);
}

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

    // ─── Look up Google Ads customer ID ───
    const { data: integration, error: intErr } = await supabase
      .from("client_integrations")
      .select("config")
      .eq("client_id", clientId)
      .eq("platform", "google_ads")
      .single();

    if (intErr || !integration) {
      return Response.json({ error: "No Google Ads integration found for this client." }, { status: 404 });
    }

    const customerId = integration.config.customer_id;
    const mccId = process.env.GOOGLE_ADS_MCC_ID;
    const { startDate, endDate } = getMonthRange(year, month);

    const auth = getOAuthClient();
    const { token: accessToken } = await auth.getAccessToken();

    // ─── Query 1: Campaign performance summary ───
    const summaryQuery = `
      SELECT
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros
      FROM customer
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    `;

    let summaryData;
    try {
      summaryData = await runGadsQuery(accessToken, customerId, mccId, summaryQuery);
    } catch (e) {
      return Response.json({ 
        error: `Summary query failed: ${e.message}`, 
        customer_id: customerId, 
        customer_id_type: typeof customerId,
        customer_id_length: String(customerId).length,
        mcc_id: mccId,
        url_used: `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`
      });
    }
    const summaryRow = summaryData.results?.[0];

    const impressions      = Number(summaryRow?.metrics?.impressions || 0);
    const clicks           = Number(summaryRow?.metrics?.clicks || 0);
    const costMicros       = Number(summaryRow?.metrics?.costMicros || 0);
    const avgCpc           = Math.round(costMicros / (clicks || 1) / 10000) / 100;
    const spend            = Math.round(costMicros / 1000000 * 100) / 100;


    // ─── Query 2: Top campaigns ───
    const campaignQuery = `
      SELECT
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY metrics.cost_micros DESC
      LIMIT 10
    `;

    let topCampaigns = [];
    try {
      const campaignData = await runGadsQuery(accessToken, customerId, mccId, campaignQuery);
      topCampaigns = (campaignData.results || []).map(row => ({
        name: row.campaign?.name,
        impressions: Number(row.metrics?.impressions || 0),
        clicks: Number(row.metrics?.clicks || 0),
        spend: Math.round(Number(row.metrics?.costMicros || 0) / 1000000 * 100) / 100,
      }));
    } catch (e) {
      topCampaigns = [];
    }

    // ─── Query 3: Search terms performance ───
    const searchTermQuery = `
      SELECT
        search_term_view.search_term,
        metrics.impressions,
        metrics.clicks
      FROM search_term_view
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      LIMIT 10
    `;

    let topSearchTerms = [];
    try {
      const searchTermData = await runGadsQuery(accessToken, customerId, mccId, searchTermQuery);
      topSearchTerms = (searchTermData.results || []).map(row => ({
        term: row.searchTermView?.searchTerm,
        impressions: Number(row.metrics?.impressions || 0),
        clicks: Number(row.metrics?.clicks || 0),
      }));
    } catch (e) {
      // search terms may not be available on all accounts
      topSearchTerms = [];
    }

    const adsData = {
      // Core metrics
      impressions,
      clicks,
      spend,
      ctr: clicks > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
      avg_cpc: avgCpc,

      // Breakdowns
      top_campaigns: topCampaigns,
      top_search_terms: topSearchTerms,

      // Meta
      _source: "google_ads",
      _pulled_at: new Date().toISOString(),
      _date_range: { startDate, endDate },
    };

    // ─── Auto-save if ?save=true ───
    const autoSave = searchParams.get("save") === "true";
    if (autoSave) {
      const monthStr = `${year}-${String(month).padStart(2, "0")}-01`;

      const { data: existingAds } = await supabase
        .from("report_data")
        .select("data")
        .eq("client_id", clientId)
        .eq("month", monthStr)
        .eq("department", "google_ads")
        .single();

      const mergedAds = { ...(existingAds?.data || {}), ...adsData };

      const { error: saveErr } = await supabase.from("report_data").upsert(
        {
          client_id: parseInt(clientId),
          month: monthStr,
          department: "google_ads",
          data: mergedAds,
          last_updated_at: new Date().toISOString(),
        },
        { onConflict: "client_id,month,department" }
      );

      if (saveErr) {
        return Response.json({ success: true, saved: false, save_error: saveErr.message, data: adsData });
      }

      return Response.json({
        success: true,
        saved: true,
        client_id: clientId,
        customer_id: customerId,
        period: { startDate, endDate },
        data: adsData,
      });
    }

    return Response.json({
      success: true,
      saved: false,
      client_id: clientId,
      customer_id: customerId,
      period: { startDate, endDate },
      data: adsData,
    });

  } catch (err) {
    console.error("Google Ads API error:", err);
    return Response.json({ error: err.message, details: err.errors || null }, { status: 500 });
  }
}
