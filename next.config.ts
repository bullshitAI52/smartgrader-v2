import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  // Configure 'basePath' for GitHub Pages deployment
  // The repository name 'smartgrader-v2' is used as the base path
  // Only apply this if we are NOT on Vercel (Vercel uses root path)
  basePath: (isProd && !process.env.VERCEL) ? '/smartgrader-v2' : '',
  // Disable server-side image optimization since GitHub Pages serves static content
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
