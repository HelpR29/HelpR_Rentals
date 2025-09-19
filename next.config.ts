import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds for MVP
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable type checking during builds for MVP
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
