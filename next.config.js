/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Enable better error reporting
    serverComponentsExternalPackages: [],
  },
  webpack: (config, { dev, isServer }) => {
    // Force single React instance
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        react: require.resolve('react'),
        'react-dom': require.resolve('react-dom'),
      };
    }
    
    // Add source maps for better debugging
    if (dev) {
      config.devtool = 'eval-source-map';
    }
    
    return config;
  },
  // Enable better error reporting
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;
