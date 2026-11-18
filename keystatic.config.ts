import { collection, config, fields, singleton } from '@keystatic/core';
import { block, wrapper } from '@keystatic/core/content-components';

/**
 * Keystatic CMS configuration.
 *
 * Local mode (default) writes straight to the files in this repo.
 * GitHub mode (PUBLIC_KEYSTATIC_STORAGE=github) commits to branches in the
 * repo; each branch gets a Netlify preview, and merging to `main` publishes.
 *
 * Keep this file in sync with `src/lib/schemas.ts`: `npm run check:schemas`
 * fails the build when the field lists drift apart.
 */

// `?? {}` lets plain Node (scripts/check-schemas.ts) import this file too.
const env: Partial<Record<string, string>> = import.meta.env ?? {};
const useGitHub = env.PUBLIC_KEYSTATIC_STORAGE === 'github';
const repo = (env.PUBLIC_KEYSTATIC_GITHUB_REPO || 'hbb31/Blog') as `${string}/${string}`;
const netlifySite = env.PUBLIC_NETLIFY_SITE_NAME;

/** Branch preview URL on Netlify, e.g. https://cms-my-post--mysite.netlify.app/blog/my-post/ */
const previewUrl = (path: string) => (netlifySite ? `https://{branch}--${netlifySite}.netlify.app${path}` : undefined);

/** Rich-text components available in post and page bodies. */
const bodyComponents = {
  Callout: wrapper({
    label: 'Callout',
    description: 'A highlighted aside: note, tip or warning.',
    schema: {
      tone: fields.select({
        label: 'Tone',
        options: [
          { label: 'Note', value: 'note' },
          { label: 'Tip', value: 'tip' },
          { label: 'Warning', value: 'warning' },
        ],
        defaultValue: 'note',
      }),
      title: fields.text({ label: 'Title (optional)' }),
    },
  }),
  PullQuote: block({
    label: 'Pull quote',
    description: 'A large quotation that breaks up long-form text.',
    schema: {
      quote: fields.text({ label: 'Quote', multiline: true, validation: { isRequired: true } }),
      cite: fields.text({ label: 'Attribution (optional)' }),
    },
  }),
};

const bodyField = (collectionName: 'posts' | 'pages') =>
  fields.mdx({
    label: 'Body',
    options: {
      image: {
        directory: `src/assets/images/${collectionName}`,
        publicPath: `../../assets/images/${collectionName}/`,
      },
    },
    components: bodyComponents,
  });

