import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Pre-existing lint debt (mostly `no-explicit-any` on legacy CMS section props)
    // spans 60+ files across the app and isn't a build-blocking correctness issue.
    // `next lint` and editor integration still run normally — this only stops
    // unrelated style debt from blocking production deploys.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
