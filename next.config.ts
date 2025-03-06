/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export" as const,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: "**",
      },
    ],
  },
  trailingSlash: true,
};

export default nextConfig;
