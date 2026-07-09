/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/profile", destination: "/account/profile", permanent: false },
      { source: "/orders",  destination: "/account/orders",  permanent: false },
      { source: "/rentals", destination: "/account/rentals", permanent: false },
      { source: "/saved",   destination: "/account/saved",   permanent: false },
      { source: "/settings",destination: "/account/settings",permanent: false },
    ];
  },
};

export default nextConfig;
