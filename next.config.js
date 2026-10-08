/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() { return [
    { source: '/about', destination: '/support', permanent: false },
    { source: '/how-it-works', destination: '/', permanent: false },
    { source: '/submit-need', destination: '/partners', permanent: false },
    { source: '/dashboard/projects/:path*', destination: '/activity', permanent: false },
    { source: '/project-kits/:path*', destination: '/partners', permanent: false },
  ]; },
  async rewrites() { return { beforeFiles: [{"source": "/", "destination": "/voluforge/index.html"}, {"source": "/explore", "destination": "/voluforge/index.html"}, {"source": "/activity", "destination": "/voluforge/index.html"}, {"source": "/impact", "destination": "/voluforge/index.html"}, {"source": "/profile", "destination": "/voluforge/index.html"}, {"source": "/dashboard", "destination": "/voluforge/index.html"}, {"source": "/service", "destination": "/voluforge/index.html"}, {"source": "/opportunity", "destination": "/voluforge/index.html"}, {"source": "/partners", "destination": "/voluforge/index.html"}, {"source": "/community", "destination": "/voluforge/index.html"}, {"source": "/auth/login", "destination": "/voluforge/index.html"}, {"source": "/auth/signup", "destination": "/voluforge/index.html"}, {"source": "/auth/forgot-password", "destination": "/voluforge/index.html"}, {"source": "/auth/callback", "destination": "/voluforge/index.html"}, {"source": "/privacy", "destination": "/voluforge/index.html"}, {"source": "/terms", "destination": "/voluforge/index.html"}, {"source": "/support", "destination": "/voluforge/index.html"}], afterFiles: [], fallback: [] }; },
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [{ protocol: 'http', hostname: 'localhost', pathname: '/**' }],
  },
}

module.exports = nextConfig
