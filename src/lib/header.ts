// Header behaviour: solid background after the first scroll, an accessible
// menu button on small screens, and the current section marked in the nav.

export function initHeader(): void {
  const header = document.querySelector<HTMLElement>("[data-header]");
  if (!header) return;

  // Solid header once the page has scrolled a little.
  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none";
  document.body.prepend(sentinel);
  new IntersectionObserver(([entry]) => {
    header.classList.toggle("is-scrolled", !entry?.isIntersecting);
  }).observe(sentinel);

  // Menu button (visible below 1100 px, where five nav items no longer fit).
  const toggle = header.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const nav = header.querySelector<HTMLElement>("#site-nav");
  const setOpen = (open: boolean): void => {
    header.classList.toggle("is-open", open);
    toggle?.setAttribute("aria-expanded", String(open));
  };
  toggle?.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  nav?.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.classList.contains("is-open")) {
      setOpen(false);
      toggle?.focus();
    }
  });
  window.matchMedia("(min-width: 1100px)").addEventListener("change", () => setOpen(false));

  // Language switch: open the other language at the section being read.
  const sectionIds = [
    "top",
    "snapshot",
    "experience",
    "asiaserv",
    "oses",
    "wims",
    "inpex",
    "readiness",
    "pdsi",
    "academic",
    "drillstring",
    "economics",
    "leadership",
    "affiliation",
    "alpha05",
    "evidence",
    "about",
    "contact",
  ];
  header.querySelectorAll<HTMLAnchorElement>("[data-lang-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (link.hasAttribute("aria-current")) {
        event.preventDefault();
        return;
      }
      const inView = sectionIds
        .map((id) => document.getElementById(id))
        .filter((section): section is HTMLElement => section !== null && section.getBoundingClientRect().top <= window.innerHeight * 0.35)
        .pop();
      const target = new URL(link.href);
      target.hash = inView && inView.id !== "top" ? inView.id : "";
      link.href = target.href;
    });
  });

  // Mark the section in view.
  const links = new Map<string, HTMLAnchorElement>();
  nav?.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
    links.set(link.hash.slice(1), link);
  });
  const sections = [...links.keys()]
    .map((id) => document.getElementById(id))
    .filter((section): section is HTMLElement => section !== null);
  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const link = links.get(entry.target.id);
        if (!link) continue;
        if (entry.isIntersecting) {
          links.forEach((other) => other.removeAttribute("aria-current"));
          link.setAttribute("aria-current", "location");
        } else if (link.getAttribute("aria-current")) {
          link.removeAttribute("aria-current");
        }
      }
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  sections.forEach((section) => spy.observe(section));
}
