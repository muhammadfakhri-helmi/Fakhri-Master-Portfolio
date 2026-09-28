// "Explore live": one modal <dialog> loads the public case-study site that a
// [data-live] button names. The iframe only exists while the dialog is open,
// so no 3D scene runs in the background and nothing heavy loads until asked.
// Without <dialog> support (or JavaScript) the buttons stay hidden and the
// "Open" links remain.

export function initLiveDialog(): void {
  const dialog = document.querySelector<HTMLDialogElement>("[data-live-dialog]");
  if (!dialog || typeof dialog.showModal !== "function") return;
  const frame = dialog.querySelector<HTMLElement>("[data-live-frame]");
  const name = dialog.querySelector<HTMLElement>("[data-live-name]");
  const openLink = dialog.querySelector<HTMLAnchorElement>("[data-live-open]");
  if (!frame || !name || !openLink) return;

  let opener: HTMLElement | null = null;

  document.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button[data-live]") : null;
    const url = button?.dataset.live;
    if (!button || !url) return;
    const title = button.dataset.liveTitle ?? "";

    opener = button;
    name.textContent = title;
    openLink.href = url;

    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.title = title;
    iframe.allow = "fullscreen";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    frame.replaceChildren(iframe);
    dialog.showModal();
  });

  // Cleanup runs directly on every way out (the dialog's own `close` event is
  // queued and can arrive late), and is safe to run twice.
  const finish = (): void => {
    frame.replaceChildren();
    const back = opener;
    opener = null;
    if (!back) return;
    // If the opener's panel was switched meanwhile, return to the window's active tab.
    const visible = typeof back.checkVisibility !== "function" || back.checkVisibility({ visibilityProperty: true });
    const target = visible
      ? back
      : back.closest("[data-ev-window]")?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    target?.focus();
  };
  const closeDialog = (): void => {
    if (dialog.open) dialog.close();
    finish();
  };

  dialog.querySelector("[data-live-close]")?.addEventListener("click", closeDialog);

  // A click on the backdrop reaches the dialog element itself.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });

  // Escape
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });

  dialog.addEventListener("close", finish);

  document.documentElement.classList.add("has-live");
}
