// Tiny in-memory cache for Supabase query results.
//
// Why: the dashboard re-runs the same `report_data` + `client_services` query
// every time a user re-visits a client or remounts the page. With the Supabase
// free tier capped at 5 GB egress/mo, those repeat fetches are the biggest
// avoidable cost. A 5-minute TTL is plenty for a reporting dashboard whose
// underlying data is monthly aggregates.
//
// Cache survives within a single browser session (module scope) but NOT across
// full page reloads. That's intentional — keeps the implementation tiny and
// avoids stale-data risk on cold loads.

const cache = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Read a value from the cache. Returns null if missing or expired.
 * Expired entries are evicted lazily on read.
 */
export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.t > entry.ttl) {
    cache.delete(key);
    return null;
  }
  return entry.v;
}

/**
 * Store a value with optional TTL override (milliseconds).
 */
export function setCached(key, value, ttlMs = DEFAULT_TTL_MS) {
  cache.set(key, { v: value, t: Date.now(), ttl: ttlMs });
}

/**
 * Drop entries. Pass a prefix to invalidate a subset, or no arg to clear all.
 * Call after a known mutation (e.g. admin save) so the next read sees fresh data.
 */
export function invalidateCache(prefix) {
  if (!prefix) { cache.clear(); return; }
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) cache.delete(k);
  }
}
