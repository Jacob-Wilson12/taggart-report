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

async function metaFetch(path, accessToken) {
  const response = await fetch(`https://graph.facebook.com/v19.0${path}&access_token=${accessToken}`);

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

    // ─── Look up Meta Ads integration ───
    const { data: integration, error: intErr } = await supabase
      .from("client_integrations")
      .select("config")
      .eq("client_id", clientId)
      .eq("platform", "meta_ads")
      .single();

    if (intErr || !integration) {
      return Response.json({ error: "No Meta Ads integration found for this client." }, { status: 404 });
    }

    const adAccountId = integration.config.ad_account_id;
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    const { startDate, endDate } = getMonthRange(year, month);

    // ─── Query 1: Account level insights ───
    const insightsData = await metaFetch(
      `/act_${adAccountId}/insights?fields=impressions,clicks,spend,reach,ctr,cpc,cpp,actions,cost_per_action_type&time_range={"since":"${startDate}","until":"${endDate}"}&level=account`,
      accessToken
    );

    const insights = insightsData.data?.[0] || {};

    const impressions = Number(insights.impressions || 0);
    const clicks      = Number(insights.clicks || 0);
    const spend       = Math.round(Number(insights.spend || 0) * 100) / 100;
    const reach       = Number(insights.reach || 0);
    const ctr         = Math.round(Number(insights.ctr || 0) * 100) / 100;
    const cpc         = Math.round(Number(insights.cpc || 0) * 100) / 100;

    // Extract conversions from actions
    const actions = insights.actions || [];
    const leadActions = actions.filter(a =>
      ["lead", "offsite_conversion.fb_pixel_lead", "onsite_conversion.lead_grouped"].includes(a.action_type)
    );
    const conversions = leadActions.reduce((sum, a) => sum + Number(a.value || 0), 0);
    const costPerLead = conversions > 0 ? Math.round(spend / conversions * 100) / 100 : 0;

    // ─── Query 2: Campaign breakdown ───
    const campaignData = await metaFetch(
      `/act_${adAccountId}/insights?fields=campaign_name,impressions,clicks,spend,reach,actions&time_range={"since":"${startDate}","until":"${endDate}"}&level=campaign&sort=["spend_descending"]&limit=10`,
      accessToken
    );

    const topCampaigns = (campaignData.data || []).map(row => {
      const rowActions = row.actions || [];
      const rowLeads = rowActions.filter(a =>
        ["lead", "offsite_conversion.fb_pixel_lead"].includes(a.action_type)
      ).reduce((sum, a) => sum + Number(a.value || 0), 0);

      return {
        name: row.campaign_name,
        impressions: Number(row.impressions || 0),
        clicks: Number(row.clicks || 0),
        spend: Math.round(Number(row.spend || 0) * 100) / 100,
        reach: Number(row.reach || 0),
        leads: rowLeads,
      };
    });
    
// ─── Query 3: Top ad by spend ───
    const adData = await metaFetch(
      `/act_${adAccountId}/insights?fields=ad_name,impressions,clicks,spend,actions&time_range={"since":"${startDate}","until":"${endDate}"}&level=ad&sort=["spend_descending"]&limit=1`,
      accessToken
    );

    const topAdRow = adData.data?.[0] || null;
    const topAd = topAdRow ? topAdRow.ad_name : null;
    
    const metaData = {
      // Core metrics
      impressions,
      clicks,
      spend,
      reach,
      ctr,
      cpc,
      conversions,
      cost_per_lead: costPerLead,

      // Breakdowns
      top_campaigns: topCampaigns,
      top_ad: topAd,

      // Meta
      _source: "meta_ads",
      _pulled_at: new Date().toISOString(),
      _date_range: { startDate, endDate },
    };

    // ─── Auto-save if ?save=true ───
    const autoSave = searchParams.get("save") === "true";
    if (autoSave) {
      const monthStr = `${year}-${String(month).padStart(2, "0")}-01`;

      const { data: existingMeta } = await supabase
        .from("report_data")
        .select("data")
        .eq("client_id", clientId)
        .eq("month", monthStr)
        .eq("department", "meta_ads")
        .single();

      const manualOverrides = new Set(existingMeta?.data?._manual_overrides || []);
      const mergedMeta = { ...(existingMeta?.data || {}) };
      for (const [key, val] of Object.entries(metaData)) {
        if (!manualOverrides.has(key)) mergedMeta[key] = val;
      }

      const { error: saveErr } = await supabase.from("report_data").upsert(
        {
          client_id: parseInt(clientId),
          month: monthStr,
          department: "meta_ads",
          data: mergedMeta,
          last_updated_at: new Date().toISOString(),
        },
        { onConflict: "client_id,month,department" }
      );

      if (saveErr) {
        return Response.json({ success: true, saved: false, save_error: saveErr.message, data: metaData });
      }

      return Response.json({
        success: true,
        saved: true,
        client_id: clientId,
        ad_account_id: adAccountId,
        period: { startDate, endDate },
        data: metaData,
      });
    }

    return Response.json({
      success: true,
      saved: false,
      client_id: clientId,
      ad_account_id: adAccountId,
      period: { startDate, endDate },
      data: metaData,
    });

  } catch (err) {
    console.error("Meta Ads API error:", err);
    return Response.json({ error: err.message, details: err.errors || null }, { status: 500 });
  }
}
