import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@crm/db', '@crm/types'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

export default nextConfig
