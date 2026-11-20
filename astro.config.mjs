import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  // Required for canonical URLs and the sitemap. Change to your domain.
  site: "https://akhilkumars.com",
  output: "static",
  integrations: [sitemap()],
  build: {
    // "always", not "auto": auto only inlines files under 4KB, and both stylesheets
    // are over, so first paint waited on two extra requests. Costs ~6.5KB gzip per
    // page, which ClientRouter navigations fetch anyway.
    inlineStylesheets: "always",
  },
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
});
