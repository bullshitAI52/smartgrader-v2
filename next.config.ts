import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
// Determine if we need a static export (GitHub Pages) or a server build (Self-hosted/Vercel/Dev)
// We default to server build/dev unless explicitly on GitHub Actions or STATIC_EXPORT is set
const isStatic = process.env.GITHUB_ACTIONS === 'true' || process.env.STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  // Only use 'export' when strictly required (e.g. GitHub Pages)
  output: isStatic ? 'export' : undefined,

  // Configure 'basePath' for GitHub Pages deployment only
  basePath: (isProd && process.env.GITHUB_ACTIONS) ? '/smartgrader-v2' : '',

  // Disable server-side image optimization for static builds
  images: {
    unoptimized: true,
  },

  // Expose configuration validity to the client
  env: {
    NEXT_PUBLIC_IS_STATIC: isStatic ? 'true' : 'false',
  },

  // Enable Proxy for Development AND Self-Hosted Server
  // This provides a robust API connection and avoids CORS issues
  async rewrites() {
    // If it's a static export, we can't use server-side rewrites
    if (isStatic) return [];

    return [
      {
        source: '/api/proxy/qwen',
        destination: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      },
    ];
  },
};

export default nextConfig;
