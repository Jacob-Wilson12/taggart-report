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
  return {
    startDate: { year: start.getFullYear(), month: start.getMonth() + 1, day: start.getDate() },
    endDate: { year: end.getFullYear(), month: end.getMonth() + 1, day: end.getDate() },
  };
}

async function fetchLocationMetrics(accessToken, locationId, startDate, endDate) {
  const metrics = [
    "WEBSITE_CLICKS",
    "CALL_CLICKS",
    "BUSINESS_DIRECTION_REQUESTS",
    "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
    "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
    "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
    "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  ];

  const params = new URLSearchParams();
  params.append("dailyRange.startDate.year", startDate.year);
  params.append("dailyRange.startDate.month", startDate.month);
  params.append("dailyRange.startDate.day", startDate.day);
  params.append("dailyRange.endDate.year", endDate.year);
  params.append("dailyRange.endDate.month", endDate.month);
  params.append("dailyRange.endDate.day", endDate.day);
  metrics.forEach(m => params.append("dailyMetrics", m));

  const url = `https://mybusinessperformance.googleapis.com/v1/locations/${locationId}:getDailyMetricsTimeSeries?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const timeSeries = data.multiDailyMetricTimeSeries || [];

  const metricMap = {
    WEBSITE_CLICKS: "website_clicks",
    CALL_CLICKS: "call_clicks",
    BUSINESS_DIRECTION_REQUESTS: "direction_requests",
    BUSINESS_IMPRESSIONS_DESKTOP_MAPS: "impressions_desktop_maps",
    BUSINESS_IMPRESSIONS_DESKTOP_SEARCH: "impressions_desktop_search",
    BUSINESS_IMPRESSIONS_MOBILE_MAPS: "impressions_mobile_maps",
    BUSINESS_IMPRESSIONS_MOBILE_SEARCH: "impressions_mobile_search",
  };

  const totals = {
    website_clicks: 0,
    call_clicks: 0,
    direction_requests: 0,
    impressions_desktop_maps: 0,
    impressions_desktop_search: 0,
    impressions_mobile_maps: 0,
    impressions_mobile_search: 0,
  };

  for (const series of timeSeries) {
    const metricKey = metricMap[series.dailyMetric];
    if (!metricKey) continue;
    const values = series.timeSeries?.datedValues || [];
    totals[metricKey] = values.reduce((sum, v) => sum + (Number(v.value) || 0), 0);
  }

  totals.total_impressions =
    totals.impressions_desktop_maps +
    totals.impressions_desktop_search +
    totals.impressions_mobile_maps +
    totals.impressions_mobile_search;

  return totals;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");
    const year = parseInt(searchParams.get("year"));
    const month = parseInt(searchParams.get("month"));

    if (!clientId || !year || !month) {
      return Response.json({ error: "Missing required params: client_id, year, month" }, { status: 400 });
    }

    const { data: integration, error: intErr } = await supabase
      .from("client_integrations")
      .select("config")
      .eq("client_id", clientId)
      .eq("platform", "gbp")
      .single();

    if (intErr || !integration) {
      return Response.json({ error: "No GBP integration found for this client." }, { status: 404 });
    }

    const locations = integration.config.locations || [];
    if (locations.length === 0) {
      return Response.json({ error: "No GBP locations configured for this client." }, { status: 404 });
    }

    const auth = getOAuthClient();
    const { token: accessToken } = await auth.getAccessToken();
    const { startDate, endDate } = getMonthRange(year, month);

    const locationResults = [];
    for (const location of locations) {
      try {
        const metrics = await fetchLocationMetrics(accessToken, location.id, startDate, endDate);
        locationResults.push({ label: location.label, id: location.id, metrics });
      } catch (e) {
        locationResults.push({ label: location.label, id: location.id, error: e.message });
      }
    }

    const aggregate = { website_clicks: 0, call_clicks: 0, direction_requests: 0, total_impressions: 0 };
    for (const loc of locationResults) {
      if (loc.metrics) {
        aggregate.website_clicks     += loc.metrics.website_clicks || 0;
        aggregate.call_clicks        += loc.metrics.call_clicks || 0;
        aggregate.direction_requests += loc.metrics.direction_requests || 0;
        aggregate.total_impressions  += loc.metrics.total_impressions || 0;
      }
    }

    const gbpData = {
      website_clicks: aggregate.website_clicks,
      call_clicks: aggregate.call_clicks,
      direction_requests: aggregate.direction_requests,
      total_impressions: aggregate.total_impressions,
      locations: locationResults,
      _source: "gbp",
      _pulled_at: new Date().toISOString(),
      _date_range: {
        startDate: `${startDate.year}-${String(startDate.month).padStart(2,"0")}-${String(startDate.day).padStart(2,"0")}`,
        endDate: `${endDate.year}-${String(endDate.month).padStart(2,"0")}-${String(endDate.day).padStart(2,"0")}`,
      },
    };

    const autoSave = searchParams.get("save") === "true";
    if (autoSave) {
      const monthStr = `${year}-${String(month).padStart(2, "0")}-01`;

      const { data: existingSeo } = await supabase
        .from("report_data").select("data")
        .eq("client_id", clientId).eq("month", monthStr).eq("department", "seo").single();

      const mergedSeo = {
        ...(existingSeo?.data || {}),
        direction_requests: gbpData.direction_requests,
        _gbp_pulled_at: gbpData._pulled_at,
      };

      await supabase.from("report_data").upsert(
        { client_id: parseInt(clientId), month: monthStr, department: "seo", data: mergedSeo, last_updated_at: new Date().toISOString() },
        { onConflict: "client_id,month,department" }
      );

      const { data: existingGbp } = await supabase
        .from("report_data").select("data")
        .eq("client_id", clientId).eq("month", monthStr).eq("department", "gbp").single();

      const mergedGbp = { ...(existingGbp?.data || {}), ...gbpData };

      const { error: saveErr } = await supabase.from("report_data").upsert(
        { client_id: parseInt(clientId), month: monthStr, department: "gbp", data: mergedGbp, last_updated_at: new Date().toISOString() },
        { onConflict: "client_id,month,department" }
      );

      if (saveErr) {
        return Response.json({ success: true, saved: false, save_error: saveErr.message, data: gbpData });
      }

      return Response.json({ success: true, saved: true, client_id: clientId, data: gbpData });
    }

    return Response.json({ success: true, saved: false, client_id: clientId, data: gbpData });

  } catch (err) {
    console.error("GBP API error:", err);
    return Response.json({ error: err.message, details: err.errors || null }, { status: 500 });
  }
}