export default config({
  storage: useGitHub ? { kind: 'github', repo, branchPrefix: 'cms-' } : { kind: 'local' },
  ui: {
    brand: { name: 'Blog CMS' },
    navigation: {
      Content: ['posts', 'pages'],
      Taxonomy: ['categories'],
      Settings: ['author', 'settings'],
    },
  },
  collections: {
    posts: collection({
      label: 'Posts',
      slugField: 'title',
      path: 'src/content/posts/*',
      entryLayout: 'content',
      format: { contentField: 'body' },
      columns: ['title', 'status', 'publishedAt'],
      previewUrl: previewUrl('/blog/{slug}/'),
      schema: {
        title: fields.slug({
          name: { label: 'Title', validation: { isRequired: true } },
          slug: { label: 'Slug', description: 'Generated from the title. Becomes the URL: /blog/<slug>/' },
        }),
        excerpt: fields.text({
          label: 'Excerpt',
          description: 'Shown on cards and as the meta description. Max 200 characters.',
          multiline: true,
          validation: { isRequired: true, length: { min: 1, max: 200 } },
        }),
        status: fields.select({
          label: 'Status',
          description: 'Drafts are never published to the live site.',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
          ],
          defaultValue: 'draft',
        }),
        publishedAt: fields.date({
          label: 'Published date',
          defaultValue: { kind: 'today' },
          validation: { isRequired: true },
        }),
        updatedAt: fields.date({ label: 'Updated date (optional)' }),
        categories: fields.multiRelationship({
          label: 'Categories',
          description: 'At least one category is required.',
          collection: 'categories',
          validation: { length: { min: 1 } },
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value,
        }),
        featured: fields.checkbox({ label: 'Featured on the Home page', defaultValue: false }),
        coverImage: fields.image({
          label: 'Cover image',
          directory: 'src/assets/images/posts',
          publicPath: '../../assets/images/posts/',
        }),
        coverAlt: fields.text({
          label: 'Cover image alt text',
          description: 'Required when there is a cover image. Describe the image for screen readers.',
        }),
        coverCaption: fields.text({ label: 'Cover image caption (optional)' }),
        seoTitle: fields.text({ label: 'SEO title (optional)', description: 'Overrides the <title> tag.' }),
        ogImage: fields.image({
          label: 'Social share image (optional)',
          description: 'Defaults to the cover image, then the site default.',
          directory: 'src/assets/images/posts',
          publicPath: '../../assets/images/posts/',
        }),
        canonicalUrl: fields.url({ label: 'Canonical URL (optional)' }),
        body: bodyField('posts'),
      },
    }),

    categories: collection({
      label: 'Categories',
      slugField: 'name',
      path: 'src/content/categories/*',
      format: { data: 'yaml' },
      columns: ['name', 'order'],
      schema: {
        name: fields.slug({
          name: { label: 'Name', validation: { isRequired: true } },
          slug: { label: 'Slug', description: 'URL: /blog/category/<slug>/' },
        }),
        description: fields.text({ label: 'Description', multiline: true }),
        order: fields.integer({ label: 'Order in menus', defaultValue: 10 }),
      },
    }),

    pages: collection({
      label: 'Pages',
      slugField: 'title',
      path: 'src/content/pages/*',
      entryLayout: 'content',
      format: { contentField: 'body' },
      columns: ['title', 'showInNav', 'navOrder'],
      previewUrl: previewUrl('/{slug}/'),
      schema: {
        title: fields.slug({
          name: { label: 'Title', validation: { isRequired: true } },
          slug: { label: 'Slug', description: 'URL: /<slug>/' },
        }),
        description: fields.text({ label: 'Meta description (optional)', multiline: true }),
        showInNav: fields.checkbox({ label: 'Show in top navigation', defaultValue: false }),
        navOrder: fields.integer({ label: 'Navigation order', defaultValue: 50 }),
        template: fields.select({
          label: 'Template',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'About (shows the author profile)', value: 'about' },
            { label: 'Contact (adds the contact form)', value: 'contact' },
          ],
          defaultValue: 'default',
        }),
        body: bodyField('pages'),
      },
    }),
  },

  singletons: {
    author: singleton({
      label: 'Author',
      path: 'src/content/singletons/author',
      format: { data: 'json' },
      schema: {
        name: fields.text({ label: 'Name', validation: { isRequired: true } }),
        photo: fields.image({
          label: 'Photo',
          directory: 'src/assets/images/author',
          publicPath: '../../assets/images/author/',
        }),
        photoAlt: fields.text({ label: 'Photo alt text' }),
        shortBio: fields.text({
          label: 'Short bio (shown on every post)',
          multiline: true,
          validation: { isRequired: true },
        }),
        longBio: fields.text({ label: 'Long bio (About page)', multiline: true }),
        socialLinks: fields.array(
          fields.object({
            label: fields.text({ label: 'Label (e.g. Mastodon)', validation: { isRequired: true } }),
            url: fields.url({ label: 'URL', validation: { isRequired: true } }),
          }),
          { label: 'Social links', itemLabel: (props) => props.fields.label.value },
        ),
      },
    }),

    settings: singleton({
      label: 'Site settings',
      path: 'src/content/singletons/settings',
      format: { data: 'json' },
      schema: {
        title: fields.text({ label: 'Site title', validation: { isRequired: true } }),
        tagline: fields.text({ label: 'Tagline' }),
        siteUrl: fields.url({
          label: 'Site URL',
          description: 'Production URL, e.g. https://example.com. Used for canonical links, RSS and the sitemap.',
          validation: { isRequired: true },
        }),
        description: fields.text({ label: 'Default meta description', multiline: true }),
        defaultOgImage: fields.image({
          label: 'Default social share image',
          directory: 'src/assets/images/site',
          publicPath: '../../assets/images/site/',
        }),
        newsletter: fields.object(
          {
            heading: fields.text({ label: 'Heading' }),
            copy: fields.text({ label: 'Copy', multiline: true }),
            buttondownUsername: fields.text({
              label: 'Buttondown username',
              description: 'The form posts to https://buttondown.com/api/emails/embed-subscribe/<username>',
            }),
          },
          { label: 'Newsletter' },
        ),
        footerText: fields.text({ label: 'Footer text', multiline: true }),
        socialLinks: fields.array(
          fields.object({
            label: fields.text({ label: 'Label', validation: { isRequired: true } }),
            url: fields.url({ label: 'URL', validation: { isRequired: true } }),
          }),
          { label: 'Social profile links', itemLabel: (props) => props.fields.label.value },
        ),
      },
    }),
  },
});
