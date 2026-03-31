import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@aiui/dsl-schema",
    "@aiui/layout-engine",
    "@aiui/registry",
  ],
};

export default nextConfig;
