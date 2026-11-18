import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { authorSchema, categorySchema, pageSchema, postSchema, settingsSchema } from './lib/schemas';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: ({ image }) => postSchema(image, () => reference('categories')),
});

const categories = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/categories' }),
  schema: categorySchema(),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: pageSchema(),
});

const author = defineCollection({
  loader: glob({ pattern: 'author.json', base: './src/content/singletons' }),
  schema: ({ image }) => authorSchema(image),
});

const settings = defineCollection({
  loader: glob({ pattern: 'settings.json', base: './src/content/singletons' }),
  schema: ({ image }) => settingsSchema(image),
});

export const collections = { posts, categories, pages, author, settings };
