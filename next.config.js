/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // The /v2 design is served at the clean URLs:
  //
  // /          → serves /v2          (main client-facing report)
  // /admin     → serves /v2/admin    (team data-entry UI)
  //
  // rewrites() keeps the browser URL clean (looks like / and /admin) while
  // Next renders the /v2 pages. Legacy pages stay on disk for rollback:
  //   /legacy/report  → the old / page.js (unchanged)
  //   /legacy/admin   → the old /admin page.js (unchanged)
  //   /admin/bulk, /admin/import — unchanged, still useful for bulk flows
  //
  // To roll back fast: delete the two entries in this rewrites() block
  // and the live site reverts to the previous design on next deploy.
  async rewrites() {
    return [
      { source: '/', destination: '/v2' },
      { source: '/admin', destination: '/v2/admin' },
    ];
  },
};
module.exports = nextConfig;
