// Light / dark theme. The inline script in src/page.html picks the theme before
// first paint; this module wires the header button and keeps following the
// device setting until the visitor makes a choice of their own.

type Theme = "light" | "dark";

const STORAGE_KEY = "fmp-theme";
const THEME_COLOR: Record<Theme, string> = { dark: "#0A111D", light: "#F4F0E7" };

const deviceQuery = window.matchMedia("(prefers-color-scheme: light)");
const deviceTheme = (): Theme => (deviceQuery.matches ? "light" : "dark");

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null; // storage blocked (private mode, strict settings)
  }
}

function store(theme: Theme | null): void {
  try {
    if (theme) localStorage.setItem(STORAGE_KEY, theme);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // The choice then lasts for this page view only.
  }
}

export function initTheme(): void {
  const root = document.documentElement;
  const toggle = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

  const apply = (theme: Theme): void => {
    root.setAttribute("data-theme", theme);
    meta?.setAttribute("content", THEME_COLOR[theme]);
    if (toggle) {
      const label = (theme === "dark" ? toggle.dataset.labelLight : toggle.dataset.labelDark) ?? "";
      toggle.setAttribute("aria-label", label);
      toggle.title = label;
    }
  };

  apply(storedTheme() ?? deviceTheme());

  toggle?.addEventListener("click", () => {
    const next: Theme = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    apply(next);
    // Picking what the device already asks for means "follow the device" again.
    store(next === deviceTheme() ? null : next);
  });

  deviceQuery.addEventListener("change", () => {
    if (!storedTheme()) apply(deviceTheme());
  });

  // Another tab (e.g. the other language) changed the choice.
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) apply(storedTheme() ?? deviceTheme());
  });
}
