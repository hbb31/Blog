import type { APIContext } from 'astro';
import { isProductionDeploy } from '../lib/env';

/** Production allows crawling; preview and branch deploys block it. */
export function GET(context: APIContext) {
  const body = isProductionDeploy
    ? `User-agent: *\nAllow: /\nDisallow: /keystatic/\nDisallow: /api/\n\nSitemap: ${new URL('/sitemap-index.xml', context.site)}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
