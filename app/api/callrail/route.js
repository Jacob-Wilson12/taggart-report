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
      return Response.json({ error: "No CallRail integration found for this client." }, { status: 404 });
    }

    const companyId = integration.config.company_id;
    const { startDate, endDate } = getMonthRange(year, month);

    // ─── Query 1: Total calls summary ───
    const callsData = await callRailFetch(
      `/a/ACC36d8cf484f1442908d76e394a410a296/calls.json?company_id=${companyId}&start_date=${startDate}&end_date=${endDate}&per_page=250&fields=direction,answered,duration,tracking_source,first_call`
    );

    const calls = callsData.calls || [];
    const totalCalls       = calls.length;
    const answeredCalls    = calls.filter(c => c.answered).length;
    const missedCalls      = totalCalls - answeredCalls;
    const firstTimeCalls   = calls.filter(c => c.first_call).length;
    const inboundCalls     = calls.filter(c => c.direction === "inbound").length;
    const avgDuration      = calls.length > 0
      ? Math.round(calls.reduce((sum, c) => sum + (Number(c.duration) || 0), 0) / calls.length)
      : 0;

    // ─── Query 2: Calls by source ───
    const sourceMap = {};
    for (const call of calls) {
      const source = call.tracking_source || "Unknown";
      sourceMap[source] = (sourceMap[source] || 0) + 1;
    }
    const callsBySource = Object.entries(sourceMap)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // ─── Query 3: Tracking numbers ───
    let trackingNumbers = [];
    try {
      const trackersData = await callRailFetch(
        `/a/ACC36d8cf484f1442908d76e394a410a296/trackers.json?company_id=${companyId}&status=active`
      );
      trackingNumbers = (trackersData.trackers || []).map(t => ({
        name: t.name,
        number: t.formatted_tracking_number,
        type: t.type,
        source: t.tracking_source,
      }));
    } catch (e) {
      trackingNumbers = [];
    }

    const callrailData = {
      // Core metrics
      total_calls: totalCalls,
      answered_calls: answeredCalls,
      missed_calls: missedCalls,
      first_time_callers: firstTimeCalls,
      inbound_calls: inboundCalls,
      avg_call_duration: avgDuration,

      // Breakdowns
      calls_by_source: callsBySource,
      tracking_numbers: trackingNumbers,

      // Meta
      _source: "callrail",
      _pulled_at: new Date().toISOString(),
      _date_range: { startDate, endDate },
    };

    // ─── Auto-save if ?save=true ───
    const autoSave = searchParams.get("save") === "true";
    if (autoSave) {
      const monthStr = `${year}-${String(month).padStart(2, "0")}-01`;

      // Merge phone_calls into SEO row
      const { data: existingSeo } = await supabase
        .from("report_data")
        .select("data")
        .eq("client_id", clientId)
        .eq("month", monthStr)
        .eq("department", "seo")
        .single();

      const mergedSeo = {
        ...(existingSeo?.data || {}),
        phone_calls: callrailData.total_calls,
        _callrail_pulled_at: callrailData._pulled_at,
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

      // Save full CallRail data to callrail department row
      const { data: existingCr } = await supabase
        .from("report_data")
        .select("data")
        .eq("client_id", clientId)
        .eq("month", monthStr)
        .eq("department", "callrail")
        .single();

      const mergedCr = { ...(existingCr?.data || {}), ...callrailData };

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
        return Response.json({ success: true, saved: false, save_error: saveErr.message, data: callrailData });
      }

      return Response.json({
        success: true,
        saved: true,
        client_id: clientId,
        company_id: companyId,
        period: { startDate, endDate },
        data: callrailData,
      });
    }

    return Response.json({
      success: true,
      saved: false,
      client_id: clientId,
      company_id: companyId,
      period: { startDate, endDate },
      data: callrailData,
    });

  } catch (err) {
    console.error("CallRail API error:", err);
    return Response.json({ error: err.message, details: err.errors || null }, { status: 500 });
  }
}
