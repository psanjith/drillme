import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;

// Enables `getCloudflareContext()` during `next dev` (OpenNext Cloudflare adapter).
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
