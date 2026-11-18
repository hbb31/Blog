# Blog + Keystatic CMS

"The Randos": personal blog (IT, games, memes, random). Astro static site, Keystatic git-based CMS, Netlify hosting, Pagefind search.

## Commands

- `npm run dev`: site at http://127.0.0.1:4321, CMS at http://127.0.0.1:4321/keystatic (local mode writes files directly). Drafts are visible in dev.
- `npm run build`: schema drift check → `astro build` → Pagefind index on `dist/`
- `npm run preview`: serve `dist/` (search only works here, not in dev)
- `npm test`: Playwright + axe on the built site (build first). `npm run test:cms`: CMS end-to-end against dev.
- `npm run check` (astro check), `npm run lint`, `npm run format`, `npm run check:contrast`, `npm run check:schemas`, `npm run lhci`
- If Playwright can't find its browser locally, set `PW_CHROMIUM_PATH=/path/to/chrome`.

## Architecture

- Output is static. Only `/keystatic` and `/api/keystatic` run on demand, as a Netlify Function (`@astrojs/netlify`, `imageCDN: false`).
- Publishing: CMS (GitHub mode) commits to a `cms-*` branch → PR → Netlify deploy preview (drafts shown, noindex) → merge to `main` → production deploy.
- `src/lib/env.ts` decides drafts and noindex from Netlify's `CONTEXT`. Production never shows drafts.
- Markdown runs through `unified()` (`@astrojs/markdown-remark`, not Astro 7's default Sätteri) for two plugins: `remark-text-footnotes` (footnotes survive Keystatic saves) and `rehype-unwrap-images` (figures with captions).

## Content model (keep these two in sync: `npm run check:schemas` fails the build on drift)

- `keystatic.config.ts`: CMS fields
- `src/lib/schemas.ts`: Zod schemas used by `src/content.config.ts`
- posts `src/content/posts/*.mdx` (≥1 category, `status` draft|published), categories `*.yaml`, pages `*.mdx` (template default|about|contact), singletons `src/content/singletons/{author,settings}.json`
- Images live in `src/assets/images/{collection}/{slug}/` and are referenced by relative paths.
- Posts in `IMAGE_FIRST_CATEGORIES` (`src/lib/content.ts`, currently `memes`) use the image-first card and a grid on their archive.
- `getPosts()` throws if a post references a deleted category (Astro alone only logs it).

## Do

- Design: serif for article body text, chunky sans (`--font-display`) for headings and the wordmark, violet accent, yellow highlight (decorative only).
- Put colours, spacing and fonts in `src/styles/tokens.css` only; run `check:contrast` after changing colours.
- Keep JS to small vanilla `<script>`s (dropdown, menu, share, theme, search, contact). No client framework on public pages.
- Filters and navigation must work without JS (real links).
- Pin exact dependency versions. Check current docs before upgrading Astro, Keystatic or Pagefind.
- Mark placeholder copy with `PLACEHOLDER`.

## Don't

- Don't add trackers, third-party scripts, cookies or Google Fonts.
- Don't use `trailingSlash: 'always'` (it breaks Keystatic's API routes).
- Don't give a CMS page a reserved slug (blog, search, keystatic, api…).
- Don't commit `.env`.
