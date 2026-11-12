// The Collectors Association mark: chunky "TCA" standing on a rounded coral plinth with two bolts.
// Brand files for print and social live in public/brand.
export const BRAND_CORAL = "#FF6B4A";

export function LogoMark({ height = 40 }: { height?: number }) {
  return (
    <svg height={height} width={height * (140 / 96)} viewBox="0 0 140 96" aria-hidden="true" className="logo-mark">
      <text x="70" y="58" textAnchor="middle" fontFamily="Rubik, system-ui, sans-serif" fontWeight="900" fontSize="56" letterSpacing="-1" fill="currentColor">TCA</text>
      <rect x="10" y="66" width="120" height="18" rx="9" fill={BRAND_CORAL} />
      <circle cx="22" cy="75" r="3" fill="var(--panel, #fff)" />
      <circle cx="118" cy="75" r="3" fill="var(--panel, #fff)" />
    </svg>
  );
}

export default function Logo() {
  return (
    <>
      <LogoMark />
      <span className="logo-word">The Collectors<br />Association</span>
    </>
  );
}
