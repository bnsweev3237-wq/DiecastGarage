// Stands in for a photo until one is added: a little display stand with a star on it.
export default function ItemPlaceholder({ width = 120 }: { width?: number }) {
  return (
    <svg width={width} height={width * 0.6} viewBox="0 0 200 120" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" aria-hidden="true">
      <path d="M100 18 L111 44 L139 46 L117 64 L124 92 L100 77 L76 92 L83 64 L61 46 L89 44 Z" />
      <rect x="56" y="98" width="88" height="12" rx="6" />
    </svg>
  );
}
