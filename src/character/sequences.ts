// Character sequences, taken from the supplied motion-config.json
// (canvas 1122 × 1402, transparent PNG, crossfade 180 ms, no loop).
//
// Since the CV-mapped rebuild (28 Sep 2026) only the hero introduction plays:
// the WIMS and INPEX features show views of the linked case studies instead of
// the portrait, at Fakhri's request. The wims / inpex frames stay in the source
// asset folder and can be regenerated with scripts/make_derivatives.py.

export type SequenceId = "intro";

export interface FrameSpec {
  /** File stem of the frame; derivatives are `<id>-<width>.webp`. */
  readonly id: string;
  /** Time the frame stays fully visible before the next crossfade starts. */
  readonly holdMs: number;
}

export interface SequenceSpec {
  readonly id: SequenceId;
  readonly story: string;
  readonly frames: readonly FrameSpec[];
}

export const CANVAS = { width: 1122, height: 1402 } as const;
export const TRANSITION_MS = 180;
export const DERIVATIVE_WIDTHS = [560, 840, 1122] as const;

export const SEQUENCES: Readonly<Record<SequenceId, SequenceSpec>> = {
  intro: {
    id: "intro",
    story: "Professional introduction",
    frames: [
      { id: "frame-01-intro-open", holdMs: 220 },
      { id: "frame-02-intro-crossing", holdMs: 180 },
      { id: "frame-03-intro-final", holdMs: 900 },
    ],
  },
};

export function isSequenceId(value: string | null): value is SequenceId {
  return value !== null && Object.hasOwn(SEQUENCES, value);
}

// Frame URLs are resolved against the folder of the figure's own <img>, so they
// work from any page depth (/ and /id/) and under any hosting sub-path.

export function frameUrl(folder: URL, frameId: string, width: (typeof DERIVATIVE_WIDTHS)[number]): string {
  return new URL(`${frameId}-${width}.webp`, folder).href;
}

export function frameSrcset(folder: URL, frameId: string): string {
  return DERIVATIVE_WIDTHS.map((w) => `${frameUrl(folder, frameId, w)} ${w}w`).join(", ");
}
