// Evidence windows: framed previews of Fakhri's public case-study sites.
//
//   [data-ev-window]   the figure; its tabs switch the panels (WAI-ARIA tabs,
//                      automatic activation, arrow keys / Home / End)
//   [data-autoplay]    tours through the tabs while at least half the window is
//                      on screen. Hover or focus holds the tour; choosing a tab
//                      or pressing the pause button stops it. Never runs with
//                      reduced motion.
//
// Panels crossfade in CSS (`hidden` toggles opacity/visibility, see
// evidence.css). Without JavaScript only the first panel shows and every
// "Open" link still works. Each selection dispatches `ev:select` on the figure.

const TOUR_MS = 5200;

export interface WindowController {
  readonly count: number;
  select(index: number): void;
}

declare global {
  interface HTMLElementEventMap {
    "ev:select": CustomEvent<{ index: number; fromUser: boolean }>;
  }
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function setupWindow(figure: HTMLElement): WindowController | null {
  const tabs = [...figure.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls") ?? ""));
  if (tabs.length < 2 || panels.some((panel) => panel === null)) return null;
  const panelList = panels as HTMLElement[];

  let current = Math.max(
    0,
    tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true"),
  );

  // ---- tour state ----
  const tourButton = figure.querySelector<HTMLButtonElement>("[data-ev-tour]");
  const tourLabel = figure.querySelector<HTMLElement>("[data-ev-tour-label]");
  let touring = figure.hasAttribute("data-autoplay") && !reduceMotion.matches;
  let inView = false;
  let held = false;
  let timer = 0;

  const syncTour = (): void => {
    window.clearTimeout(timer);
    const running = touring && inView && !held && !document.hidden;
    figure.dataset.tour = touring ? (running ? "running" : "held") : "off";
    // restart the progress line on the active tab
    tabs.forEach((tab) => tab.classList.remove("is-timing"));
    if (running) {
      const active = tabs[current];
      if (active) {
        void active.offsetWidth;
        active.classList.add("is-timing");
      }
      timer = window.setTimeout(() => select(current + 1, false), TOUR_MS);
    }
    if (tourButton && tourLabel) {
      const label = touring ? tourButton.dataset.labelPause : tourButton.dataset.labelPlay;
      if (label) tourLabel.textContent = label;
      tourButton.setAttribute("aria-pressed", String(!touring));
    }
  };

  const select = (index: number, fromUser: boolean): void => {
    const next = (index + tabs.length) % tabs.length;
    if (fromUser && touring) touring = false;
    if (next !== current) {
      tabs.forEach((tab, i) => {
        const on = i === next;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
      });
      panelList[next]!.hidden = false;
      panelList[current]!.hidden = true;
      current = next;
      figure.dispatchEvent(new CustomEvent("ev:select", { detail: { index: next, fromUser } }));
    }
    syncTour();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i, true));
  });

  figure.querySelector('[role="tablist"]')?.addEventListener("keydown", (event) => {
    const key = (event as KeyboardEvent).key;
    const moves: Record<string, number> = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 };
    if (!(key in moves)) return;
    event.preventDefault();
    select(moves[key]!, true);
    tabs[current]?.focus();
  });

  if (touring && tourButton) {
    tourButton.hidden = false;
    tourButton.addEventListener("click", () => {
      touring = !touring;
      syncTour();
    });
  }

  figure.addEventListener("pointerenter", () => {
    held = true;
    syncTour();
  });
  figure.addEventListener("pointerleave", () => {
    held = false;
    syncTour();
  });
  figure.addEventListener("focusin", () => {
    held = true;
    syncTour();
  });
  figure.addEventListener("focusout", (event) => {
    if (!figure.contains(event.relatedTarget as Node | null)) {
      held = false;
      syncTour();
    }
  });
  document.addEventListener("visibilitychange", syncTour);
  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) touring = false;
    syncTour();
  });

  new IntersectionObserver(
    ([entry]) => {
      inView = Boolean(entry?.isIntersecting);
      syncTour();
    },
    { threshold: 0.5 },
  ).observe(figure);

  syncTour();

  return {
    count: tabs.length,
    select: (index) => select(index, false),
  };
}

export function initEvidenceWindows(): WeakMap<Element, WindowController> {
  const controllers = new WeakMap<Element, WindowController>();
  document.querySelectorAll<HTMLElement>("[data-ev-window]").forEach((figure) => {
    const controller = setupWindow(figure);
    if (controller) controllers.set(figure, controller);
  });
  return controllers;
}
