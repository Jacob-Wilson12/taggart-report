'use client';
import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../../supabase";

const C = {
  white: "#fff", navy: "#0c1a2e", cyan: "#00c9e8", cyanD: "#00a5bf",
  cyanL: "#e6f9fc", t: "#1a1a2e", tl: "#6b7280", bd: "#d0d5dd",
  bl2: "#e4e7ec", g: "#10b981", gL: "#f0fdf4", r: "#ef4444", rL: "#fef2f2",
  o: "#f59e0b", oL: "#fffbeb", bg: "#f0f2f5",
};
const F = "Inter,system-ui,sans-serif";

// -- Client name normalization (Excel name -> DB name) --------------------------
const CLIENT_NAME_MAP = {
  "Goode Motor Auto Group": "Goode Motor Group",
};
const normalizeClient = (name) => CLIENT_NAME_MAP[name] || name;

// -- Column mappings -----------------------------------------------------------
// SEO_GMB sheet: row 1 = headers, col 0 = client, col 1 = month
const SEO_COL_MAP = {
  2:  { dept: "seo", key: "organic_sessions" },
  3:  { dept: "seo", key: "direct_sessions" },
  4:  { dept: "seo", key: "paid_sessions" },
  5:  { dept: "seo", key: "social_sessions" },
  6:  { dept: "seo", key: "impressions" },
  7:  { dept: "seo", key: "ctr" },
  8:  { dept: "seo", key: "avg_position" },
  9:  { dept: "seo", key: "page1_keywords" },
  10: { dept: "seo", key: "form_submissions" },
  11: { dept: "seo", key: "phone_calls" },
  12: { dept: "seo", key: "vdp_views" },
  13: { dept: "seo", key: "direction_requests" },
  14: { dept: "seo", key: "chat_conversations" },
  15: { dept: "seo", key: "bounce_rate" },
  16: { dept: "seo", key: "avg_session_duration" }, // HH:MM:SS -> seconds
  17: { dept: "seo", key: "total_sessions" },
  18: { dept: "gbp", key: "profile_views" },
  19: { dept: "gbp", key: "search_appearances" },
  20: { dept: "gbp", key: "map_views" },
  21: { dept: "gbp", key: "website_clicks" },
  22: { dept: "gbp", key: "phone_calls" },
  23: { dept: "gbp", key: "direction_requests" },
  24: { dept: "gbp", key: "review_count" },
  25: { dept: "gbp", key: "avg_rating" },
  26: { dept: "gbp", key: "new_reviews" },
  27: { dept: "gbp", key: "photo_count" },
  28: { dept: "gbp", key: "posts_published" },
};

// Goode Motor Ford GBP data goes into gbp_ford_* keys (per-listing)
// Combined totals auto-compute when Overland data is added via admin
const GMF_GBP_COL_OVERRIDE = {
  18: { dept: "gbp", key: "gbp_ford_profile_views" },
  19: { dept: "gbp", key: "gbp_ford_search_appearances" },
  20: { dept: "gbp", key: "gbp_ford_map_views" },
  21: { dept: "gbp", key: "gbp_ford_website_clicks" },
  22: { dept: "gbp", key: "gbp_ford_phone_calls" },
  23: { dept: "gbp", key: "gbp_ford_direction_requests" },
  24: { dept: "gbp", key: "gbp_ford_review_count" },
  25: { dept: "gbp", key: "gbp_ford_avg_rating" },
  26: { dept: "gbp", key: "gbp_ford_new_reviews" },
  27: { dept: "gbp", key: "gbp_ford_photo_count" },
  28: { dept: "gbp", key: "gbp_ford_posts_published" },
};

