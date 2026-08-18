import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) sets up a worker module at runtime; Turbopack's
  // server bundling doesn't emit that file where pdfjs-dist expects it, so it
  // must run via native Node `require` instead of being bundled.
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
