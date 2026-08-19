import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) sets up a worker module at runtime; Turbopack's
  // server bundling doesn't emit that file where pdfjs-dist expects it, so it
  // must run via native Node `require` instead of being bundled.
  // @napi-rs/canvas ships native .node binaries per-platform — these must
  // never be bundled by Turbopack (bundling breaks native addon loading).
  serverExternalPackages: ['pdf-parse', '@napi-rs/canvas'],
  // npm workspaces hoist shared deps (including `next` itself) to the
  // monorepo root's node_modules, one level above this project — point
  // Turbopack there instead of guessing from unrelated lockfiles on disk.
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  // Without this, Next's serverless output file tracing infers its own
  // root independently of the turbopack.root setting above, and can pick
  // an unrelated ancestor directory (e.g. a stray lockfile above the repo)
  // — producing broken relative paths for traced dependencies like
  // pdf-parse that live in the monorepo root's node_modules. This must
  // match turbopack.root exactly.
  outputFileTracingRoot: path.join(__dirname, ".."),
  // pdf-parse is only reachable through the @ai-careerforge/parsers workspace
  // symlink, not as a direct dependency of this project — Next's automatic
  // file tracing can fail to correctly package it (and its worker/font
  // assets) for deployment in that case. Force-include it explicitly for
  // the routes that use it.
  outputFileTracingIncludes: {
    '/api/parse-resume': [
      '../node_modules/pdf-parse/**/*',
      '../node_modules/mammoth/**/*',
      '../node_modules/word-extractor/**/*',
      '../node_modules/rtf-to-text/**/*',
      '../node_modules/@napi-rs/canvas/**/*',
      '../node_modules/@napi-rs/canvas-*/**/*',
    ],
  },
};

export default nextConfig;
