import type { NextConfig } from "next";

const isWSL = process.env.WSL_DISTRO_NAME || process.env.WSLENV;

const nextConfig: NextConfig = {
  // Enable static export for Neutralino.js production builds
  output: "export",
  webpack: (config) => {
    if (isWSL) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
