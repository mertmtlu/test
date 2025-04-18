// next.config.js
module.exports = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Configure output staticly
  output: 'standalone',
  
  // Disable powered by header for security
  poweredByHeader: false,
  
  // Enable experimental features for better performance
  experimental: {
    // Improve Fast Refresh reliability
    esmExternals: false
  },
  
  // Configure webpack to work with the custom server and enable HMR
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // This ensures HMR and Fast Refresh work properly
      config.devtool = 'eval-source-map';
    }
    
    return config;
  },
}