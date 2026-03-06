import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

// ─── Supabase admin client (uses service role for server-side access) ───
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Build Google Auth from service account JSON stored in env ───
function getGoogleAuth() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
}

// ─── Get first and last day of a given month ───
function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // last day of month
  const fmt = (d) => d.toISOString().split("T")[0];
  return { startDate: fmt(start), endDate: fmt(end) };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");
    const year = parseInt(searchParams.get("year"));
    const month = parseInt(searchParams.get("month")); // 1-12

    if (!clientId || !year || !month) {
      return Response.json(
        { error: "Missing required params: client_id, year, month" },
        { status: 400 }
      );
    }

    // ─── Look up the site URL for this client ───
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

    // ─── Authenticate ───
    const auth = getGoogleAuth();
    const authClient = await auth.getClient();
    const sc = google.searchconsole({ version: "v1", auth: authClient });

    // ─── Query 1: Overall performance (impressions, clicks, CTR, position) ───
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
    const totalClicks = Math.round(overall.clicks || 0);
    const totalImpressions = Math.round(overall.impressions || 0);
    const avgCtr = overall.ctr ? Math.round(overall.ctr * 10000) / 100 : 0; // as percentage
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

    // ─── Query 3: Page 1 keywords (avg position <= 10) ───
    const page1Res = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: 1000,
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: "query",
                operator: "notContains",
                expression: "", // get all
              },
            ],
          },
        ],
      },
    });

    const page1Keywords = (page1Res.data.rows || []).filter(
      (r) => r.position <= 10
    ).length;

    // ─── Query 4: Top performing page (most clicks) ───
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

    // ─── Build the SEO data object matching report_data schema ───
    const seoData = {
      // Core metrics
      impressions: totalImpressions,
      ctr: avgCtr,
      avg_position: avgPosition,
      page1_keywords: page1Keywords,

      // Top query (shown in dashboard highlight)
      top_query: topQuery,

      // Top queries array (for SEO detail page table)
      top_queries: topQueries,

      // Top page
      top_page: topPage,

      // Meta
      _source: "search_console",
      _pulled_at: new Date().toISOString(),
      _date_range: { startDate, endDate },
    };

    // ─── Optionally auto-save to report_data ───
    const autoSave = searchParams.get("save") === "true";
    if (autoSave) {
      const monthStr = `${year}-${String(month).padStart(2, "0")}-01`;

      // Load existing SEO row so we don't overwrite manually entered fields
      const { data: existing } = await supabase
        .from("report_data")
        .select("data")
        .eq("client_id", clientId)
        .eq("month", monthStr)
        .eq("department", "seo")
        .single();

      const merged = {
        ...(existing?.data || {}),
        ...seoData,
        // Preserve manually entered fields if they exist
        phone_calls: existing?.data?.phone_calls ?? null,
        form_submissions: existing?.data?.form_submissions ?? null,
        vdp_views: existing?.data?.vdp_views ?? null,
        direction_requests: existing?.data?.direction_requests ?? null,
        chat_conversations: existing?.data?.chat_conversations ?? null,
        organic_sessions: existing?.data?.organic_sessions ?? null,
        work_completed: existing?.data?.work_completed ?? null,
        wins: existing?.data?.wins ?? null,
        losses: existing?.data?.losses ?? null,
        next_month: existing?.data?.next_month ?? null,
      };

      await supabase.from("report_data").upsert(
        {
          client_id: parseInt(clientId),
          month: monthStr,
          department: "seo",
          data: merged,
          last_updated_at: new Date().toISOString(),
        },
        { onConflict: "client_id,month,department" }
      );
    }

    return Response.json({
      success: true,
      client_id: clientId,
      site_url: siteUrl,
      period: { startDate, endDate },
      data: seoData,
    });
  } catch (err) {
    console.error("Search Console API error:", err);
    return Response.json(
      {
        error: err.message,
        details: err.errors || null,
      },
      { status: 500 }
    );
  }
}
