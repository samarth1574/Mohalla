import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@clerk/nextjs": path.resolve(__dirname, "./src/lib/clerk-mock-client.tsx"),
      "@clerk/nextjs/server": path.resolve(__dirname, "./src/lib/clerk-mock-server.ts"),
    };
    return config;
  },
};

export default nextConfig;
