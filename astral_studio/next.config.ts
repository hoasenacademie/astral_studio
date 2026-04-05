import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true
  },
  allowedDevOrigins: ["192.168.1.18"]
};

export default nextConfig;