const SOCIAL_COL_MAP = {
  2:  { dept: "social", key: "fb_followers" },
  3:  { dept: "social", key: "fb_visits" },
  4:  { dept: "social", key: "fb_engagement" },
  5:  { dept: "social", key: "fb_new_followers" },
  6:  { dept: "social", key: "fb_page_views" },
  7:  { dept: "social", key: "ig_followers" },
  8:  { dept: "social", key: "ig_reach" },
  9:  { dept: "social", key: "ig_impressions" },
  10: { dept: "social", key: "ig_profile_views" },
  11: { dept: "social", key: "ig_new_followers" },
  12: { dept: "social", key: "yt_followers" },
  13: { dept: "social", key: "yt_month_views" },
  14: { dept: "social", key: "yt_month_videos" },
  15: { dept: "social", key: "yt_month_likes" },
  16: { dept: "social", key: "yt_month_comments" },
  17: { dept: "social", key: "yt_total_views" },
  18: { dept: "social", key: "tiktok_followers" },
  19: { dept: "social", key: "tiktok_profile_views" },
  20: { dept: "social", key: "tiktok_views" },
  21: { dept: "social", key: "tiktok_likes" },
  22: { dept: "social", key: "posts_published" },
  23: { dept: "social", key: "videos_published" },
  24: { dept: "social", key: "web_clicks" },
  25: { dept: "social", key: "top_video_views" },
};

