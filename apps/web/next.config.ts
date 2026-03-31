import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@aiui/dsl-schema",
    "@aiui/expression",
    "@aiui/layout-engine",
    "@aiui/logic",
    "@aiui/registry",
    "@aiui/runtime-core",
    "@aiui/runtime-react",
  ],
};

export default nextConfig;
