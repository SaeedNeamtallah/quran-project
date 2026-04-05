/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  distDir: process.env.NEXT_DIST_DIR || ".next"
};

export default nextConfig;
