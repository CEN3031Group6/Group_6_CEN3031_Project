import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/pass/:slug",
        destination: "/pass?slug=:slug",
      },
    ]
  },
}

export default nextConfig;
