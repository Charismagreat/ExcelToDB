import type { NextConfig } from "next";

/**
 * 🔍 Next.js Configuration
 * Handles BasePath and AssetPrefix for tunneled or proxied environments.
 */
const nextConfig: NextConfig = {
  // Use the environment variable for both basePath and assetPrefix consistently
  basePath: process.env.EGDESK_BASE_PATH || '',
  assetPrefix: process.env.EGDESK_BASE_PATH || '',
  
  typescript: {
    // Ignore build errors for auto-generated or experimental files
    ignoreBuildErrors: true,
  },
  
  eslint: {
    // Ignore lint errors during build
    ignoreDuringBuilds: true,
  },
  
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  }
};

console.log('🔍 [SYSTEM DIAGNOSTIC] next.config active:', {
  basePath: nextConfig.basePath,
  assetPrefix: nextConfig.assetPrefix,
  nodeEnv: process.env.NODE_ENV
});

export default nextConfig;
