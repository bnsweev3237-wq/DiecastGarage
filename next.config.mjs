/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // "My garage" became "My collection" in 0.8; keep old links working.
  async redirects() {
    return [
      { source: "/garage", destination: "/collection", permanent: true },
      { source: "/garage/:path*", destination: "/collection/:path*", permanent: true },
      { source: "/admin/cars", destination: "/admin/items", permanent: true },
    ];
  },
  // Security headers on every page:
  //  * no other site can show our pages in a frame (stops clickjacking: tricking you into clicking a hidden button)
  //  * browsers only use HTTPS, and don't guess file types
  //  * other sites only learn which domain a visitor came from, not the page
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      ],
    }];
  },
  experimental: {
    // The Terms and Privacy pages read their text from /legal when they're opened.
    outputFileTracingIncludes: { "/terms": ["./legal/**"], "/privacy": ["./legal/**"] },
  },
};
export default nextConfig;
