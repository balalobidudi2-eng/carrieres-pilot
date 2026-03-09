/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude packages that break when bundled by webpack.
      // pdf-parse exports a plain function in CJS but webpack wraps it and breaks the call.
      // mammoth uses dynamic require internally that also needs native module resolution.
      config.externals = [...(config.externals ?? []), 'canvas', 'pdf-parse', 'mammoth'];
    }
    return config;
  },
  images: {
    domains: [
      'res.cloudinary.com',
      'logo.clearbit.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth'],
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};

module.exports = nextConfig;
