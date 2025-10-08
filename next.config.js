/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuration pour Azure Static Web Apps
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Éviter les erreurs de build avec Azure
  experimental: {
    esmExternals: true
  }
}

module.exports = nextConfig