/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // The Terms and Privacy pages read their text from /legal when they're opened.
    outputFileTracingIncludes: { "/terms": ["./legal/**"], "/privacy": ["./legal/**"] },
  },
};
export default nextConfig;
