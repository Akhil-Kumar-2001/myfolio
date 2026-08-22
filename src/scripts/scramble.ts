/* Text scramble. Never withholds text: the real string is read from the
   server-rendered DOM, animated over, and put back.

   Monospace text is not split — one nodeValue write per text node. Only the
   hero h1 splits, because Fraunces is proportional. Splitting everything caused
   a laptop-only judder; see CLAUDE.md. */

const POOL =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789<>/\\|[]{}#*+=-_$%&@?!";

const PLAYED_KEY = "scramble:played";

/** Effectively every frame; monospace mode is one write per element per tick. */
const TICK_MS = 16;

/** Rotation speed: how long a cell holds one glyph. Independent of the overall
    duration, which is `delay` + `spread` at the call sites. */
const HOLD_MS = 28;

/** Characters around the resolve frontier that keep moving, so writes per tick
    stay flat instead of scaling with string length. */
const BAND = 10;

/** Hard stop, so a backgrounded tab can never come back to scrambled text. */
const MAX_RUN_MS = 5000;

/** Prepared this far below the fold, so the text has never been legible by the
    time you can see it — it arrives already churning. Gating the *start* on
    arrival instead was the "I read it, then it scrambled" glitch. */
const PREROLL = "0px 0px 25% 0px";

/** Plain intersection. An inset here broke the footer: it sits at the document
    end, so scrolling to the bottom never cleared a bottom inset. */
const IN_FRAME = "0px";

/** Insurance: puts text back on an element that is never scrolled to. */
const STALL_MS = 30000;

type Cell = {
  real: string;
  glyph: string;
  /** Position in the left-to-right sweep, 0 to 1, across the whole element. */
  at: number;
  jitter: number;
  nextSwap: number;
  settled: boolean;
  /** Proportional mode: the text node of this character's own inline-block. */
  node: Text | null;
  /** Monospace mode: the whole-string run this character belongs to. */
  run: Run | null;
};

/** One text node rewritten as a whole. Monospace mode only. */
type Run = {
  node: Text;
  cells: Cell[];
  dirty: boolean;
};

type Job = {
  el: HTMLElement;
  mono: boolean;
  /** Proportional mode only — markup to restore verbatim. */
  html: string | null;
  runs: Run[];
  cells: Cell[];
  priorLabel: string | null;
  pick: (real: string) => string;
  spread: number;
  start: number;
  /** Infinity until whatever we're waiting on resolves. */
  sweepAt: number;
  /** Hold the seed glyphs instead of churning. Only ever true while the element
      is off screen, so it is never a visible pause. */
  frozen: boolean;
};

const jobs = new Set<Job>();
let raf = 0;
let lastTick = 0;

let observer: IntersectionObserver | null = null;
let frameObserver: IntersectionObserver | null = null;
/** In frame per IN_FRAME. A flag set, so the wait loop never reads layout. */
const inFrame = new WeakSet<Element>();
const waitTimers = new Set<number>();

/* ---- once per session ---- */

function playedKeys(): Set<string> {
  try {
    const raw = sessionStorage.getItem(PLAYED_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    // Private mode. Degrades to replaying, which is the harmless direction.
    return new Set<string>();
  }
}

function markPlayed(key: string) {
  try {
    const keys = playedKeys();
    keys.add(key);
    sessionStorage.setItem(PLAYED_KEY, JSON.stringify([...keys]));
  } catch {
    /* ignore */
  }
}

/* ---- reading the text ---- */

/** Text nodes belonging to the visible string, skipping anything inside an
    aria-hidden subtree — the `</` `>` of the brand and the nav's `/` prefixes are
    decoration and must not churn. */
function textNodesUnder(root: HTMLElement): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node) {
      let p = (node as Text).parentElement;
      while (p && p !== root.parentElement) {
        if (p.getAttribute("aria-hidden") === "true") return NodeFilter.FILTER_REJECT;
        if (p === root) break;
        p = p.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode()) !== null) out.push(n as Text);
  return out;
}

function newCell(ch: string): Cell {
  return {
    real: ch,
    glyph: ch,
    at: 0,
    jitter: 0,
    nextSwap: 0,
    // Whitespace never churns — it would turn "Selected work" into one word.
    settled: /\s/.test(ch),
    node: null,
    run: null,
  };
}

/** Monospace: no DOM surgery at all, just a per-character model over the text
    nodes that are already there. */
function buildMono(el: HTMLElement, cells: Cell[], runs: Run[]) {
  for (const node of textNodesUnder(el)) {
    const real = node.nodeValue ?? "";
    if (!real) continue;
    const run: Run = { node, cells: [], dirty: false };
    for (const ch of real) {
      const cell = newCell(ch);
      cell.run = run;
      run.cells.push(cell);
      cells.push(cell);
    }
    runs.push(run);
  }
}

