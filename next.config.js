/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow audio-provider-hosted cover art. Replace with your actual provider's CDN host.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

module.exports = nextConfig;
