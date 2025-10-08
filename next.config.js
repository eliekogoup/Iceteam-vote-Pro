/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuration pour Azure Container Apps
  output: 'standalone',
  images: {
    unoptimized: true
  },
  // Éviter les erreurs de build avec Azure
  experimental: {
    esmExternals: true
  },
  // Optimisations pour production
  poweredByHeader: false,
  compress: true
}

module.exports = nextConfig