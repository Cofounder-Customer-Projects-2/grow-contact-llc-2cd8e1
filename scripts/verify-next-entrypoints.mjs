#!/usr/bin/env node

import { existsSync } from "node:fs";

const deprecatedMiddlewareEntrypoints = [
  "middleware.ts",
  "middleware.js",
  "src/middleware.ts",
  "src/middleware.js",
];

const proxyEntrypoints = ["proxy.ts", "proxy.js", "src/proxy.ts", "src/proxy.js"];

const existingDeprecatedEntrypoints =
  deprecatedMiddlewareEntrypoints.filter(existsSync);
const existingProxyEntrypoints = proxyEntrypoints.filter(existsSync);

if (existingDeprecatedEntrypoints.length === 0) {
  process.exit(0);
}

console.error("Deprecated Next.js middleware entrypoints detected.");
console.error("");
console.error(
  `Remove ${existingDeprecatedEntrypoints.join(", ")} and put request interception in proxy.ts instead.`,
);

if (existingProxyEntrypoints.length > 0) {
  console.error("");
  console.error(
    `This repository already has ${existingProxyEntrypoints.join(", ")}. Keeping both middleware and proxy entrypoints can break Vercel packaging.`,
  );
}

process.exit(1);
