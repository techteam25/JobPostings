/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "media.licdn.com",
      },
      {
        protocol: "https",
        hostname: "*.licdn.com",
        pathname: "/dms/image/**", // More restrictive - only image paths
      },
    ],
  },
};

module.exports = nextConfig;
