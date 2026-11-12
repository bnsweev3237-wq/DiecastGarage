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
  experimental: {
    // The Terms and Privacy pages read their text from /legal when they're opened.
    outputFileTracingIncludes: { "/terms": ["./legal/**"], "/privacy": ["./legal/**"] },
  },
};
export default nextConfig;
