const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-maps-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    },
    {
      urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'mapbox-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    }
  ],
  buildExcludes: [/middleware-manifest\.json$/]
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  env: {
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://api.mapbox.com'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,POST,PUT,DELETE,PATCH'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Origin, X-Requested-With, Content-Type, Accept'
          }
        ]
      }
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          has: [
            {
              type: 'header',
              key: 'content-type',
              value: '(.*)'
            }
          ],
          destination: '/api/:path*'
        }
      ]
    }
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        http2: false,
      };
    }
    return config;
  },
}

module.exports = withPWA(nextConfig)
