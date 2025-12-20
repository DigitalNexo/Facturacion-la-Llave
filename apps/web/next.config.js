/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@fll/db', '@fll/core'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  env: {
    SYSTEM_ID: process.env.SYSTEM_ID || 'FLL-SIF',
    SYSTEM_VERSION: process.env.SYSTEM_VERSION || '0.1.0',
    PRODUCER_NAME: process.env.PRODUCER_NAME || 'Búfalo Easy Trade, S.L.',
    PRODUCER_TAX_ID: process.env.PRODUCER_TAX_ID || 'B86634235',
  },
};

module.exports = nextConfig;
