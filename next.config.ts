import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { qualities: [40, 75], formats: ['image/avif', 'image/webp'] },
  /* config options here */
};

export default nextConfig;
