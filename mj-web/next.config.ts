import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The old mock admin dashboard and login were replaced by the portal.
  // Firebase Hosting turns these into its own redirects on deploy.
  async redirects() {
    return [
      { source: "/admin", destination: "/portal", permanent: false },
      { source: "/login", destination: "/portal/login", permanent: false },
    ];
  },
};

export default nextConfig;
