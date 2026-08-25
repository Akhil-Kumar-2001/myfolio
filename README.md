# akhilkumars.com

Personal site. Astro, plain scoped CSS, markdown content. Dark only, on purpose.

No loading screen — every word is in the HTML on first byte. The site it replaced
rendered a fake terminal boot sequence before showing anything, so crawlers and
link previews got an empty page. That's the constraint everything else here bends
around.

## Client JS

Measured gzipped, from `dist/_astro`:

| What | Size |
|---|---|
| Astro view-transitions router | 4.4 KB |
| Page script — Lenis, scroll logic, text scramble | 8.3 KB |
| Backdrop bootstrap | 3.4 KB |
| Per-page shims | 1.1 KB |
| **Subtotal** | **17.3 KB** |
| `three` | 185.1 KB |

`three` is dynamically imported after first paint, so it is never in the critical
path and never blocks content. It is still 185 KB — 91% of the total — that a
visitor on a phone eventually pays for a decorative background, and it is doing
very little of the work: one fullscreen quad with a `ShaderMaterial`, no scene
graph, no camera rig, no geometry. A raw WebGL context would do the same job for
about 1 KB.

That trade is a deliberate choice, not an oversight. If it stops feeling worth it,
`src/components/FlowField.astro` is the only file to delete — nothing else imports
`three`, and the CSS gradient fallback inside it already looks fine alone.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run dev:mobile   # same, exposed on the LAN for real-device testing
npm run build
npm run preview  # serve the real build — check this before deploying
npm run check    # astro check / typescript
```

Static output, no adapter. Deploys as-is to Vercel, Netlify or any static host.

Two things worth knowing when testing on a phone: `dev` serves images through
`/_image?href=…`, a URL that does **not** change when the source image does, so a
phone will happily show a cached old image. `preview` serves content-hashed
filenames instead and can't do that. And never run `dev` and `preview` at once —
on Windows both can bind 4321, one on localhost and one on all interfaces, and
your laptop and phone then quietly talk to different servers.

## Structure

| Path | What's in it |
|---|---|
| `src/data/site.ts` | Name, role, lede, about, links, experience, stack table |
| `src/content/work/*.md` | One file per project. Frontmatter is type-checked |
| `src/content.config.ts` | Zod schema for the above |
| `src/styles/global.css` | Palette tokens and shared layout primitives |
| `src/layouts/Base.astro` | SEO head, JSON-LD, router, Lenis, all scroll logic |
| `src/components/` | SiteHeader, Hero, About, WorkList, Experience, StackTable, Contact, FlowField |
| `src/scripts/scramble.ts` | Text scramble — see below |
| `src/pages/index.astro` | Homepage |
| `src/pages/work/[...slug].astro` | Case-study page per project |
| `src/pages/404.astro` | Not-found page |
| `src/pages/robots.txt.ts` | Generated `robots.txt` |

Adding a project = adding one markdown file. Nothing else to touch.

`src/assets/` holds only what the build imports — currently one image, the 404
artwork. The originals it and the favicons were derived from are kept out of the
repo; see `design/NOTES.md` locally if you have it.

## Palette

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#15171A` | Page |
| `--raised` | `#1D2024` | Code blocks, raised surfaces |
| `--text` | `#E7E5DF` | Body |
| `--soft` | `#8A8B85` | Secondary prose |
| `--faint` | `#7B7D77` | Metadata, rail |
| `--rule` | `#2A2D31` | Hairlines |
| `--accent` | `#86A94E` | Moss. Eyebrows, hover, links |
| `--bone` | `#D9CBA3` | Store links only |

Moss is the accent; bone is reserved for the App Store and Play Store links so
they read as the most concrete thing on the page. Spend bone anywhere else and
that stops working.

## Stack table

Buckets: `daily`, `comfortable`, `shipped with`, `learning`. Only `daily` gets the
accent colour — if everything is highlighted, nothing is. Keeping them honest is
the entire point; nobody believes a "90% React" bar, everybody believes
"comfortable".

## The text scramble

`src/scripts/scramble.ts`, ~1.9 KB gzip. Characters churn through random glyphs
and settle left to right, on the header, the hero, the section labels, the Stack
group headers and the footer. Once per element per session.

It never withholds text. The real string is read out of the DOM the server already
sent, animated over in place, and the original put back when it finishes — so
crawlers, no-JS visitors and `prefers-reduced-motion` visitors all get finished
text and never see it run. That is the only reason it coexists with the
no-loading-screen rule.

Three things in there are load-bearing:

- **Monospace text is not split at all.** Every glyph in a mono face shares one
  advance width, so a scrambled string is exactly as wide as the real one and the
  whole thing is rewritten through one `nodeValue` assignment. Splitting it into
  per-character boxes instead put dozens of extra inline-blocks inside a
  `position: sticky` element — which only exists above `56rem` — and produced a
  scroll judder that showed up on laptops and never on phones.
- **Only the hero `<h1>` splits**, because its face is proportional and a swapped
  glyph there really does change width. Each character gets an inline-block pinned
  to its measured width, and the original markup is restored rather than rebuilt,
  because per-character spans lose kerning and ligatures.
- **Elements are seeded below the fold and frozen until they're on screen.**
  Seeding on arrival meant you read the label, then watched it scramble and come
  back, which reads as a bug. Freezing while off screen costs no writes; both the
  churn and the resolve start on the frame it appears.

Duration (`delay` + `spread`, per element at the call sites) and rotation speed
(`HOLD_MS`, `TICK_MS`) are independent knobs. Both are wall-clock, so ticking more
often changes the spin and not the timing.

## The backdrop

`FlowField.astro` — one fullscreen quad, three depth planes of domain-warped
ridged noise, parallaxing by different amounts against scroll and cursor. That
parallax is the whole 3D effect; there is no geometry. The shader is hand-written
GLSL: own value noise, 4-octave fBm, a ridged variant creased at the zero
crossings, and a domain warp.

Guards worth knowing before tuning it:

- Renders at 0.58× resolution (0.45× under 700px) and scales up with CSS. It's
  soft noise, so nobody can tell, and it roughly halves the fragment work
- Frame-capped to 48 fps (30 on small screens) — the motion is slow enough that
  this is free
- Pauses entirely when the tab is hidden
- `prefers-reduced-motion` renders exactly one frame and never starts a loop
- No WebGL, or the import fails, and the CSS gradient stays. It is the visible
  layer for the first moments regardless
- `transition:persist` keeps the GL context alive across navigations

If you tune the shader, the one trap: **do not add a radial vignette on top of the
horizontal trough.** The trough dims the centre so text keeps its contrast; a
vignette dims the edges. Together they cancel and the field flattens to nothing.
There is a comment saying so in the fragment shader.

## Efficiency

- Fonts self-hosted via Fontsource — no Google request, no layout shift
- `inlineStylesheets: "auto"` — small CSS inlined, no extra round trip
- Scroll reveals use CSS `animation-timeline: view()` with zero JS in Chrome, Edge
  and Safari. Firefox has no `animation-timeline` yet, so it falls back to an
  IntersectionObserver — see `initReveal` in `Base.astro`
- `three` dynamically imported past first paint, never in the critical path
- Link prefetch on viewport
- `compressHTML` on

## SEO

- Real HTML on first byte. Every project and paragraph is in the source
- One `<h1>` per page — on a case study it's the problem sentence, not a name
- Canonical URL per page, from `site` in `astro.config.mjs`. The 404 deliberately
  has none, and carries `noindex, follow` instead
- Per-page title and description
- Open Graph and Twitter cards, with `public/og-image.png` at 1200×630 and its
  dimensions declared in the tags. The card is rendered from `og.html`-style
  markup in the site’s own IBM Plex rather than drawn by hand, so it
  can be regenerated if the name, role or palette change
- `Person` JSON-LD on the homepage, `CreativeWork` on each case study
- `sitemap-index.xml` generated at build; the 404 is excluded
- `robots.txt` generated at `src/pages/robots.txt.ts`
- Five indexable URLs, not one — the homepage plus one per project

## Open

- [ ] **Host the CV locally.** `site.cv` points at Google Drive, which can prompt
      for sign-in, breaks if permissions change, and sends people off-domain. Put
      the PDF at `public/cv.pdf` and set `cv: "/cv.pdf"`
- [ ] AadhaarXtract: name the fields it extracts, and say whether the OCR runs in
      the browser or under Node. The copy hedges on both
- [ ] `npm run preview`, then view source — the content should be in the HTML
- [ ] Real phone, and PageSpeed Insights on the mobile tab, targeting LCP < 2.5s

## Not included

- No architecture diagrams. For an infrastructure portfolio these would carry more
  weight than the backdrop does — an inline SVG data-flow diagram per project, in
  the palette above
- No shared-element transitions between the work list and case studies. The router
  is already shipping; `transition:name` on the project headlines would morph them
  across navigation for roughly zero bytes
- Light mode. Dark only is a deliberate choice, not an omission
