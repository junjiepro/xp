/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  transpilePackages: [
    '@electric-sql/pglite',
  ],
};

export default nextConfig;
