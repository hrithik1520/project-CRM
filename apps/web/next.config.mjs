/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@crm/db', '@crm/types'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
}

export default nextConfig
