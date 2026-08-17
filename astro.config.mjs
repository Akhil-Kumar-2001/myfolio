import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  // Required for canonical URLs and the sitemap. Change to your domain.
  site: "https://akhilkumars.com",
  output: "static",
  integrations: [sitemap()],
  build: {
    // Inline small stylesheets into the HTML so the first paint needs no extra request.
    inlineStylesheets: "auto",
  },
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
});
