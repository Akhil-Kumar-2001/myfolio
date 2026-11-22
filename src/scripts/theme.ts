/* Light/dark. The first paint is decided by the inline script in Base.astro;
   this handles the toggle, navigation and system changes after that. */

export type Theme = "light" | "dark";

/** Must match the key the inline script in Base.astro reads. */
const KEY = "theme";

const root = document.documentElement;
const system = window.matchMedia("(prefers-color-scheme: light)");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

export function currentTheme(): Theme {
  return root.dataset.theme === "light" ? "light" : "dark";
}

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

/** --bg is the source of truth, so theme-color can't drift from the page. */
function syncMeta(doc: Document) {
  const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
  if (bg) doc.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg);
}

function paintToggle() {
  const btn = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  if (!btn) return;
  const label = currentTheme() === "light" ? "Switch to dark theme" : "Switch to light theme";
  btn.setAttribute("aria-label", label);
  btn.title = label;
}

function apply(theme: Theme) {
  root.dataset.themeSwitching = "";
  root.dataset.theme = theme;
  syncMeta(document);
  paintToggle();
  document.dispatchEvent(new CustomEvent<Theme>("theme:change", { detail: theme }));
  // Two frames: the first paints the new colours with transitions off.
  requestAnimationFrame(() => requestAnimationFrame(() => delete root.dataset.themeSwitching));
}

/* Chrome hit-tests a running full-page transition as <html>, so a click on the
   toggle mid-reveal never reaches the button (pointer-events: none on the
   overlay doesn't change that). onSwallowedClick catches those by position,
   and toggle() queues them: the next circle plays once this one has finished.
   Never two transitions at once — restarting the circle per click crashed
   desktop Chrome's renderer (STATUS_BREAKPOINT) after a burst of clicks. */

/** The reveal in flight. Anything that starts another transition (a click in
    the frame before this one starts, or a navigation) skips this one, and the
    skipped one's cleanup must not strip the attribute from its successor. */
let revealing: ViewTransition | null = null;
/** Where it's heading. The DOM only changes when the browser runs the update a
    frame later, so a click in that frame reading data-theme would see the old
    theme and toggle the same way twice. */
let revealTarget: Theme | null = null;
/** The theme to reveal once the current circle finishes. Clicks during a reveal
    land here; an even number cancels out back to null. */
let pending: Theme | null = null;

/** Viewport height with the mobile URL bar retracted (100lvh). */
function largeViewportHeight(): number {
  const probe = document.createElement("div");
  // vh first: where lvh is unsupported the second declaration is dropped.
  probe.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const h = probe.offsetHeight;
  probe.remove();
  return Math.max(h, innerHeight);
}

/** The new theme spreads out from the toggle in a circle. A View Transition, so
    the old page is a still snapshot and the new one is live underneath it. */
function reveal(from: HTMLElement, theme: Theme) {
  const r = from.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  // To the farthest corner of the LARGE viewport. The snapshot covers the area
  // under a showing URL bar too; sized to innerHeight, the circle stopped short
  // and the bottom-left corner snapped in at the end. Phones only — emulation
  // has no retractable URL bar.
  const h = largeViewportHeight();
  const end = Math.ceil(Math.hypot(Math.max(x, innerWidth - x), Math.max(y, h - y))) + 2;

  // Before startViewTransition: it scopes the CSS that turns off the default
  // cross-fade, and that has to be in place when the old snapshot is taken.
  root.dataset.themeReveal = "";
  const vt = document.startViewTransition(() => apply(theme));
  revealing = vt;
  revealTarget = theme;
  document.addEventListener("click", onSwallowedClick, true);
  vt.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        {
          // The ease-out finishes the visible sweep in ~300ms; other clicks are
          // still swallowed until it ends, so the tail is kept short.
          duration: 550,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {
      /* skipped (e.g. a navigation started) — the theme still applied */
    });
  vt.finished.finally(() => {
    if (revealing !== vt) return;
    revealing = null;
    revealTarget = null;
    delete root.dataset.themeReveal;
    document.removeEventListener("click", onSwallowedClick, true);
    // Only now, with this transition fully over, play the queued one.
    const queued = pending;
    pending = null;
    if (queued && queued !== currentTheme()) {
      const btn = document.querySelector<HTMLElement>("[data-theme-toggle]");
      if (btn) reveal(btn, queued);
      else apply(queued);
    }
  });
}

/** Only clicks the transition redirected to <html>. One that reached the button
    is onToggle's, and handling it here too would switch twice. */
function onSwallowedClick(e: MouseEvent) {
  if (!revealing || e.target !== root) return;
  const btn = document.querySelector<HTMLElement>("[data-theme-toggle]");
  if (!btn) return;
  const r = btn.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
  toggle(btn);
}

function onToggle(e: MouseEvent) {
  toggle(e.currentTarget as HTMLElement);
}

function toggle(btn: HTMLElement) {
  const from = pending ?? revealTarget ?? currentTheme();
  const next: Theme = from === "light" ? "dark" : "light";
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* private mode — still switches, just won't be remembered */
  }
  // Mid-reveal: queue it. Back to where the running circle is heading means the
  // clicks cancelled out, so nothing more plays.
  if (revealing) {
    pending = next === revealTarget ? null : next;
    return;
  }
  // Instant where unsupported or unwanted; the reveal is decoration only.
  if (reduce.matches || typeof document.startViewTransition !== "function") {
    apply(next);
    return;
  }
  reveal(btn, next);
}

/** Per page: the header is re-rendered on every navigation. */
export function initTheme() {
  const btn = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  if (btn && !btn.dataset.bound) {
    btn.dataset.bound = "";
    btn.addEventListener("click", onToggle);
  }
  paintToggle();
}

/* Astro replaces every <html> attribute with the incoming page's, and the
   static HTML has no data-theme. Without this, every navigation flashes dark. */
document.addEventListener("astro:before-swap", (e) => {
  // A queued switch lands on the new page directly rather than animating there.
  if (pending) {
    const queued = pending;
    pending = null;
    apply(queued);
  }
  e.newDocument.documentElement.dataset.theme = currentTheme();
  syncMeta(e.newDocument);
});

/* Only while the visitor hasn't picked one: an explicit choice wins. */
system.addEventListener("change", (e) => {
  if (!stored()) apply(e.matches ? "light" : "dark");
});
