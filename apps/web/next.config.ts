import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@aiui/dsl-schema",
    "@aiui/expression",
    "@aiui/layout-engine",
    "@aiui/logic",
    "@aiui/registry",
    "@aiui/runtime-core",
  ],
};

export default nextConfig;
