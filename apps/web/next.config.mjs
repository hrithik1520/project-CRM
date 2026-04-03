/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@crm/db', '@crm/types'],
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  output: 'standalone',
}

export default nextConfig
