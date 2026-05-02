import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: 'dist',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      }
    ],
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
    memoryBasedWorkersCount: true,
  },
};

export default nextConfig;
