import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Core ships prebuilt ESM from `dist`; transpiling it again can break client chunk factories in dev.
  transpilePackages: ["@dynaui/ui", "@dynaui/react"],
};

export default nextConfig;
