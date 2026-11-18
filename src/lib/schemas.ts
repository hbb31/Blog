/**
 * Zod schemas for the Astro content collections.
 *
 * These mirror `keystatic.config.ts`. They live in a plain module (not
 * `content.config.ts`) so `scripts/check-schemas.ts` can import them in Node
 * and compare field names with the Keystatic config.
 */
import { z } from 'astro/zod';

/** Keystatic writes empty optional fields as '' or null; treat both as "not set". */
const emptyToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v);
const optionalString = () => z.preprocess(emptyToUndefined, z.string().optional());
const optionalUrl = () => z.preprocess(emptyToUndefined, z.url().optional());
const optionalDate = () => z.preprocess(emptyToUndefined, z.coerce.date().optional());
const optionalImage = <I extends z.ZodType>(image: () => I) => z.preprocess(emptyToUndefined, image().optional());

const socialLink = z.object({ label: z.string(), url: z.url() });

export const postSchema = <I extends z.ZodType, C extends z.ZodType>(image: () => I, categoryRef: () => C) =>
  z
    .object({
      title: z.string().min(1),
      excerpt: z.string().min(1).max(200),
      status: z.enum(['draft', 'published']).default('draft'),
      publishedAt: z.coerce.date(),
      updatedAt: optionalDate(),
      categories: z.array(categoryRef()).min(1, 'Every post needs at least one category.'),
      tags: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      coverImage: optionalImage(image),
      coverAlt: optionalString(),
      coverCaption: optionalString(),
      seoTitle: optionalString(),
      ogImage: optionalImage(image),
      canonicalUrl: optionalUrl(),
    })
    .refine((p) => !p.coverImage || (p.coverAlt && p.coverAlt.trim().length > 0), {
      message: 'coverAlt is required when coverImage is set.',
      path: ['coverAlt'],
    });

export const categorySchema = () =>
  z.object({
    name: z.string().min(1),
    description: optionalString(),
    order: z.number().int().default(10),
  });

export const pageSchema = () =>
  z.object({
    title: z.string().min(1),
    description: optionalString(),
    showInNav: z.boolean().default(false),
    navOrder: z.number().int().default(50),
    template: z.enum(['default', 'about', 'contact']).default('default'),
  });

export const authorSchema = <I extends z.ZodType>(image: () => I) =>
  z
    .object({
      name: z.string().min(1),
      photo: optionalImage(image),
      photoAlt: optionalString(),
      shortBio: z.string().min(1),
      longBio: optionalString(),
      socialLinks: z.array(socialLink).default([]),
    })
    .refine((a) => !a.photo || a.photoAlt, { message: 'photoAlt is required when photo is set.', path: ['photoAlt'] });

export const settingsSchema = <I extends z.ZodType>(image: () => I) =>
  z.object({
    title: z.string().min(1),
    tagline: optionalString(),
    siteUrl: z.url(),
    description: optionalString(),
    defaultOgImage: optionalImage(image),
    newsletter: z.object({
      heading: optionalString(),
      copy: optionalString(),
      buttondownUsername: optionalString(),
    }),
    footerText: optionalString(),
    socialLinks: z.array(socialLink).default([]),
  });

/** Field names that exist only in Keystatic because they are the MDX body (not frontmatter). */
export const contentFields = { posts: ['body'], pages: ['body'] } as const;
