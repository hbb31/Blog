import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, getSettings, getCategoryMap, postUrl } from '../lib/content';

/** RSS with title + excerpt (readers click through for the full, formatted essay). */
export async function GET(context: APIContext) {
  const [posts, settings, categories] = await Promise.all([getPosts(), getSettings(), getCategoryMap()]);
  return rss({
    title: settings.title,
    description: settings.description ?? settings.tagline ?? '',
    site: context.site!,
    items: posts
      .filter((p) => p.data.status === 'published')
      .map((post) => ({
        title: post.data.title,
        description: post.data.excerpt,
        pubDate: post.data.publishedAt,
        link: postUrl(post),
        categories: post.data.categories.map((c) => categories.get(c.id)?.data.name ?? c.id),
      })),
    customData: '<language>en</language>',
  });
}
