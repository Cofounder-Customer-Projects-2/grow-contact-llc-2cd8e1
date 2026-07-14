import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: "src/routes", generatedRouteTree: "src/routeTree.gen.ts" }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  build: {
    outDir: "dist",
    // esbuild 0.28+ (security override) cannot downlevel modern destructuring
    // to Vite's default legacy browser set; target modern evergreen browsers.
    target: ["es2022", "chrome109", "firefox115", "safari16", "edge109"],
  },
});
