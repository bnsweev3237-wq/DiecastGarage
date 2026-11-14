// theCollectorHQ logo: the collector's binder with the italic "theCollectorHQ.com" wordmark and orange swoosh.
// Brand files for print and social live in public/brand.
export const BRAND_ORANGE = "#FE7101";

export default function Logo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/chq-logo-header.png" alt="theCollectorHQ" width={244} height={64} className="logo-img" />
  );
}
