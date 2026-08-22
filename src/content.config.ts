import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const work = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/work" }),
  schema: z.object({
    name: z.string(),
    /** Homepage sort order. Lower shows first. */
    order: z.number(),
    year: z.string(),
    role: z.string(),

    /** The problem, as one sentence. Becomes the h1. No tech names. */
    problem: z.string(),

    /** One or two lines for the card. The detail page carries the depth. */
    summary: z.string(),

    /** What you built and what it does. Two or three sentences. */
    outcome: z.string(),

    stack: z.array(z.string()),

    /** Any number of labelled links. Set store: true to give one emphasis. */
    links: z
      .array(
        z.object({
          label: z.string(),
          url: z.string().url(),
          store: z.boolean().default(false),
        }),
      )
      .default([]),

    published: z.boolean().default(true),
  }),
});

export const collections = { work };
