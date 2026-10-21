import type { NextConfig } from 'next';

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
let beHostname = 'localhost';
let bePort = '3001';
let beProtocol: 'http' | 'https' = 'http';

try {
  const parsed = new URL(backendUrl);
  beHostname = parsed.hostname;
  bePort = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
  beProtocol = parsed.protocol.replace(':', '') as 'http' | 'https';
} catch {
  // Use defaults if URL parsing fails
}

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '127.0.0.1',
        pathname: '/**',
      },
      ...(beHostname !== 'localhost' && beHostname !== '127.0.0.1'
        ? [
            {
              protocol: beProtocol,
              hostname: beHostname,
              pathname: '/**',
            },
          ]
        : []),
    ],
  },
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