// -- Helpers -------------------------------------------------------------------
function parseMonthStr(raw) {
  if (!raw) return null;
  // XLSX may parse dates as JS Date objects or serial numbers
  let d;
  if (raw instanceof Date) {
    d = raw;
  } else if (typeof raw === "number") {
    // Excel serial date
    d = new Date(Math.round((raw - 25569) * 86400 * 1000));
  } else if (typeof raw === "string") {
    d = new Date(raw);
  } else return null;
  if (isNaN(d)) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

function parseDuration(raw) {
  // Handles Date objects (time-only), "HH:MM:SS" strings, or seconds
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return Math.round(raw);
  if (raw instanceof Date) {
    return raw.getHours() * 3600 + raw.getMinutes() * 60 + raw.getSeconds();
  }
  if (typeof raw === "string") {
    const parts = raw.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  return null;
}

function parseVal(raw, key) {
  if (raw == null || raw === "" || (typeof raw === "number" && isNaN(raw))) return null;
  if (key === "avg_session_duration") return parseDuration(raw);
  if (typeof raw === "number") {
    // yt_total_views is stored in thousands in the spreadsheet (e.g. 21.3 = 21,300)
    if (key === "yt_total_views") return Math.round(raw * 1000);
    return raw;
  }
  const str = String(raw).trim();
  // Handle K suffix (e.g. 7.8K, 20K) -- TikTok views
  if (/^[0-9.]+[Kk]$/.test(str)) return Math.round(parseFloat(str) * 1000);
  // Handle M suffix just in case
  if (/^[0-9.]+[Mm]$/.test(str)) return Math.round(parseFloat(str) * 1000000);
  const n = parseFloat(str.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? null : n;
}

function parseSheet(rows, colMap) {
  // rows[0] = section header, rows[1] = column headers, rows[2+] = data
  const dataRows = rows.slice(2);
  const records = []; // { clientName, monthStr, dept, key, value }

  let currentClient = null;
  dataRows.forEach(row => {
    if (row[0] != null && String(row[0]).trim() !== "") {
      currentClient = normalizeClient(String(row[0]).trim());
    }
    if (!currentClient) return;
    const monthStr = parseMonthStr(row[1]);
    if (!monthStr) return;

    // For Goode Motor Ford, use the ford-specific GBP keys for GBP columns
    const effectiveMap = (currentClient === "Goode Motor Ford")
      ? { ...colMap, ...GMF_GBP_COL_OVERRIDE }
      : colMap;

    Object.entries(effectiveMap).forEach(([colIdx, { dept, key }]) => {
      const raw = row[parseInt(colIdx)];
      const val = parseVal(raw, key);
      // Always push including nulls so we can show gap counts in preview
      records.push({ clientName: currentClient, monthStr, dept, key, val });
    });
  });
  return records;
}

function groupRecords(records) {
  // Group into { clientName -> monthStr -> dept -> { key: val } }
  const grouped = {};
  records.forEach(({ clientName, monthStr, dept, key, val }) => {
    if (!grouped[clientName]) grouped[clientName] = {};
    if (!grouped[clientName][monthStr]) grouped[clientName][monthStr] = {};
    if (!grouped[clientName][monthStr][dept]) grouped[clientName][monthStr][dept] = {};
    grouped[clientName][monthStr][dept][key] = val;
  });
  return grouped;
}

// -- Main component ------------------------------------------------------------
export default function ImportPage() {
  const fileRef = useRef();
  const [step, setStep] = useState("upload"); // upload | preview | importing | done
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState(null); // { grouped, clientMap, stats }
  const [log, setLog] = useState([]);
  const [counts, setCounts] = useState({ upserted: 0, skipped: 0, error: 0 });
  const [parseError, setParseError] = useState(null);

  const addLog = (msg, type = "info") =>
    setLog(prev => [...prev.slice(-99), { msg, type, ts: new Date().toLocaleTimeString() }]);

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array", cellDates: true });
        const seoSheet = wb.Sheets["SEO_GMB"];
        const socialSheet = wb.Sheets["SOCIAL"];
        if (!seoSheet || !socialSheet) throw new Error("Missing SEO_GMB or SOCIAL sheet");

        const seoRows  = XLSX.utils.sheet_to_json(seoSheet,  { header: 1, defval: null, raw: false, cellDates: true });
        const seoRowsRaw = XLSX.utils.sheet_to_json(seoSheet, { header: 1, defval: null, raw: true });
        const socialRows = XLSX.utils.sheet_to_json(socialSheet, { header: 1, defval: null, raw: true });

        // Use raw: true for numbers but raw: false for dates in col 1
        // Merge: use raw values but replace col 1 with parsed date from non-raw read
        const mergedSeo = seoRowsRaw.map((row, i) => {
          const r = [...row];
          r[1] = seoRows[i]?.[1]; // use date-parsed value for month col
          return r;
        });

        const seoRecords    = parseSheet(mergedSeo, SEO_COL_MAP);
        const socialRecords = parseSheet(socialRows, SOCIAL_COL_MAP);
        const allRecords    = [...seoRecords, ...socialRecords];
        const grouped       = groupRecords(allRecords);

        // Build stats
        const clientNames = Object.keys(grouped);
        let totalCells = 0, totalBlanks = 0, totalRows = 0;
        const byClient = {};
        clientNames.forEach(cn => {
          const months = Object.keys(grouped[cn]);
          let cells = 0, blanks = 0;
          months.forEach(m => {
            Object.values(grouped[cn][m]).forEach(deptData => {
              Object.values(deptData).forEach(v => {
                if (v !== null) cells++; else blanks++;
              });
            });
          });
          totalCells += cells;
          totalBlanks += blanks;
          totalRows += months.length;
          byClient[cn] = { months: months.length, cells, blanks };
        });

        setPreview({ grouped, byClient, totalCells, totalBlanks, totalRows, clientNames });
        setStep("preview");
      } catch (err) {
        setParseError(err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    setStep("importing");
    setLog([]);
    setCounts({ upserted: 0, skipped: 0, error: 0 });

    // Load client list from Supabase
    const { data: clientRows } = await supabase.from("clients").select("id,name").eq("active", true);
    const clientIdMap = {};
    (clientRows || []).forEach(c => { clientIdMap[c.name] = c.id; });

    const { data: { user } } = await supabase.auth.getUser();
    let upserted = 0, skipped = 0, error = 0;

    const { grouped } = preview;

    for (const clientName of Object.keys(grouped)) {
      const clientId = clientIdMap[clientName];
      if (!clientId) {
        addLog(`! Client not found in DB: "${clientName}" -- skipping`, "warn");
        const months = Object.keys(grouped[clientName]);
        skipped += months.length * 2; // seo + gbp/social
        setCounts({ upserted, skipped, error });
        continue;
      }

      for (const monthStr of Object.keys(grouped[clientName])) {
        const depts = grouped[clientName][monthStr];

        for (const dept of Object.keys(depts)) {
          const newData = depts[dept];

          // Fetch existing data to merge (don't overwrite manual entries)
          const { data: existing } = await supabase.from("report_data")
            .select("data")
            .eq("client_id", clientId)
            .eq("month", monthStr)
            .eq("department", dept)
            .single();

          const existingData = existing?.data || {};
          const manualOverrides = new Set(existingData._manual_overrides || []);

          // Merge: import wins for non-null values unless manually locked
          // Social dept: blank cells clear existing values (removes stale API numbers)
          // All other depts: blank cells are skipped, existing data preserved
          const merged = { ...existingData };
          const importedFields = new Set(existingData._imported_fields || []);
          let importedCount = 0, clearedCount = 0;
          Object.entries(newData).forEach(([key, val]) => {
            if (!manualOverrides.has(key)) {
              if (val !== null) {
                merged[key] = val;
                importedFields.add(key);
                importedCount++;
              } else if (dept === "social") {
                // Blank social cell — clear any existing value (including API data)
                merged[key] = null;
                importedFields.delete(key);
                clearedCount++;
              }
              // Other depts: null = skip, keep existing value
            }
          });

          merged._imported_fields = Array.from(importedFields);

          // Auto-compute combined GBP totals for Goode Motor Ford
          // Ford + Overland (Overland may be 0/null if not yet entered -- that's fine)
          if (clientName === "Goode Motor Ford" && dept === "gbp") {
            const sumFields = [
              "profile_views","search_appearances","map_views","website_clicks",
              "phone_calls","direction_requests","review_count","new_reviews","posts_published",
            ];
            sumFields.forEach(f => {
              const ford     = Number(merged[`gbp_ford_${f}`])     || 0;
              const overland = Number(merged[`gbp_overland_${f}`]) || 0;
              merged[f] = ford + overland || null;
            });
          }

          merged._imported_at = new Date().toISOString();

          const { error: upsertErr } = await supabase.from("report_data").upsert(
            {
              client_id: clientId,
              month: monthStr,
              department: dept,
              data: merged,
              last_updated_by: user.id,
              last_updated_at: new Date().toISOString(),
            },
            { onConflict: "client_id,month,department" }
          );

          if (upsertErr) {
            addLog(`x ${clientName} . ${monthStr} . ${dept}: ${upsertErr.message}`, "error");
            error++;
          } else {
            addLog(`v ${clientName} . ${monthStr} . ${dept} (${importedCount} fields${clearedCount > 0 ? `, ${clearedCount} cleared` : ""})`, "success");
            upserted++;
          }
          setCounts({ upserted, skipped, error });
        }
      }
    }

    setStep("done");
    addLog(`\nDone! Import complete -- ${upserted} rows upserted, ${skipped} skipped, ${error} errors`, "done");
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      {/* Header */}
      <div style={{ background: C.navy, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/Taggart_Advertising_Logo.png" alt="Taggart" style={{ height: 32 }} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Excel Data Import</span>
          <span style={{ background: "rgba(0,201,232,0.2)", color: "#00c9e8", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>ADMIN ONLY</span>
        </div>
        <a href="/admin" style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>Back to Admin</a>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.t, margin: "0 0 6px", fontFamily: F }}>Import Historical Data</h1>
          <p style={{ fontSize: 13, color: C.tl, margin: 0 }}>
            Uploads SEO, GBP, and Social data from the Taggart bulk history spreadsheet.
            Existing manually-locked fields are protected and will not be overwritten.
          </p>
        </div>

        {/* Supported format info */}
        <div style={{ background: C.cyanL, border: `1px solid #a5f3fc`, borderRadius: 10, padding: "14px 18px", marginBottom: 24, fontSize: 12, color: C.cyanD, fontFamily: F }}>
          <strong>Expected format:</strong> Excel file with sheets named <code>SEO_GMB</code> and <code>SOCIAL</code>, matching the Taggart bulk data template.
          Client names, months, and columns must match the standard template.
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
              onChange={e => handleFile(e.target.files[0])} />
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              onDragOver={e => e.preventDefault()}
              style={{ border: `3px dashed ${C.bd}`, borderRadius: 14, padding: "48px 24px", textAlign: "center", cursor: "pointer", background: C.white, transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.cyan}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.bd}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>[chart]</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.t, marginBottom: 6 }}>Drop your Excel file here</div>
              <div style={{ fontSize: 13, color: C.tl }}>or click to browse . .xlsx files only</div>
            </div>
            {parseError && (
              <div style={{ marginTop: 14, background: C.rL, border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: C.r }}>
                ! {parseError}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && preview && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { label: "Clients", value: preview.clientNames.length, color: C.navy },
                { label: "Month Rows", value: preview.totalRows, color: C.cyanD },
                { label: "Values to Import", value: preview.totalCells.toLocaleString(), color: C.g },
                { label: "Blanks (skipped)", value: preview.totalBlanks.toLocaleString(), color: C.tl },
                { label: "File", value: fileName, color: C.tl },
              ].map((s, i) => (
                <div key={i} style={{ background: C.white, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "14px 18px", flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: 10, color: C.tl, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: i === 4 ? 11 : 22, fontWeight: 700, color: s.color, wordBreak: "break-all" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Per-client breakdown */}
            <div style={{ background: C.white, border: `1px solid ${C.bd}`, borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
              <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.bd}`, fontSize: 12, fontWeight: 700, color: C.t, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Data to import
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Client", "Months", "Values", "Blanks (skipped)", "Status"].map(h => (
                      <th key={h} style={{ padding: "8px 16px", textAlign: "left", fontSize: 11, color: C.tl, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: `1px solid ${C.bd}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.clientNames.map(cn => (
                    <tr key={cn} style={{ borderBottom: `1px solid ${C.bl2}` }}>
                      <td style={{ padding: "10px 16px", fontWeight: 600, color: C.t }}>{cn}</td>
                      <td style={{ padding: "10px 16px", color: C.t }}>{preview.byClient[cn].months}</td>
                      <td style={{ padding: "10px 16px", color: C.g, fontWeight: 600 }}>{preview.byClient[cn].cells.toLocaleString()}</td>
                      <td style={{ padding: "10px 16px", color: C.o, fontWeight: 600 }}>{preview.byClient[cn].blanks.toLocaleString()}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ background: C.gL, color: "#166534", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>Ready</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: C.oL, border: `1px solid ${C.o}44`, borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#92400e" }}>
              ! This will upsert data into Supabase. <strong>Blank cells are skipped</strong> -- existing data is never deleted.
              Manually locked fields are also protected. Only cells with values in the spreadsheet will write.
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setStep("upload"); setPreview(null); }}
                style={{ background: "none", border: `1px solid ${C.bd}`, borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, color: C.t }}>
                Back
              </button>
              <button onClick={handleImport}
                style={{ background: C.g, color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
                Import {preview.totalCells.toLocaleString()} Values
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Importing / Done */}
        {(step === "importing" || step === "done") && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Upserted", value: counts.upserted, color: C.g },
                { label: "Skipped", value: counts.skipped, color: C.tl },
                { label: "Errors", value: counts.error, color: C.r },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: C.white, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: C.tl, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {step === "importing" && (
              <div style={{ background: C.cyanL, border: `1px solid #a5f3fc`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: C.cyanD }}>
                O Importing... do not close this tab.
              </div>
            )}

            {step === "done" && (
              <div style={{ background: C.gL, border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#166534" }}>
                Done! Import complete. Data is now in Supabase.
              </div>
            )}

            {/* Log */}
            <div style={{ background: "#0c1a2e", borderRadius: 10, padding: 16, maxHeight: 360, overflow: "auto", fontFamily: "monospace", fontSize: 11, lineHeight: 1.9 }}>
              {log.map((entry, i) => (
                <div key={i} style={{ color: entry.type === "success" ? "#6ee7b7" : entry.type === "error" ? "#fca5a5" : entry.type === "warn" ? "#fde68a" : entry.type === "done" ? C.cyan : "#9ca3af" }}>
                  <span style={{ color: "#4b5563", marginRight: 8 }}>{entry.ts}</span>{entry.msg}
                </div>
              ))}
              {step === "importing" && <div style={{ color: "#6b7280" }}>O Working...</div>}
            </div>

            {step === "done" && (
              <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                <a href="/admin/bulk" style={{ background: C.navy, color: "#fff", borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  Open Bulk Editor
                </a>
                <button onClick={() => { setStep("upload"); setPreview(null); setLog([]); setCounts({ upserted: 0, skipped: 0, error: 0 }); }}
                  style={{ background: "none", border: `1px solid ${C.bd}`, borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, color: C.t }}>
                  Import Another File
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
