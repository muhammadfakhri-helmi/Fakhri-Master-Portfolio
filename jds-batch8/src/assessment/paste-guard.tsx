// Answer fields must be typed by the candidate: pasting or dropping text is
// blocked, the candidate sees a short notice, and every blocked attempt is
// counted (the count is written to the answer file for the reviewer).

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ClipboardEvent, type DragEvent } from "react";

/** Called once per blocked paste/drop attempt. */
export const PasteGuardContext = createContext<(field: string) => void>(() => {});

// Text insertions that do not come from typing (clipboard, drag & drop,
// mobile keyboard clipboard suggestions).
const BLOCKED_INPUT_TYPES = new Set(["insertFromPaste", "insertFromPasteAsQuotation", "insertFromDrop", "insertFromYank"]);

export const PASTE_BLOCKED_MESSAGE = "Copy-paste tidak diizinkan. Tulis jawabanmu sendiri.";

export function useNoPaste(field: string, enabled: boolean) {
  const report = useContext(PasteGuardContext);
  const [blocked, setBlocked] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const flag = useCallback(() => {
    report(field);
    setBlocked(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setBlocked(false), 5000);
  }, [field, report]);

  const onBlockedEvent = useCallback(
    (event: ClipboardEvent | DragEvent) => {
      event.preventDefault();
      flag();
    },
    [flag],
  );

  const ref = useCallback(
    (element: HTMLInputElement | HTMLTextAreaElement | null) => {
      if (!element || !enabled) return;
      const onBeforeInput = (event: Event) => {
        if (event.defaultPrevented || !BLOCKED_INPUT_TYPES.has((event as InputEvent).inputType)) return;
        event.preventDefault();
        flag();
      };
      element.addEventListener("beforeinput", onBeforeInput);
      return () => element.removeEventListener("beforeinput", onBeforeInput);
    },
    [enabled, flag],
  );

  if (!enabled) return { blocked: false, inputProps: {} };
  return { blocked, inputProps: { ref, onPaste: onBlockedEvent, onDrop: onBlockedEvent } };
}
