import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "probably-expenditure-controllers-guaranteed.trycloudflare.com",
    "*.trycloudflare.com",
    "*"
  ],
};

export default nextConfig;