/** Proportional: every character becomes a width-locked inline-block, wrapped
    per word so a line can still only break between words — otherwise "Akhil"
    breaks as "Akh il". */
function buildSpans(el: HTMLElement, cells: Cell[]) {
  for (const node of textNodesUnder(el)) {
    const value = node.nodeValue ?? "";
    if (!value) continue;

    const frag = document.createDocumentFragment();
    for (const part of value.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(part));
        continue;
      }
      const word = document.createElement("span");
      word.className = "sc-w";
      for (const ch of part) {
        const box = document.createElement("span");
        box.className = "sc-c";
        const text = document.createTextNode(ch);
        box.appendChild(text);
        word.appendChild(box);
        const cell = newCell(ch);
        cell.node = text;
        cells.push(cell);
      }
      frag.appendChild(word);
    }
    node.parentNode?.replaceChild(frag, node);
  }
}

/* ---- font probing ---- */

function fontOf(cs: CSSStyleDeclaration) {
  return `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
}

/** Monospace means every glyph shares one advance width, which is what makes
    whole-string rewriting safe. Probing three glyphs of very different shapes is
    enough to tell the two families apart. */
function isMonospace(ctx: CanvasRenderingContext2D): boolean {
  const i = ctx.measureText("i").width;
  const w = ctx.measureText("W").width;
  const m = ctx.measureText("M").width;
  return Math.abs(i - w) < 0.05 && Math.abs(i - m) < 0.05;
}

function makePicker(ctx: CanvasRenderingContext2D, cs: CSSStyleDeclaration, mono: boolean) {
  const random = () => POOL[(Math.random() * POOL.length) | 0]!;
  if (mono) return random; // every glyph is the same width; nothing to match

  // text-transform means the DOM says "About" while the screen shows "ABOUT" —
  // compare what will actually be drawn.
  const shown =
    cs.textTransform === "uppercase"
      ? (c: string) => c.toUpperCase()
      : cs.textTransform === "lowercase"
        ? (c: string) => c.toLowerCase()
        : (c: string) => c;

  const poolWidths = [...POOL].map((ch) => ({ ch, w: ctx.measureText(shown(ch)).width }));
  const cache = new Map<string, string[]>();

  return (real: string) => {
    let candidates = cache.get(real);
    if (!candidates) {
      const target = ctx.measureText(shown(real)).width;
      const tolerance = Math.max(1.5, target * 0.18);
      candidates = poolWidths.filter((p) => Math.abs(p.w - target) <= tolerance).map((p) => p.ch);
      if (!candidates.length) candidates = [...POOL];
      cache.set(real, candidates);
    }
    return candidates[(Math.random() * candidates.length) | 0]!;
  };
}

/* ---- waiting ---- */

/** Resolves when the hero's `.rise` entrance is over. Read off the real animation
    rather than hard-coding 1.1s, because the CSS clock starts at first paint and
    this script starts whenever astro:page-load fires. */
function riseFinished(el: HTMLElement): Promise<void> {
  const anims = (el.getAnimations?.() ?? []).filter(
    (a) => (a as CSSAnimation).animationName === "rise",
  );
  if (!anims.length) return Promise.resolve();
  return Promise.all(anims.map((a) => a.finished.catch(() => undefined))).then(() => undefined);
}

/** Visibility only — deliberately NOT also scroll-idle. Waiting for quiet meant
    the element arrived on screen still frozen and visibly sat there. */
function whenInFrame(el: Element): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      if (inFrame.has(el)) {
        resolve();
        return;
      }
      waitTimers.add(window.setTimeout(check, 60));
    };
    check();
  });
}

/* One rAF for every running element: N elements cost one batched write pass and
   one layout per tick, not N of each. */

function ensurePump() {
  if (!raf) raf = requestAnimationFrame(pump);
}

function pump(now: number) {
  raf = 0;
  if (now - lastTick >= TICK_MS) {
    lastTick = now;
    for (const job of [...jobs]) step(job, now);
  }
  if (jobs.size) ensurePump();
}

function step(job: Job, now: number) {
  const waiting = !Number.isFinite(job.sweepAt);

  // Frozen and off screen: the seed glyphs are in place and nobody can see them,
  // so do nothing at all. This is what keeps a section that was prepared below
  // the fold from paying for writes until it is actually looked at.
  if (waiting && job.frozen) {
    if (now - job.start > STALL_MS) finish(job);
    return;
  }

  const expired = now - job.start > MAX_RUN_MS;
  // -Infinity for as long as sweepAt is, i.e. while still waiting.
  const swept = now - job.sweepAt;
  const progress = swept / job.spread;
  let remaining = false;

  for (const c of job.cells) {
    if (c.settled) continue;

    if (expired || swept >= c.at * job.spread + c.jitter) {
      c.glyph = c.real;
      c.settled = true;
      if (c.run) c.run.dirty = true;
      else if (c.node) c.node.nodeValue = c.real;
      continue;
    }

    remaining = true;
    if (now < c.nextSwap) continue;
    // Once the sweep is under way only the band near the frontier moves. Before
    // it starts there is no frontier, so everything churns.
    if (progress > 0 && (c.at - progress) * job.cells.length > BAND) continue;

    c.glyph = job.pick(c.real);
    c.nextSwap = now + HOLD_MS + Math.random() * HOLD_MS * 0.5;
    if (c.run) c.run.dirty = true;
    else if (c.node) c.node.nodeValue = c.glyph;
  }

  // Monospace: one write per text node, however many characters changed.
  for (const run of job.runs) {
    if (!run.dirty) continue;
    run.node.nodeValue = run.cells.map((c) => c.glyph).join("");
    run.dirty = false;
  }

  if (!remaining) finish(job);
}

function finish(job: Job) {
  if (job.mono) {
    // Structure was never touched, so putting the strings back is the whole job.
    for (const run of job.runs) run.node.nodeValue = run.cells.map((c) => c.real).join("");
  } else if (job.html !== null) {
    // Verbatim, because per-character spans lost the kerning and ligatures, and
    // because .who carries a view-transition name.
    job.el.innerHTML = job.html;
  }
  if (job.priorLabel === null) job.el.removeAttribute("aria-label");
  else job.el.setAttribute("aria-label", job.priorLabel);
  delete job.el.dataset.scrambling;
  jobs.delete(job);
}

/* ---- starting one element ---- */

type Options = {
  /** Visible churn before the sweep starts. With `waitFor`, counted from when
      that resolves, so it is a beat you can watch rather than time spent idle. */
  delay?: number;
  /** How long the left-to-right sweep takes, end to end. */
  spread?: number;
  /** Hold the sweep until this resolves. */
  waitFor?: Promise<unknown>;
  /** Hold the seed glyphs rather than churning while waiting. Only pass this when
      the element is off screen for the duration, or it reads as a stall. */
  freezeWhileWaiting?: boolean;
};

function scramble(el: HTMLElement, opts: Options = {}) {
  if (el.dataset.scrambling === "1") return;
  // Below 30rem the nav drops three items to display:none. Nothing to watch.
  if (!el.getClientRects().length) return;

  const cs = getComputedStyle(el);
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return;
  ctx.font = fontOf(cs);
  const mono = isMonospace(ctx);

  // Snapshot before mutating: what the element is named while its contents churn,
  // so assistive tech reads the real string and never the glyph soup.
  const priorLabel = el.getAttribute("aria-label");
  const label = textNodesUnder(el)
    .map((n) => n.nodeValue ?? "")
    .join("")
    .replace(/\s+/g, " ")
    .trim();

  const cells: Cell[] = [];
  const runs: Run[] = [];
  const html = mono ? null : el.innerHTML;

  if (mono) buildMono(el, cells, runs);
  else buildSpans(el, cells);

  const movable = cells.filter((c) => !c.settled).length;
  if (!movable) {
    if (html !== null) el.innerHTML = html;
    return;
  }

  el.dataset.scrambling = "1";
  if (label) el.setAttribute("aria-label", label);

  const pick = makePicker(ctx, cs, mono);
  const now = performance.now();

  if (!mono) {
    // Batched: every width read in one pass (one forced layout for the element,
    // not one per character), then every width written in a second. Interleaving
    // would force a layout per character. Monospace skips this entirely — no
    // measurement, and no forced layout at all.
    const spans = cells.map((c) => c.node!.parentElement!);
    const widths = spans.map((s) => s.getBoundingClientRect().width);
    spans.forEach((s, i) => {
      s.style.width = `${widths[i]!.toFixed(2)}px`;
    });
  }

  cells.forEach((c, i) => {
    c.at = cells.length > 1 ? i / (cells.length - 1) : 0;
    c.jitter = Math.random() * 90;
    if (c.settled) return;
    // Seeded so characters outside the moving band already show a glyph.
    c.glyph = pick(c.real);
    c.nextSwap = now + Math.random() * HOLD_MS;
    if (c.run) c.run.dirty = true;
    else if (c.node) c.node.nodeValue = c.glyph;
  });
  for (const run of runs) {
    if (!run.dirty) continue;
    run.node.nodeValue = run.cells.map((c) => c.glyph).join("");
    run.dirty = false;
  }

  const job: Job = {
    el,
    mono,
    html,
    runs,
    cells,
    priorLabel,
    pick,
    spread: opts.spread ?? 300,
    start: now,
    sweepAt: opts.waitFor ? Number.POSITIVE_INFINITY : now + (opts.delay ?? 0),
    frozen: opts.freezeWhileWaiting === true,
  };

  if (opts.waitFor) {
    void opts.waitFor.then(() => {
      // Churn resumes here and the sweep is `delay` behind it, so the beat before
      // the resolve is time you can watch rather than time spent waiting.
      job.sweepAt = performance.now() + (opts.delay ?? 0);
      job.start = performance.now();
      job.frozen = false;
      ensurePump();
    });
  }

  jobs.add(job);
  ensurePump();
}

/* ---- wiring ---- */

export function initScramble(reduce: boolean) {
  stopScramble();
  if (reduce) return;

  const done = playedKeys();

  /* The header runs on its own clock — no entrance animation to wait for. The
     brand resolves first, then each nav item in turn, so the whole bar decodes as
     one cascade travelling left to right. */
  if (!done.has("nav")) {
    const brand = document.querySelector<HTMLElement>(".bar .brand");
    if (brand) scramble(brand, { delay: 220, spread: 460 });
    document.querySelectorAll<HTMLElement>(".bar nav a").forEach((a, i) => {
      scramble(a, { delay: 380 + i * 170, spread: 440 });
    });
    markPlayed("nav");
  }

  /* Hero. Churns through the blur-in and only resolves once .rise is over, so the
     two never overlap. The swap into glyphs happens while the text is still
     blurred and transparent, which is what stops it reading as a glitch. */
  const greeting = document.querySelector<HTMLElement>(".hero .greeting");
  if (greeting && !done.has("hero")) {
    scramble(greeting, { waitFor: riseFinished(greeting), spread: 900 });
    const role = document.querySelector<HTMLElement>(".hero .role");
    if (role) scramble(role, { waitFor: riseFinished(role), spread: 720 });
    markPlayed("hero");
  }

  const targets: Array<{ el: HTMLElement; key: string; spread: number }> = [];
  document.querySelectorAll<HTMLElement>("#main .eyebrow").forEach((el) => {
    const id = el.closest("section")?.id;
    targets.push({ el, key: `eyebrow:${id || (el.textContent ?? "").trim()}`, spread: 660 });
  });

  /* Stack group headers, each waiting on its own header so they decode down the
     columns. Mono matters here: .groups is multi-column, and a box change would
     rebalance it. Don't put a proportional face on .group-name. */
  document.querySelectorAll<HTMLElement>("#stack .group-name").forEach((el, i) => {
    targets.push({ el, key: `stack:${i}`, spread: 520 });
  });

  document.querySelectorAll<HTMLElement>(".foot .rail").forEach((el, i) => {
    targets.push({ el, key: `foot:${i}`, spread: 780 });
  });

  const keyed = new WeakMap<Element, { key: string; spread: number }>();
  const waiting = targets.filter((t) => !done.has(t.key));
  if (!waiting.length) return;

  frameObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) inFrame.add(entry.target);
        else inFrame.delete(entry.target);
      }
    },
    { rootMargin: IN_FRAME },
  );

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = keyed.get(entry.target);
        if (!target) continue;

        // Seeded here, below the fold, so the text is never legible first. It
        // then holds — off screen, so invisibly — and both the churn and the
        // sweep start on the frame it comes into view. No idle wait: that was
        // the visible static pause.
        observer?.unobserve(entry.target);
        markPlayed(target.key);
        scramble(entry.target as HTMLElement, {
          waitFor: whenInFrame(entry.target),
          freezeWhileWaiting: true,
          delay: 220,
          spread: target.spread,
        });
      }
    },
    { rootMargin: PREROLL },
  );

  for (const t of waiting) {
    keyed.set(t.el, { key: t.key, spread: t.spread });
    frameObserver.observe(t.el);
    observer.observe(t.el);
  }
}

export function stopScramble() {
  observer?.disconnect();
  observer = null;
  frameObserver?.disconnect();
  frameObserver = null;
  for (const id of waitTimers) window.clearTimeout(id);
  waitTimers.clear();
  // Restore anything mid-flight so a navigation can never strand scrambled text.
  for (const job of [...jobs]) finish(job);
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}
