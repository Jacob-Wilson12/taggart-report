// /v2 lives alongside the current app at `/`. Nothing here affects the live
// site — the current report is at /, the redesign is at /v2.

export const metadata = {
  title: 'Taggart Report',
  description: 'Performance reporting for Taggart Advertising clients',
};

export default function V2Layout({ children }) {
  return children;
}
