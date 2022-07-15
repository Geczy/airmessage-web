/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["sa.airmessage.org"],
  },
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      use: "raw-loader",
    });
    return config;
  },
};

module.exports = nextConfig;
