import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@aiui/dsl-schema", "@aiui/registry"],
};

export default nextConfig;
