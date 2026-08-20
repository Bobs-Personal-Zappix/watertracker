// Gate B diagnostic build only — see docs/DECISION-LOG.md ARCH-OPEN-01.
// Output is deliberately NOT site/app/bundle.js. The deployed bundle is never
// touched by this script.
require("esbuild")
  .build({
    entryPoints: ["src/app.js"],
    bundle: true,
    outfile: "site/app/bundle.build.js",
    platform: "browser",
    format: "iife",
    minify: false,
    logLevel: "info",
    define: { "process.env.NODE_ENV": '"production"' },
  })
  .catch(() => process.exit(1));
