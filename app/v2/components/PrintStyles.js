'use client';

/**
 * Inline <style> that only activates when printing — hides the shell, drops
 * backgrounds + colors to be ink-friendly, and keeps cards from breaking
 * mid-row. Letting the browser handle PDF export via File → Print is cheap
 * and reliable; this stylesheet is what makes it look reasonable.
 */
export function PrintStyles() {
  return (
    <style>{`
      @media print {
        /* Hide the shell — the paper copy is the content itself */
        aside, header[role="banner"], [data-sidebar], [data-topbar] {
          display: none !important;
        }
        /* Collapse the grid shell down to the main column */
        .v2-shell {
          display: block !important;
          height: auto !important;
          max-height: none !important;
        }
        main {
          overflow: visible !important;
          padding: 0 !important;
        }
        /* Keep cards whole */
        .v2-print-card, [data-card] {
          page-break-inside: avoid;
        }
        /* Darker type for ink */
        body { background: white !important; }
        /* Hero stays dark but no gradients that burn ink */
        [data-hero] {
          background: #0d1524 !important;
          color: white !important;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
      }
    `}</style>
  );
}
