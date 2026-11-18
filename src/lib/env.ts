/**
 * Build context. Netlify sets CONTEXT to "production", "deploy-preview" or
 * "branch-deploy". Anything other than a production build is treated as a
 * preview: it gets `noindex` and may show drafts.
 */
const context = process.env.CONTEXT ?? (import.meta.env.DEV ? 'dev' : 'production');

export const isProductionDeploy = context === 'production';

/** Drafts are visible only in `astro dev` and on preview deploys (SHOW_DRAFTS=true). Never on production. */
export const showDrafts = !isProductionDeploy && (import.meta.env.DEV || process.env.SHOW_DRAFTS === 'true');

export const noindex = !isProductionDeploy;
