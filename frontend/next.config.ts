import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // npm workspaces hoist shared deps (including `next` itself) to the
  // monorepo root's node_modules, one level above this project — point
  // Turbopack there instead of guessing from unrelated lockfiles on disk.
  turbopack: {
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;
