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

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  return response.json();
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
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversion_rate,
        metrics.cost_per_conversion
      FROM customer
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    `;

    const summaryData = await runGadsQuery(accessToken, customerId, mccId, summaryQuery);
    const summaryRow = summaryData.results?.[0];

    const impressions      = Number(summaryRow?.metrics?.impressions || 0);
    const clicks           = Number(summaryRow?.metrics?.clicks || 0);
    const costMicros       = Number(summaryRow?.metrics?.costMicros || 0);
    const conversions      = Math.round(Number(summaryRow?.metrics?.conversions || 0) * 10) / 10;
    const ctr              = Math.round(Number(summaryRow?.metrics?.ctr || 0) * 10000) / 100;
    const avgCpc           = Math.round(costMicros / (clicks || 1) / 10000) / 100;
    const spend            = Math.round(costMicros / 1000000 * 100) / 100;
    const costPerConversion = conversions > 0 ? Math.round(spend / conversions * 100) / 100 : 0;
    const conversionRate   = clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0;

    // ─── Query 2: Top campaigns ───
    const campaignQuery = `
      SELECT
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status = 'ENABLED'
      ORDER BY metrics.cost_micros DESC
      LIMIT 10
    `;

    const campaignData = await runGadsQuery(accessToken, customerId, mccId, campaignQuery);
    const topCampaigns = (campaignData.results || []).map(row => ({
      name: row.campaign?.name,
      impressions: Number(row.metrics?.impressions || 0),
      clicks: Number(row.metrics?.clicks || 0),
      spend: Math.round(Number(row.metrics?.costMicros || 0) / 1000000 * 100) / 100,
      conversions: Math.round(Number(row.metrics?.conversions || 0) * 10) / 10,
      ctr: Math.round(Number(row.metrics?.ctr || 0) * 10000) / 100,
    }));

    // ─── Query 3: Search terms performance ───
    const searchTermQuery = `
      SELECT
        search_term_view.search_term,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions
      FROM search_term_view
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY metrics.clicks DESC
      LIMIT 10
    `;

    let topSearchTerms = [];
    try {
      const searchTermData = await runGadsQuery(accessToken, customerId, mccId, searchTermQuery);
      topSearchTerms = (searchTermData.results || []).map(row => ({
        term: row.searchTermView?.searchTerm,
        impressions: Number(row.metrics?.impressions || 0),
        clicks: Number(row.metrics?.clicks || 0),
        conversions: Math.round(Number(row.metrics?.conversions || 0) * 10) / 10,
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
      conversions,
      ctr,
      avg_cpc: avgCpc,
      cost_per_conversion: costPerConversion,
      conversion_rate: conversionRate,

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
