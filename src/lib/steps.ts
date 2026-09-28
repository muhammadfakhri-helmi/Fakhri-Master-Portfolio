// Scroll-told stages: inside [data-steps], the evidence window stays in view
// (sticky, from 900 px) while the numbered [data-step] items scroll past; the
// step crossing the middle of the screen selects the matching window tab.
// Choosing a tab highlights its step in return. On narrow screens the window
// is not sticky, so only the tabs drive it.

import type { WindowController } from "./evidence-window";

export function initSteps(controllers: WeakMap<Element, WindowController>): void {
  const wide = window.matchMedia("(min-width: 900px)");

  document.querySelectorAll<HTMLElement>("[data-steps]").forEach((wrap) => {
    const figure = wrap.querySelector<HTMLElement>("[data-ev-window]");
    const controller = figure ? controllers.get(figure) : undefined;
    const steps = [...wrap.querySelectorAll<HTMLElement>("[data-step]")];
    if (!figure || !controller || steps.length === 0) return;

    const highlight = (index: number): void => {
      steps.forEach((step, i) => step.classList.toggle("is-active", i === index));
    };
    highlight(0);

    figure.addEventListener("ev:select", (event) => highlight(event.detail.index));

    const observer = new IntersectionObserver(
      (entries) => {
        if (!wide.matches) return;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.step);
          if (Number.isInteger(index) && index < controller.count) controller.select(index);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    steps.forEach((step) => observer.observe(step));
  });
}
