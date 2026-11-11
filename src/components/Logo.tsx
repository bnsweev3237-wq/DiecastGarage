// The Racasto mark: a slanted red tile with the twin-stripe R and a yellow tab.
// Brand files for print and social live in public/brand.
export const BRAND_RED = "#E1182F";
export const BRAND_GOLD = "#FFC72C";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size * (142 / 130)} height={size} viewBox="-6 0 142 130" aria-hidden="true" className="logo-mark">
      <path d="M34 9H124Q134 9 131 19L108 111Q105 121 95 121H6Q-4 121-1 111L22 19Q25 9 34 9Z" fill={BRAND_RED} />
      <g transform="translate(66 65) skewX(-14) translate(-66 -65)" fill="none">
        <path d="M48 100V36H76A15 15 0 0 1 76 66H48M66 66L88 100" stroke="#fff" strokeWidth="20" />
        <path d="M48 104V36H76A15 15 0 0 1 76 66H48M66 66L90 103" stroke={BRAND_RED} strokeWidth="5" />
      </g>
      <path d="M104 26H116L114 34H102Z" fill={BRAND_GOLD} />
    </svg>
  );
}

export default function Logo() {
  return (
    <>
      <LogoMark size={34} />
      <span className="logo-word">Racasto</span>
    </>
  );
}
