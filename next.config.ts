import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required by OpenNext Cloudflare when we run `next build` ourselves
  // (via build script) before bundling with --skipNextBuild.
  output: "standalone",
};

export default nextConfig;

// Enables `getCloudflareContext()` during `next dev` (OpenNext Cloudflare adapter).
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
