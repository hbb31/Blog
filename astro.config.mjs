// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
import keystatic from '@keystatic/astro';
import { unified } from '@astrojs/markdown-remark';
import { rehypeUnwrapImages } from './src/lib/rehype-unwrap-images.mjs';
import { remarkTextFootnotes } from './src/lib/remark-text-footnotes.mjs';

/** The production URL comes from the CMS "Site settings" singleton, with an env override. */
const settings = JSON.parse(readFileSync(new URL('./src/content/singletons/settings.json', import.meta.url), 'utf8'));
const site = process.env.SITE_URL || settings.siteUrl;

/**
 * Output is static: every public page is prerendered to HTML at build time
 * (so Pagefind can index it). Only Keystatic's admin UI and API routes
 * (/keystatic, /api/keystatic) are injected with `prerender: false` and run
 * as a Netlify Function via the adapter.
 */
export default defineConfig({
  site,
  output: 'static',
  // imageCDN: false → images are optimised at build time (works in local preview and tests too).
  adapter: netlify({ imageCDN: false }),
  integrations: [
    mdx(),
    react(),
    keystatic(),
    sitemap({
      filter: (page) => !/\/(keystatic|api|contact\/thanks|search)\//.test(page),
    }),
  ],
  markdown: {
    // remark/rehype pipeline (MDX inherits it); GFM gives tables and footnotes.
    processor: unified({
      remarkPlugins: [remarkTextFootnotes],
      rehypePlugins: [rehypeUnwrapImages],
    }),
    shikiConfig: {
      // High-contrast themes keep code comments above WCAG AA contrast.
      themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' },
      defaultColor: false,
      wrap: false,
    },
  },
  image: {
    responsiveStyles: true,
    layout: 'constrained',
  },
});
