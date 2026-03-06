import { createClient } from "@supabase/supabase-js";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getCredentials() {
  return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
}

function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const fmt = (d) => d.toISOString().split("T")[0];
  return { startDate: fmt(start), endDate: fmt(end) };
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

    // ─── Look up GA4 property ID ───
    const { data: integration, error: intErr } = await supabase
      .from("client_integrations")
      .select("config")
      .eq("client_id", clientId)
      .eq("platform", "ga4")
      .single();

    if (intErr || !integration) {
      return Response.json(
        { error: "No GA4 integration found for this client." },
        { status: 404 }
      );
    }

    const propertyId = integration.config.property_id;
    const { startDate, endDate } = getMonthRange(year, month);

    const credentials = getCredentials();
    const analyticsClient = new BetaAnalyticsDataClient({ credentials });

    // ─── Query 1: Core metrics ───
    const [coreReport] = await analyticsClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "sessions" },
        { name: "newUsers" },
        { name: "screenPageViews" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
    });

    const coreRow = coreReport.rows?.[0]?.metricValues || [];
    const totalSessions      = Math.round(Number(coreRow[0]?.value || 0));
    const newUsers           = Math.round(Number(coreRow[1]?.value || 0));
    const pageViews          = Math.round(Number(coreRow[2]?.value || 0));
    const bounceRate         = Math.round(Number(coreRow[3]?.value || 0) * 100) / 100;
    const avgSessionDuration = Math.round(Number(coreRow[4]?.value || 0));

    // ─── Query 2: Organic sessions by channel ───
    const [channelReport] = await analyticsClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    });

    const channelBreakdown = (channelReport.rows || []).map(row => ({
      channel: row.dimensionValues[0]?.value,
      sessions: Math.round(Number(row.metricValues[0]?.value || 0)),
    }));

    const organicRow = channelBreakdown.find(c =>
      c.channel?.toLowerCase().includes("organic")
    );
    const organicSessions = organicRow?.sessions || 0;

    // ─── Query 3: VDP views ───
    const [vdpReport] = await analyticsClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      dimensionFilter: {
        orGroup: {
          expressions: [
            { filter: { fieldName: "pagePath", stringFilter: { matchType: "CONTAINS", value: "/vdp/" } } },
            { filter: { fieldName: "pagePath", stringFilter: { matchType: "CONTAINS", value: "/vehicle/" } } },
            { filter: { fieldName: "pagePath", stringFilter: { matchType: "CONTAINS", value: "/inventory/" } } },
          ],
        },
      },
      limit: 100,
    });

    const vdpViews = (vdpReport.rows || []).reduce(
      (sum, row) => sum + Math.round(Number(row.metricValues[0]?.value || 0)), 0
    );

    // ─── Query 4: Form/lead events ───
    const [formReport] = await analyticsClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        orGroup: {
          expressions: [
            { filter: { fieldName: "eventName", stringFilter: { matchType: "CONTAINS", value: "form" } } },
            { filter: { fieldName: "eventName", stringFilter: { matchType: "CONTAINS", value: "lead" } } },
            { filter: { fieldName: "eventName", stringFilter: { matchType: "CONTAINS", value: "contact" } } },
            { filter: { fieldName: "eventName", stringFilter: { matchType: "CONTAINS", value: "submit" } } },
          ],
        },
      },
    });

    const formSubmissions = (formReport.rows || []).reduce(
      (sum, row) => sum + Math.round(Number(row.metricValues[0]?.value || 0)), 0
    );

    // ─── Query 5: Top pages ───
    const [pagesReport] = await analyticsClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 5,
    });

    const topPages = (pagesReport.rows || []).map(row => ({
      path: row.dimensionValues[0]?.value,
      title: row.dimensionValues[1]?.value,
      sessions: Math.round(Number(row.metricValues[0]?.value || 0)),
      pageViews: Math.round(Number(row.metricValues[1]?.value || 0)),
    }));

    // ─── Build GA4 data object ───
    const ga4Data = {
      total_sessions: totalSessions,
      organic_sessions: organicSessions,
      new_users: newUsers,
      page_views: pageViews,
      bounce_rate: bounceRate,
      avg_session_duration: avgSessionDuration,
      vdp_views: vdpViews,
      form_submissions: formSubmissions,
      top_pages: topPages,
      channel_breakdown: channelBreakdown,
      _source: "ga4",
      _pulled_at: new Date().toISOString(),
      _date_range: { startDate, endDate },
    };

    // ─── Auto-save if ?save=true ───
    const autoSave = searchParams.get("save") === "true";
    if (autoSave) {
      const monthStr = `${year}-${String(month).padStart(2, "0")}-01`;

      // Merge organic sessions, VDP views, form submissions into SEO row
      const { data: existingSeo } = await supabase
        .from("report_data")
        .select("data")
        .eq("client_id", clientId)
        .eq("month", monthStr)
        .eq("department", "seo")
        .single();

      const mergedSeo = {
        ...(existingSeo?.data || {}),
        organic_sessions: ga4Data.organic_sessions,
        vdp_views: ga4Data.vdp_views,
        form_submissions: ga4Data.form_submissions,
        _ga4_pulled_at: ga4Data._pulled_at,
      };

      await supabase.from("report_data").upsert(
        {
          client_id: parseInt(clientId),
          month: monthStr,
          department: "seo",
          data: mergedSeo,
          last_updated_at: new Date().toISOString(),
        },
        { onConflict: "client_id,month,department" }
      );

      // Save full GA4 data to ga4 department row
      const { data: existingGa4 } = await supabase
        .from("report_data")
        .select("data")
        .eq("client_id", clientId)
        .eq("month", monthStr)
        .eq("department", "ga4")
        .single();

      const mergedGa4 = { ...(existingGa4?.data || {}), ...ga4Data };

      const { error: saveErr } = await supabase.from("report_data").upsert(
        {
          client_id: parseInt(clientId),
          month: monthStr,
          department: "ga4",
          data: mergedGa4,
          last_updated_at: new Date().toISOString(),
        },
        { onConflict: "client_id,month,department" }
      );

      if (saveErr) {
        return Response.json({ success: true, saved: false, save_error: saveErr.message, data: ga4Data });
      }

      return Response.json({
        success: true,
        saved: true,
        client_id: clientId,
        property_id: propertyId,
        period: { startDate, endDate },
        data: ga4Data,
      });
    }

    return Response.json({
      success: true,
      saved: false,
      client_id: clientId,
      property_id: propertyId,
      period: { startDate, endDate },
      data: ga4Data,
    });

  } catch (err) {
    console.error("GA4 API error:", err);
    return Response.json(
      { error: err.message, details: err.errors || null },
      { status: 500 }
    );
  }
}
