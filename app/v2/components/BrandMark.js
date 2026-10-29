// Inline SVG mark — same shape as /public/brand/ta-monogram.svg but embedded so
// it inherits text color + sits sharp at any size without an extra HTTP hop.

export function BrandMark({ size = 28 }) {
  return (
    <svg
      viewBox="0 0 600 563"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <path
        fill="#2d7df6"
        stroke="#f2f7fa"
        strokeWidth="2.32"
        d="M88.89,111.13h214.81v70.37h-70.37v233.33l-70.37,29.63V181.5h-74.07v-70.37h0Z"
      />
      <path
        fill="#f2f7fa"
        stroke="#2d7df6"
        strokeWidth="2.32"
        fillRule="evenodd"
        d="M364.12,103.72l78.04,340.74H153.27L364.12,103.72ZM344.34,244.46l40.52,133.33h-118.52l78-133.33Z"
      />
    </svg>
  );
}
