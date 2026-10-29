/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Flip the switch: redirect the live routes to /v2.
  //
  // /          → /v2          (main client-facing report)
  // /admin     → /v2/admin    (team data-entry UI)
  //
  // Legacy pages are intentionally LEFT on disk for rollback:
  //   /legacy/report  → the old / page.js  (rendered as-is)
  //   /legacy/admin   → the old /admin page.js
  //   /admin/bulk, /admin/import — unchanged, still useful for bulk flows
  //
  // To roll back fast: delete the two entries in this redirects() block
  // and the live site reverts to the previous design on next deploy.
  async redirects() {
    return [
      { source: '/', destination: '/v2', permanent: false },
      { source: '/admin', destination: '/v2/admin', permanent: false },
    ];
  },
};
module.exports = nextConfig;
