import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getGoogleAuth() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
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

    const { data: integration, error: intErr } = await supabase
      .from("client_integrations")
      .select("config")
      .eq("client_id", clientId)
      .eq("platform", "search_console")
      .single();

    if (intErr || !integration) {
      return Response.json(
        { error: "No Search Console integration found for this client." },
        { status: 404 }
      );
    }

    const siteUrl = integration.config.site_url;
    const { startDate, endDate } = getMonthRange(year, month);

    const auth = getGoogleAuth();
    const authClient = await auth.getClient();
    const sc = google.searchconsole({ version: "v1", auth: authClient });

    // ─── Query 1: Overall performance ───
    const overallRes = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: [],
        rowLimit: 1,
      },
    });

    const overall = overallRes.data.rows?.[0] || {};
    const totalImpressions = Math.round(overall.impressions || 0);
    const avgCtr = overall.ctr ? Math.round(overall.ctr * 10000) / 100 : 0;
    const avgPosition = overall.position ? Math.round(overall.position * 10) / 10 : null;

    // ─── Query 2: Top 10 queries by clicks ───
    const queriesRes = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: 10,
        orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
      },
    });

    const topQueries = (queriesRes.data.rows || []).map((r) => ({
      query: r.keys[0],
      clicks: Math.round(r.clicks),
      impressions: Math.round(r.impressions),
      ctr: Math.round(r.ctr * 10000) / 100,
      position: Math.round(r.position * 10) / 10,
    }));

    // ─── Query 3: Page 1 keywords (position <= 10, min 10 impressions) ───
    const allQueriesRes = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: 5000,
        orderBy: [{ fieldName: "impressions", sortOrder: "DESCENDING" }],
      },
    });

    const page1Keywords = (allQueriesRes.data.rows || []).filter(
      (r) => r.position <= 10 && r.impressions >= 10
    ).length;

    // ─── Query 4: Top page by clicks ───
    const pagesRes = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["page"],
        rowLimit: 5,
        orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
      },
    });

    const topPage = pagesRes.data.rows?.[0]?.keys?.[0] || null;
    const topQuery = topQueries[0]?.query || null;

    const seoData = {
      impressions: totalImpressions,
      ctr: avgCtr,
      avg_position: avgPosition,
      page1_keywords: page1Keywords,
      top_query: topQuery,
      top_queries: topQueries,
      top_page: topPage,
      _source: "search_console",
      _pulled_at: new Date().toISOString(),
      _date_range: { startDate, endDate },
    };

    // ─── Auto-save to report_data if ?save=true ───
    const autoSave = searchParams.get("save") === "true";
    if (autoSave) {
      const monthStr = `${year}-${String(month).padStart(2, "0")}-01`;

      const { data: existing } = await supabase
        .from("report_data")
        .select("data")
        .eq("client_id", clientId)
        .eq("month", monthStr)
        .eq("department", "seo")
        .single();

      // API fills its fields; manual fields are preserved if already entered
      const merged = {
        ...(existing?.data || {}),
        impressions: seoData.impressions,
        ctr: seoData.ctr,
        avg_position: seoData.avg_position,
        page1_keywords: seoData.page1_keywords,
        top_query: seoData.top_query,
        top_queries: seoData.top_queries,
        top_page: seoData.top_page,
        _source: seoData._source,
        _pulled_at: seoData._pulled_at,
        _date_range: seoData._date_range,
      };

      const { error: saveErr } = await supabase.from("report_data").upsert(
        {
          client_id: parseInt(clientId),
          month: monthStr,
          department: "seo",
          data: merged,
          last_updated_at: new Date().toISOString(),
        },
        { onConflict: "client_id,month,department" }
      );

      if (saveErr) {
        return Response.json({
          success: true,
          saved: false,
          save_error: saveErr.message,
          data: seoData,
        });
      }

      return Response.json({
        success: true,
        saved: true,
        client_id: clientId,
        site_url: siteUrl,
        period: { startDate, endDate },
        data: seoData,
      });
    }

    return Response.json({
      success: true,
      saved: false,
      client_id: clientId,
      site_url: siteUrl,
      period: { startDate, endDate },
      data: seoData,
    });

  } catch (err) {
    console.error("Search Console API error:", err);
    return Response.json(
      { error: err.message, details: err.errors || null },
      { status: 500 }
    );
  }
}
