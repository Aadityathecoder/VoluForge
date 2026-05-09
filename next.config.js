/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [{ protocol: 'http', hostname: 'localhost', pathname: '/**' }],
  },
}

module.exports = nextConfig
