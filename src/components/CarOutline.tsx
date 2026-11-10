// Stands in for a car photo until one is added.
export default function CarOutline({ width = 150 }: { width?: number }) {
  return (
    <svg width={width} height={width * 0.4} viewBox="0 0 200 80" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <path d="M10 58 L22 40 Q30 30 52 28 L92 18 Q112 14 132 22 L168 34 Q186 38 190 50 L190 58 Z" />
      <circle cx="50" cy="58" r="12" fill="var(--chip)" />
      <circle cx="152" cy="58" r="12" fill="var(--chip)" />
    </svg>
  );
}
