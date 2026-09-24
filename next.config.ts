import type { NextConfig } from 'next';

const githubPagesAssetPrefix = process.env.NODE_ENV === 'production'
  ? '/diagnostico-patrimonial-spu'
  : '';

const nextConfig: NextConfig = {
  output: 'export',
  assetPrefix: githubPagesAssetPrefix,
};

export default nextConfig;
