# myfolio

The source for akhilkumars.com — my portfolio site.

A static Astro site with a WebGL flow-field backdrop, a per-character text scramble,
a swipeable work carousel, and a case-study page generated from each project markdown file.

## Live

- Site — [akhilkumars.com](https://akhilkumars.com)
- Case studies — `/work/ridesense`, `/work/elevio`, `/work/sipsavvy`, `/work/aadhaarxtract`

Built for `akhilkumars.com`, which is set as `site` in `astro.config.mjs` — so
canonical URLs and the OG image always point at that hostname, whatever URL the
build happens to be served from.

## Stack

- **Astro 5 + `output: "static"`** — every route prerenders to plain HTML. No SSR, no adapter.
- **Three.js + custom GLSL** — the domain-warped flow field behind the page. Dynamically imported after first paint, so it never blocks content.
- **Lenis** — smooth scroll, plus in-page anchor animation.
- **IBM Plex Sans + IBM Plex Mono via `@fontsource`** — self-hosted, no runtime Google Fonts request.
- **`@astrojs/sitemap`** — generates `sitemap-index.xml`; `robots.txt` is a route.
- **TypeScript** throughout, checked with `astro check`.

No Tailwind, no React/Vue/Svelte. Vanilla scoped CSS with custom-property tokens
in `src/styles/global.css`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run dev:mobile` | Same, bound to the network so a phone can reach it |
| `npm run build` | Prerender to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run preview:mobile` | Same, on the network |
| `npm run check` | `astro check` typecheck |

## Structure

```
src/
├── components/         SiteHeader, Hero, About, WorkList, Experience,
│                       StackTable, Contact, FlowField
├── content/work/       One markdown file per project
├── content.config.ts   Zod schema for those files
├── data/site.ts        Name, role, lede, about, links, experience, stack table
├── layouts/Base.astro  SEO head, JSON-LD, ClientRouter, all scroll JS
├── pages/              index, 404, robots.txt.ts, work/[...slug].astro
├── scripts/            scramble.ts, theme.ts
└── styles/global.css   Tokens + shared primitives
```

## Notes

- **Content lives in two places.** Prose, links, experience and the stack table are
  in `src/data/site.ts`; projects are one markdown file each in `src/content/work/`.
  Adding a project means adding a file — the card, the case-study route and the
  sitemap entry all follow. The schema is in `src/content.config.ts`.

- **Content must be in the HTML on first paint.** This site replaced one that
  rendered a fake terminal boot sequence before showing anything, so crawlers saw
  an empty page. No preloader, no client-render gate, nothing that delays text.
  Verify with `npm run build && npm run preview`, then view source — if the project
  copy is in the HTML, that stays fixed.

- **The canonical hostname is hard-coded** as `site` in `astro.config.mjs`. Every
  canonical URL, the sitemap and the OG image URL are built from it, so it has to
  match the domain you actually deploy to — including whether that domain is
  `www` or the apex.

- **The text scramble never withholds text.** It reads the real string out of the
  server-rendered DOM, animates over it, and restores the original markup. Crawlers,
  no-JS visitors and reduced-motion visitors all get the finished text.

- **Everything respects `prefers-reduced-motion`.** The backdrop renders a single
  frame and never loops, Lenis doesn't initialise, and the scramble doesn't touch
  the DOM at all.

- **Deploys to Vercel with no config.** There is no `vercel.json` and no adapter —
  the output is plain static files, so Vercel detects Astro, runs `npm run build`
  and serves `dist/`.

- **Dark by default, with a light theme.** It follows the system setting until the
  header toggle is used, then remembers the choice. An inline script in `<head>`
  sets it before first paint, so there's no flash. The backdrop is the same in
  both; light mode tints the paper with pale washes instead of adding light.
