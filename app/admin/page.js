# admin/page.js — Exact changes needed

These are copy-paste insertions at specific locations in the file.

---

## 1. After `const GOODE_MOTOR_GROUP = "Goode Motor Group";`

Paste this block:

const GBP_MULTI_LISTINGS = {
  "Goode Motor Ford": [
    { key: "ford",     label: "Goode Motor Ford",    color: "#1d4ed8" },
    { key: "overland", label: "Goode Motor Overland", color: "#059669" },
  ],
};
const GBP_LISTING_FIELDS_ADMIN = [
  { key: "profile_views",      label: "Profile Views",      type: "number"  },
  { key: "search_appearances", label: "Search Appearances", type: "number"  },
  { key: "map_views",          label: "Map Views",          type: "number"  },
  { key: "website_clicks",     label: "Website Clicks",     type: "number"  },
  { key: "phone_calls",        label: "Phone Calls",        type: "number"  },
  { key: "direction_requests", label: "Direction Requests", type: "number"  },
  { key: "review_count",       label: "Total Reviews",      type: "number"  },
  { key: "avg_rating",         label: "Avg Rating",         type: "decimal" },
  { key: "new_reviews",        label: "New Reviews",        type: "number"  },
  { key: "photo_count",        label: "Photos on Profile",  type: "number"  },
  { key: "posts_published",    label: "Posts Published",    type: "number"  },
];
const GBP_LISTING_SUM_FIELDS = [
  "profile_views","search_appearances","map_views","website_clicks",
  "phone_calls","direction_requests","review_count","new_reviews","posts_published",
];

---

## 2. In DeptForm — after `const [saved, setSaved] = useState(false);`

  const [listingTab, setListingTab] = useState("ford");

---

## 3. In DeptForm — after `const isJuneauChild = isJuneau && !isJuneauSource;`

  const isMultiGBP = dept.id === "gbp" && !!GBP_MULTI_LISTINGS[clientName];
  const multiGBPListings = isMultiGBP ? GBP_MULTI_LISTINGS[clientName] : null;

---

## 4. In handleSave — replace the final upsert block:

Find:
    await supabase.from("report_data").upsert(
      { client_id: clientId, month, department: dept.id, data: savePayload, ...ts },
      { onConflict: "client_id,month,department" }
    );

    setData(savePayload);

Replace with:
    // ── Auto-compute GBP totals from per-listing data (Goode Motor Ford) ──
    if (isMultiGBP && multiGBPListings) {
      GBP_LISTING_SUM_FIELDS.forEach(f => {
        const total = multiGBPListings.reduce((acc, l) => {
          const v = Number(savePayload[`gbp_${l.key}_${f}`]);
          return acc + (isNaN(v) ? 0 : v);
        }, 0);
        if (total > 0) savePayload[f] = total;
      });
    }

    await supabase.from("report_data").upsert(
      { client_id: clientId, month, department: dept.id, data: savePayload, ...ts },
      { onConflict: "client_id,month,department" }
    );

    setData(savePayload);

---

## 5. In DeptForm return — after the closing `})}` of the Sold % by Brand block
   (or anywhere after the upload section, before the final closing </div>)

Add this block:

      {isMultiGBP && multiGBPListings && (
        <div style={{ marginTop: 24, borderTop: `1px solid ${C.bd}`, paddingTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.tl, textTransform: "uppercase",
            letterSpacing: "0.06em", marginBottom: 14, fontFamily: F }}>
            📍 Per-Listing Data Entry
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
            {multiGBPListings.map(l => (
              <button key={l.key} onClick={() => setListingTab(l.key)}
                style={{ padding: "8px 18px", borderRadius: 8,
                  border: `2px solid ${listingTab === l.key ? l.color : C.bd}`,
                  background: listingTab === l.key ? l.color + "15" : C.white,
                  color: listingTab === l.key ? l.color : C.tl,
                  fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
                📍 {l.label}
              </button>
            ))}
            <div style={{ marginLeft: "auto", fontSize: 11, color: C.tl, fontFamily: F,
              alignSelf: "center", background: C.cyanL, padding: "4px 10px", borderRadius: 6 }}>
              ✓ Combined totals auto-computed on Save
            </div>
          </div>
          {multiGBPListings.filter(l => l.key === listingTab).map(l => (
            <div key={l.key} style={{ background: "#f8fafc", borderRadius: 10, padding: 16,
              border: `2px solid ${l.color}33` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: l.color, fontFamily: F, marginBottom: 14 }}>
                {l.label}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                {GBP_LISTING_FIELDS_ADMIN.map(field => {
                  const fKey = `gbp_${l.key}_${field.key}`;
                  return (
                    <div key={fKey} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: C.t, fontFamily: F }}>
                        {field.label}
                      </label>
                      <input
                        type="number"
                        step={field.type === "decimal" ? "0.01" : "1"}
                        value={data[fKey] ?? ""}
                        onChange={e => handleChange(fKey, e.target.value)}
                        disabled={!editable}
                        placeholder="0"
                        style={{ padding: "9px 12px", borderRadius: 7, border: `1px solid ${C.bd}`,
                          fontSize: 13, fontFamily: F, outline: "none",
                          background: editable ? C.white : "#f8fafc",
                          color: editable ? C.t : C.tl }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
