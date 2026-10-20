import type { NextConfig } from "next";

const s3Endpoint = process.env.S3_ENDPOINT || "http://minio:9000";
const s3Bucket = process.env.S3_BUCKET || "livon-media";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  serverExternalPackages: ["@prisma/adapter-pg", "pg", "nodemailer"],
  allowedDevOrigins: ["local-origin.dev", "*.local-origin.dev"],
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    // Nginx serves /media in production; this covers `next dev` and the image optimizer's internal fetches.
    return [
      {
        source: "/media/:path*",
        destination: `${s3Endpoint}/${s3Bucket}/:path*`,
      },
    ];
  },
};

export default nextConfig;
