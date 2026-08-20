// Build pipeline for src/app.js. Since ARCH-OPEN-01's closure (Aug 20, 2026, see
// docs/DECISION-LOG.md and CLAUDE.md's "Source of truth" section), this is the
// verified path to site/app/bundle.js: build here, verify bundle.build.js
// (harness + lint), then copy over site/app/bundle.js and re-verify against the
// exact deployed file.
require("esbuild")
  .build({
    entryPoints: ["src/app.js"],
    bundle: true,
    outfile: "site/app/bundle.build.js",
    platform: "browser",
    format: "iife",
    minify: true,
    logLevel: "info",
    define: { "process.env.NODE_ENV": '"production"' },
  })
  .catch(() => process.exit(1));
