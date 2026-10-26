// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://freshcan-ec.neilnicholaskanat.workers.dev",
  trailingSlash: "ignore",
  devToolbar: { enabled: false },
  image: { responsiveStyles: false },
  build: { inlineStylesheets: "auto" },
});
