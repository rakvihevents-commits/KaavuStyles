const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { dev }) {
    // Avoid missing webpack pack files on Windows during development.
    if (dev) config.cache = { type: 'memory' };
    return config;
  },
  async headers() {
    // Cache only public image files, never pages or authenticated API responses.
    const publicImages = [
      "/icon.jpeg", "/favicon.png", "/icon.webp", "/foundations-home.webp",
    ];
    return publicImages.map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
    }));
  },
  images: {
    unoptimized: true,
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = (phase) => ({
  ...nextConfig,
  // Production builds must not overwrite files used by the dev server.
  distDir: phase === PHASE_DEVELOPMENT_SERVER
    ? `.next-dev-${process.env.KAVVU_DEV_PORT || process.env.PORT || '3000'}`
    : '.next',
});
