// Fiscal-regime switch in the economics case: two radio buttons choose which
// PSC regime is explained and which bars are emphasised. Without JavaScript
// both explanations are simply shown one after the other.

export function initFiscal(): void {
  document.querySelectorAll<HTMLElement>("[data-fiscal]").forEach((root) => {
    const views = [...root.querySelectorAll<HTMLElement>("[data-regime-view]")];
    const apply = (value: string): void => {
      root.dataset.regime = value;
      views.forEach((view) => {
        view.hidden = view.dataset.regimeView !== value;
      });
    };
    root.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked) apply(input.value);
      });
      if (input.checked) apply(input.value);
    });
    root.classList.add("is-interactive");
  });
}
