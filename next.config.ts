import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals = [...config.externals, 'sharp'];

    return config;
  },
  experimental: {
    viewTransition: true,
    useCache: true,
  },
};

export default nextConfig;
