// theCollectorHQ logo: the collector's binder with the italic "theCollectorHQ.com" wordmark and orange swoosh.
// Brand files for print and social live in public/brand.
export const BRAND_ORANGE = "#F0915A";

export default function Logo() {
  return (
    // On narrow phones there's only room for the binder icon; the full wordmark would get squeezed.
    <picture>
      <source media="(max-width: 480px)" srcSet="/brand/chq-icon-512.png" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/chq-logo-header.png" alt="theCollectorHQ" width={244} height={64} className="logo-img" />
    </picture>
  );
}
