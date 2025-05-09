/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checks during production builds
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 