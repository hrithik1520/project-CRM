import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@crm/db', '@crm/types'],
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'img.clerk.com' },
    ],
  },
}

export default nextConfig
