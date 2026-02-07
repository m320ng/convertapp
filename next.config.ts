import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placeholder.heyo.me',
      },
    ],
  },
  output: 'standalone',
};

export default nextConfig;
