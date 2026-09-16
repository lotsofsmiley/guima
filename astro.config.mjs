// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://guimavng.com',
  // Cloudflare Pages serves `dir/index.html` at `/dir/` and 308-redirects the
  // slashless form, so canonical + internal links emit the trailing slash.
  trailingSlash: 'always',
  integrations: [react(), sitemap()],
  image: {
    // Every <Image>/<Picture> gets width:100%/height:auto + aspect-ratio styles,
    // so layout never shifts while photos load.
    responsiveStyles: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
