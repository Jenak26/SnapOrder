import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev overlay badge is visible in screen recordings; underlying errors
  // still surface in the terminal.
  devIndicators: false,
};

export default nextConfig;
