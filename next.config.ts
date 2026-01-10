import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize noble and its dependencies - they have native bindings
  // that can't be bundled by webpack/turbopack
  serverExternalPackages: [
    '@abandonware/noble',
    '@abandonware/bluetooth-hci-socket',
    'ws',
  ],

  // Turbopack configuration (Next.js 16+ default)
  turbopack: {
    // Empty config to acknowledge Turbopack usage
  },
};

export default nextConfig;
