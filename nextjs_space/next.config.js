const path = require('path');

/** @type {import('next').NextConfig} */

// CSP: allow same-origin + CDN fonts/icons; tighten before go-live if needed
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  connect-src 'self';
  frame-src 'self' blob:;
  object-src 'self' blob:;
  frame-ancestors 'none';
`.replace(/\n/g, ' ');

const securityHeaders = [
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stop MIME sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Referrer leakage control
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restrict browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  // XSS filter (legacy browsers)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
];

const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
  async headers() {
    // Headers cho baocao.html cho phép nhúng iframe trong cùng origin
    const iframeEmbedHeaders = [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Content-Security-Policy',
        value: `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self';`,
      },
    ];

    return [
      // Exception: baocao.html cần được nhúng vào iframe trong cùng origin
      {
        source: '/baocao.html',
        headers: iframeEmbedHeaders,
      },
      {
        source: '/reports/baocao.html',
        headers: iframeEmbedHeaders,
      },
      // Default: security headers cho tất cả paths còn lại
      {
        source: '/((?!baocao\\.html|reports/baocao\\.html).*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
