import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  outputFileTracingRoot: path.join(process.cwd()),
  reactStrictMode: true
};

export default nextConfig;
