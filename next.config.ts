import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["@anthropic-ai/sdk", "@arizeai/openinference-instrumentation-anthropic", "@langfuse/tracing", "@langfuse/otel", "@opentelemetry/sdk-node"],
  outputFileTracingIncludes: { "/skill.md": ["./public/skills/our-gardens/SKILL.md"] },
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
};

export default nextConfig;
