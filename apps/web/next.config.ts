import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@crm/db', '@crm/types'],
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

export default nextConfig
