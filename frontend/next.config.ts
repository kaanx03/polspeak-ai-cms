import type { NextConfig } from "next";

/**
 * In production the API gateway serves both this frontend and the API (same origin).
 * In development (`next dev`) the browser talks to this server, so `/api/*` is
 * forwarded to the gateway, which listens on API_GATEWAY_URL (default http://localhost:8080).
 */
const apiGatewayUrl = process.env.API_GATEWAY_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiGatewayUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
