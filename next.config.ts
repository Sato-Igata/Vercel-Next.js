import type { NextConfig } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!API_BASE) {
      // 未設定時に、意図せず "undefined/..." へ飛ばないようにする
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE}/:path*`,
      },
    ];
  },
  reactCompiler: true,
};

export default nextConfig;
