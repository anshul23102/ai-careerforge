import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) sets up a worker module at runtime; Turbopack's
  // server bundling doesn't emit that file where pdfjs-dist expects it, so it
  // must run via native Node `require` instead of being bundled.
  serverExternalPackages: ['pdf-parse'],
  // npm workspaces hoist shared deps (including `next` itself) to the
  // monorepo root's node_modules, one level above this project — point
  // Turbopack there instead of guessing from unrelated lockfiles on disk.
  turbopack: {
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;
