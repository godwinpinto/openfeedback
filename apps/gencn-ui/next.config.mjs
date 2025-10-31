import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX({
  // customise the config file path
   configPath: "source.config.ts"
});


/** @type {import('next').NextConfig} */
const config = {
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms.mdx/:path*',
      },
    ];
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tailwindcss.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ['typescript', 'twoslash'],
};
export default withMDX(config);
