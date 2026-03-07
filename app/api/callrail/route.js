import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const fmt = (d) => d.toISOString().split("T")[0];
  return { startDate: fmt(start), endDate: fmt(end) };
}

async function callRailFetch(path) {
  const response = await fetch(`https://api.callrail.com/v3${path}`, {
    headers: {
      Authorization: `Token token=${process.env.CALLRAIL_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ── Map a source_name string to website / ads / gbp / other ──
function classifySource(sourceName) {
  const s = (sourceName || "").toLowerCase();
  if (
    s.includes("website") || s.includes("organic") || s.includes("direct") ||
    s.includes("seo") || s.includes("referral") || s.includes("email")
  ) return "website";
  if (
    s.includes("google ads") || s.includes("paid") || s.includes("ppc") ||
    s.includes("adwords") || s.includes("bing ads") || s.includes("facebook ads") ||
    s.includes("meta ads") || s.includes("display") || s.includes("search ad")
  ) return "ads";
  if (
    s.includes("google business") || s.includes("gbp") ||
    s.includes("google my business") || s.includes("gmb") || s.includes("maps")
  ) return "gbp";
  return "other";
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

    // ─── Look up CallRail company ID ───
    const { data: integration, error: intErr } = await supabase
      .from("client_integrations")
      .select("config")
      .eq("client_id", clientId)
      .eq("platform", "callrail")
      .single();

    if (intErr || !integration) {
      return Response.json(
        { error: "No CallRail integration found for this client." },
        { status: 404 }
      );
    }

    const companyId = integration.config.company_id;
    const { startDate, endDate } = getMonthRange(year, month);

    // ─── Pull all calls for the month ───
    const callsData = await callRailFetch(
      `/a/ACC36d8cf484f1442908d76e394a410a296/calls.json?company_id=${companyId}&start_date=${startDate}&end_date=${endDate}&per_page=250&fields=direction,answered,duration,source_name,first_call`
    );

    const calls = callsData.calls || [];
    const totalCalls      = calls.length;
    const answeredCalls   = calls.filter(c => c.answered).length;
    const missedCalls     = totalCalls - answeredCalls;
    const firstTimeCalls  = calls.filter(c => c.first_call).length;
    const inboundCalls    = calls.filter(c => c.direction === "inbound").length;
    const avgDuration     = calls.length > 0
      ? Math.round(calls.reduce((sum, c) => sum + (Number(c.duration) || 0), 0) / calls.length)
      : 0;

    // ─── Classify calls by source category ───
    let websiteCalls = 0, adsCalls = 0, gbpCalls = 0, otherCalls = 0;
    const sourceMap = {};

    for (const call of calls) {
      const source = call.source_name || "Unknown";
      sourceMap[source] = (sourceMap[source] || 0) + 1;
      const category = classifySource(source);
      if (category === "website") websiteCalls++;
      else if (category === "ads") adsCalls++;
      else if (category === "gbp") gbpCalls++;
      else otherCalls++;
    }

    const callsBySource = Object.entries(sourceMap)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // ─── Pull active tracking numbers ───
    let trackingNumbers = [];
    try {
      const trackersData = await callRailFetch(
        `/a/ACC36d8cf484f1442908d76e394a410a296/trackers.json?company_id=${companyId}&status=active`
      );
      trackingNumbers = (trackersData.trackers || []).map(t => ({
        name: t.name,
        number: t.formatted_tracking_number,
        type: t.type,
        source: t.source_name,
      }));
    } catch (e) {
      trackingNumbers = [];
    }

    // ─── Build the data object using keys that match the admin form ───
    const callrailData = {
      // These keys match DEPT_FIELDS callrail exactly
      total_calls:   totalCalls,
      website_calls: websiteCalls,
      ads_calls:     adsCalls,
      gbp_calls:     gbpCalls,

      // Extra detail saved alongside but not primary form fields
      answered_calls:     answeredCalls,
      missed_calls:       missedCalls,
      first_time_callers: firstTimeCalls,
      inbound_calls:      inboundCalls,
      avg_call_duration:  avgDuration,
      other_calls:        otherCalls,
      calls_by_source:    callsBySource,
      tracking_numbers:   trackingNumbers,

      // Meta
      _source:     "callrail",
      _pulled_at:  new Date().toISOString(),
      _date_range: { startDate, endDate },
    };

    // ─── Auto-save if ?save=true ───
    const autoSave = searchParams.get("save") === "true";
    if (autoSave) {
      const monthStr = `${year}-${String(month).padStart(2, "0")}-01`;

      // ── Merge phone_calls into SEO row, respecting manual overrides ──
      const { data: existingSeo } = await supabase
        .from("report_data")
        .select("data")
        .eq("client_id", clientId)
        .eq("month", monthStr)
        .eq("department", "seo")
        .single();

      const seoOverrides = new Set(existingSeo?.data?._manual_overrides || []);
      const mergedSeo = { ...(existingSeo?.data || {}) };
      if (!seoOverrides.has("phone_calls")) {
        mergedSeo.phone_calls = callrailData.total_calls;
      }
      mergedSeo._callrail_pulled_at = callrailData._pulled_at;

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

      // ── Save CallRail row, respecting manual overrides ──
      const { data: existingCr } = await supabase
        .from("report_data")
        .select("data")
        .eq("client_id", clientId)
        .eq("month", monthStr)
        .eq("department", "callrail")
        .single();

      const manualOverrides = new Set(existingCr?.data?._manual_overrides || []);

      // Start with existing data, then apply API values only for non-overridden keys
      const mergedCr = { ...(existingCr?.data || {}) };
      for (const [key, val] of Object.entries(callrailData)) {
        if (!manualOverrides.has(key)) {
          mergedCr[key] = val;
        }
      }

      const { error: saveErr } = await supabase.from("report_data").upsert(
        {
          client_id: parseInt(clientId),
          month: monthStr,
          department: "callrail",
          data: mergedCr,
          last_updated_at: new Date().toISOString(),
        },
        { onConflict: "client_id,month,department" }
      );

      if (saveErr) {
        return Response.json({
          success: true,
          saved: false,
          save_error: saveErr.message,
          data: callrailData,
        });
      }

      return Response.json({
        success: true,
        saved: true,
        client_id: clientId,
        company_id: companyId,
        period: { startDate, endDate },
        source_breakdown: {
          website: websiteCalls,
          ads: adsCalls,
          gbp: gbpCalls,
          other: otherCalls,
        },
        data: callrailData,
      });
    }

    return Response.json({
      success: true,
      saved: false,
      client_id: clientId,
      company_id: companyId,
      period: { startDate, endDate },
      source_breakdown: {
        website: websiteCalls,
        ads: adsCalls,
        gbp: gbpCalls,
        other: otherCalls,
      },
      data: callrailData,
    });

  } catch (err) {
    console.error("CallRail API error:", err);
    return Response.json(
      { error: err.message, details: err.errors || null },
      { status: 500 }
    );
  }
}
