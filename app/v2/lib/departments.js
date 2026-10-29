// Department registry — single source for sidebar + routing + labels.
// Keeping this separate from theme makes it easy to add/remove departments
// per client via client_services.enabled later.

export const DEPARTMENTS = [
  { id: 'overview',   label: 'Overview',         icon: 'overview',   alwaysOn: true },
  { id: 'leads',      label: 'Leads',            icon: 'leads',      alwaysOn: true },
  { id: 'seo',        label: 'SEO',              icon: 'seo' },
  { id: 'gbp',        label: 'Google Business',  icon: 'gbp' },
  { id: 'google_ads', label: 'Google Ads',       icon: 'google_ads' },
  { id: 'meta_ads',   label: 'Meta Ads',         icon: 'meta_ads' },
  { id: 'social',     label: 'Organic Social',   icon: 'social' },
];

export const DEPT_LABELS = Object.fromEntries(
  DEPARTMENTS.map((d) => [d.id, d.label])
);
