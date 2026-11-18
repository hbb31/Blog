/**
 * Fails when the Keystatic config and the Astro content schemas drift apart.
 * Compares field names for each collection/singleton. Run: npm run check:schemas
 */
import { z } from 'astro/zod';
import {
  authorSchema,
  categorySchema,
  contentFields,
  pageSchema,
  postSchema,
  settingsSchema,
} from '../src/lib/schemas.ts';

import keystatic from '../keystatic.config.ts';

const image = () => z.string();
const keysOf = (schema: z.ZodType): string[] => {
  // Unwrap .refine()/.preprocess() wrappers until we reach the object shape.
  let s: any = schema;
  while (s && !s.shape) s = s.def?.in ?? s.def?.schema ?? s.def?.innerType;
  if (!s?.shape) throw new Error('Could not read schema shape');
  return Object.keys(s.shape).sort();
};

const pairs: [string, Record<string, unknown> | undefined, z.ZodType, readonly string[]][] = [
  ['posts', keystatic.collections?.posts?.schema, postSchema(image, () => z.string()), contentFields.posts],
  ['categories', keystatic.collections?.categories?.schema, categorySchema(), []],
  ['pages', keystatic.collections?.pages?.schema, pageSchema(), contentFields.pages],
  ['author', keystatic.singletons?.author?.schema, authorSchema(image), []],
  ['settings', keystatic.singletons?.settings?.schema, settingsSchema(image), []],
];

let failed = false;
for (const [name, ksSchema, zodSchema, ignore] of pairs) {
  if (!ksSchema) {
    console.error(`✗ ${name}: missing from keystatic.config.ts`);
    failed = true;
    continue;
  }
  const ks = Object.keys(ksSchema)
    .filter((k) => !ignore.includes(k))
    .sort();
  const astro = keysOf(zodSchema);
  const onlyKs = ks.filter((k) => !astro.includes(k));
  const onlyAstro = astro.filter((k) => !ks.includes(k));
  if (onlyKs.length || onlyAstro.length) {
    failed = true;
    console.error(`✗ ${name}: schemas differ`);
    if (onlyKs.length) console.error(`    only in Keystatic: ${onlyKs.join(', ')}`);
    if (onlyAstro.length) console.error(`    only in Astro:     ${onlyAstro.join(', ')}`);
  } else {
    console.log(`✓ ${name}: ${ks.length} fields in sync`);
  }
}
if (failed) {
  console.error('\nUpdate keystatic.config.ts and src/lib/schemas.ts together.');
  process.exit(1);
}
