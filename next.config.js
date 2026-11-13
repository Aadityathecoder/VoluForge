/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  async redirects() {
    return [
      { source: '/explore', destination: '/opportunities', permanent: false },
      { source: '/dashboard/:path*', destination: '/home', permanent: false },
      { source: '/auth/login', destination: '/login', permanent: false },
      { source: '/auth/signup', destination: '/signup', permanent: false },
      { source: '/auth/forgot-password', destination: '/forgot-password', permanent: false },
      { source: '/partners', destination: '/admin', permanent: false },
      { source: '/about', destination: '/support', permanent: false },
      { source: '/how-it-works', destination: '/#how-it-works', permanent: false },
    ]
  },
}
module.exports = nextConfig
