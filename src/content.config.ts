import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/** Legal documents: one markdown file per page under src/content/legal/. The file name is the URL. */
const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    showSeller: z.boolean().default(false),
  }),
});

export const collections = { legal };
