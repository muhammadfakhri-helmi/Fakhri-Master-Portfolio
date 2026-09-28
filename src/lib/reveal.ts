// Fade-up on first entry for elements marked `data-reveal`, and draw-on for
// diagrams marked `data-draw`. The hidden start state only exists under the
// `.js` class and `prefers-reduced-motion: no-preference` (see base.css), so
// content is never lost when JavaScript or motion is unavailable.

export function initReveal(): void {
  const targets = document.querySelectorAll<HTMLElement>("[data-reveal], [data-draw]");
  if (!("IntersectionObserver" in window)) {
    targets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
  );

  targets.forEach((target) => observer.observe(target));
}
