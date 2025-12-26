/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@bastionauth/nextjs', '@bastionauth/react', '@bastionauth/core'],
  output: 'standalone',
};

module.exports = nextConfig;

