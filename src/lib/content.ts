import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import readingTime from 'reading-time';
import { showDrafts } from './env';

export type Post = CollectionEntry<'posts'>;
export type Category = CollectionEntry<'categories'>;
export type Page = CollectionEntry<'pages'>;

export const POSTS_PER_PAGE = 10;

/** Published posts, newest first. Drafts are included only outside production (see env.ts). */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', (p) => showDrafts || p.data.status === 'published');
  return posts.sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

export async function getCategories(): Promise<Category[]> {
  const cats = await getCollection('categories');
  return cats.sort((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name));
}

export async function getCategoryMap(): Promise<Map<string, Category>> {
  return new Map((await getCategories()).map((c) => [c.id, c]));
}

/** Categories with their number of visible posts. */
export async function getCategoriesWithCounts() {
  const [cats, posts] = await Promise.all([getCategories(), getPosts()]);
  return cats.map((category) => ({
    category,
    count: posts.filter((p) => p.data.categories.some((c) => c.id === category.id)).length,
  }));
}

export async function getTags(): Promise<{ tag: string; slug: string; count: number }[]> {
  const counts = new Map<string, { tag: string; count: number }>();
  for (const post of await getPosts()) {
    for (const tag of post.data.tags) {
      const slug = slugify(tag);
      const entry = counts.get(slug) ?? { tag, count: 0 };
      entry.count += 1;
      counts.set(slug, entry);
    }
  }
  return [...counts.entries()]
    .map(([slug, v]) => ({ slug, ...v }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function getNavPages(): Promise<Page[]> {
  const pages = await getCollection('pages', (p) => p.data.showInNav);
  return pages.sort((a, b) => a.data.navOrder - b.data.navOrder);
}

export async function getSettings() {
  const entry = await getEntry('settings', 'settings');
  if (!entry) throw new Error('Missing src/content/singletons/settings.json');
  return entry.data;
}

export async function getAuthor() {
  const entry = await getEntry('author', 'author');
  if (!entry) throw new Error('Missing src/content/singletons/author.json');
  return entry.data;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function readingMinutes(post: Post): number {
  return Math.max(1, Math.round(readingTime(post.body ?? '').minutes));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

export const postUrl = (post: Post) => `/blog/${post.id}/`;
export const categoryUrl = (id: string) => `/blog/category/${id}/`;
export const tagUrl = (tag: string) => `/blog/tag/${slugify(tag)}/`;

/** Up to `limit` related posts: same category first, then shared tags, then newest. */
export function relatedPosts(post: Post, all: Post[], limit = 3): Post[] {
  const cats = new Set(post.data.categories.map((c) => c.id));
  const tags = new Set(post.data.tags.map(slugify));
  return all
    .filter((p) => p.id !== post.id)
    .map((p) => {
      const sharedCats = p.data.categories.filter((c) => cats.has(c.id)).length;
      const sharedTags = p.data.tags.filter((t) => tags.has(slugify(t))).length;
      return { p, score: sharedCats * 10 + sharedTags };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.data.publishedAt.valueOf() - a.p.data.publishedAt.valueOf())
    .slice(0, limit)
    .map((x) => x.p);
}
