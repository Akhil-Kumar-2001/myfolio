/* Light/dark. The first paint is decided by the inline script in Base.astro;
   this handles the toggle, navigation and system changes after that. */

export type Theme = "light" | "dark";

/** Must match the key the inline script in Base.astro reads. */
const KEY = "theme";

const root = document.documentElement;
const system = window.matchMedia("(prefers-color-scheme: light)");

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

function onToggle() {
  const next: Theme = currentTheme() === "light" ? "dark" : "light";
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* private mode — still switches, just won't be remembered */
  }
  apply(next);
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
  e.newDocument.documentElement.dataset.theme = currentTheme();
  syncMeta(e.newDocument);
});

/* Only while the visitor hasn't picked one: an explicit choice wins. */
system.addEventListener("change", (e) => {
  if (!stored()) apply(e.matches ? "light" : "dark");
});
