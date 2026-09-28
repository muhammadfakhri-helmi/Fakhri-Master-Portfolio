import {
  CANVAS,
  SEQUENCES,
  TRANSITION_MS,
  frameSrcset,
  frameUrl,
  isSequenceId,
  type SequenceId,
  type SequenceSpec,
} from "./sequences";

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
/** The outgoing frame starts fading a little later, so the body never turns see-through mid-crossfade. */
const OUTGOING_DELAY_MS = 60;
/** Share of the figure that must be on screen before the sequence plays. */
const VISIBLE_SHARE = 0.5;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

export interface SequenceFrameDetail {
  sequence: SequenceId;
  index: number;
  frame: string;
  isFinal: boolean;
}

export interface SequenceCompleteDetail {
  sequence: SequenceId;
  /** true when the final frame was shown without playing (reduced motion, preference change). */
  immediate: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    "character-sequence": CharacterSequence;
  }
  interface HTMLElementEventMap {
    "sequence:frame": CustomEvent<SequenceFrameDetail>;
    "sequence:complete": CustomEvent<SequenceCompleteDetail>;
  }
  // The events bubble, so listeners on document receive them too.
  interface DocumentEventMap {
    "sequence:frame": CustomEvent<SequenceFrameDetail>;
    "sequence:complete": CustomEvent<SequenceCompleteDetail>;
  }
}

type State = "idle" | "playing" | "done";

/**
 * `<character-sequence sequence="intro">`
 *
 * Wraps a `<picture>` that shows the sequence's first frame (and, through a
 * `(prefers-reduced-motion: reduce)` source, its own final frame). When at least
 * half of the figure is on screen and the tab is visible, it plays the frames
 * once with a gentle crossfade and keeps the final frame. Only the next frame is
 * ever preloaded; hidden tabs pause the timeline. The element itself carries the
 * single accessible description (`role="img"` + `aria-label`); frames are
 * decorative, so screen readers hear one sentence, not one per frame.
 */
export class CharacterSequence extends HTMLElement {
  #spec: SequenceSpec | null = null;
  #current: HTMLImageElement | null = null;
  #index = 0;
  #state: State = "idle";
  #inView = false;
  #advancing = false;
  #timer: number | undefined;
  #holdMs = 0;
  #holdStart = 0;
  #preloads = new Map<number, Promise<HTMLImageElement | null>>();
  /** Folder holding the frame files, taken from the figure's own <img>. */
  #folder: URL | null = null;
  #observer: IntersectionObserver | null = null;

  get sequence(): string | null {
    return this.getAttribute("sequence");
  }

  set sequence(value: string) {
    this.setAttribute("sequence", value);
  }

  connectedCallback(): void {
    const id = this.sequence;
    if (!isSequenceId(id) || this.#spec) return;
    this.#spec = SEQUENCES[id];
    this.#current = this.querySelector("img");
    if (this.#current) this.#folder = new URL(".", this.#current.src);
    this.#setState("idle");
    reducedMotion.addEventListener("change", this.#onMotionPreference);

    if (reducedMotion.matches) {
      // The <picture> already selected this sequence's own final frame.
      this.#finish(true);
      return;
    }

    // Below-the-fold figures ship their final pose in the HTML (so the gesture
    // matches its evidence without JavaScript). While still off screen, rewind
    // to the first frame; if already on screen, keep the finished pose.
    if (this.hasAttribute("data-static-final")) {
      if (this.#nearViewport()) {
        this.#finish(true);
        return;
      }
      this.#rewindToFirstFrame();
    }

    document.addEventListener("visibilitychange", this.#onVisibility);
    this.#observer = new IntersectionObserver(this.#onIntersect, { threshold: [0, VISIBLE_SHARE] });
    this.#observer.observe(this);
  }

  disconnectedCallback(): void {
    this.#observer?.disconnect();
    this.#observer = null;
    document.removeEventListener("visibilitychange", this.#onVisibility);
    reducedMotion.removeEventListener("change", this.#onMotionPreference);
    window.clearTimeout(this.#timer);
    this.#timer = undefined;
  }

  #onIntersect = (entries: IntersectionObserverEntry[]): void => {
    const entry = entries[entries.length - 1];
    if (!entry || this.#state !== "idle") return;
    // Warm up the immediate next frame only, as soon as the figure approaches.
    if (entry.isIntersecting) void this.#preload(1);
    this.#inView = entry.intersectionRatio >= VISIBLE_SHARE;
    if (this.#inView && !document.hidden) void this.#play();
  };

  #onVisibility = (): void => {
    if (document.hidden) {
      this.#pauseHold();
      return;
    }
    if (this.#state === "idle" && this.#inView) void this.#play();
    else this.#resumeHold();
  };

  #onMotionPreference = (): void => {
    if (!reducedMotion.matches || this.#state === "done") return;
    window.clearTimeout(this.#timer);
    this.#timer = undefined;
    // Drop the played layers and let the <picture> show its reduced-motion source,
    // which is this sequence's own final frame.
    const base = this.querySelector<HTMLImageElement>("picture img");
    this.querySelectorAll(".seq-frame").forEach((node) => node.remove());
    if (base) {
      base.getAnimations().forEach((animation) => animation.cancel());
      base.style.removeProperty("visibility");
      base.style.removeProperty("opacity");
      this.#current = base;
    }
    this.#finish(true);
  };

  async #play(): Promise<void> {
    const spec = this.#spec;
    if (!spec || this.#state !== "idle") return;
    this.#setState("playing");
    this.#observer?.disconnect();
    this.#observer = null;

    const first = this.#current;
    if (first && !first.complete) await first.decode().catch(() => undefined);
    // The state may have changed while waiting (e.g. reduced motion switched on).
    if (!this.#isPlaying()) return;

    this.#emitFrame(0);
    void this.#preload(1);
    this.#startHold(spec.frames[0]?.holdMs ?? 0);
  }

  #startHold(ms: number): void {
    this.#holdMs = ms;
    this.#holdStart = performance.now();
    if (document.hidden) return; // resumed by #onVisibility
    this.#timer = window.setTimeout(() => void this.#advance(), ms);
  }

  #pauseHold(): void {
    if (this.#timer === undefined) return;
    window.clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#holdMs = Math.max(0, this.#holdMs - (performance.now() - this.#holdStart));
  }

  #resumeHold(): void {
    if (this.#state !== "playing" || this.#advancing || this.#timer !== undefined) return;
    this.#startHold(this.#holdMs);
  }

  async #advance(): Promise<void> {
    this.#timer = undefined;
    const spec = this.#spec;
    if (!spec || this.#state !== "playing") return;

    const next = this.#index + 1;
    if (next >= spec.frames.length) {
      this.#finish(false);
      return;
    }

    this.#advancing = true;
    const incoming = await this.#preload(next);
    if (document.hidden) await whenVisible();
    this.#advancing = false;
    if (!this.#isPlaying()) return;
    if (!incoming) {
      // A frame failed to load: keep the current frame rather than flash an empty box.
      this.#finish(false);
      return;
    }

    this.#crossfade(incoming);
    this.#index = next;
    this.#emitFrame(next);
    void this.#preload(next + 1);
    this.#startHold(TRANSITION_MS + (spec.frames[next]?.holdMs ?? 0));
  }

  #crossfade(incoming: HTMLImageElement): void {
    const outgoing = this.#current;
    incoming.className = "seq-frame";
    incoming.alt = "";
    incoming.setAttribute("aria-hidden", "true");
    incoming.style.opacity = "0";
    this.append(incoming);

    const fadeIn = incoming.animate({ opacity: [0, 1] }, { duration: TRANSITION_MS, easing: EASE_OUT, fill: "forwards" });
    const fadeOut = outgoing?.animate(
      { opacity: [1, 0] },
      { duration: TRANSITION_MS - OUTGOING_DELAY_MS, delay: OUTGOING_DELAY_MS, easing: "linear", fill: "forwards" },
    );

    Promise.all([fadeIn.finished, fadeOut?.finished]).then(
      () => {
        incoming.style.opacity = "1";
        fadeIn.cancel();
        if (outgoing) this.#retire(outgoing);
      },
      () => undefined,
    );
    this.#current = incoming;
  }

  /** The <picture> fallback stays in the DOM (hidden); played layers are removed. */
  #retire(image: HTMLImageElement): void {
    if (image.closest("picture")) {
      image.style.visibility = "hidden";
      image.style.opacity = "0";
      image.getAnimations().forEach((animation) => animation.cancel());
    } else {
      image.remove();
    }
  }

  #preload(index: number): Promise<HTMLImageElement | null> {
    const frame = this.#spec?.frames[index];
    if (!frame || !this.#folder) return Promise.resolve(null);
    let pending = this.#preloads.get(index);
    if (!pending) {
      const image = new Image(CANVAS.width, CANVAS.height);
      image.decoding = "async";
      image.sizes = this.#current?.getAttribute("sizes") ?? "100vw";
      image.srcset = frameSrcset(this.#folder, frame.id);
      image.src = frameUrl(this.#folder, frame.id, 840);
      pending = image.decode().then(
        () => image,
        () => null,
      );
      this.#preloads.set(index, pending);
    }
    return pending;
  }

  #emitFrame(index: number): void {
    const spec = this.#spec;
    const frame = spec?.frames[index];
    if (!spec || !frame) return;
    this.dataset.frame = String(index);
    this.dispatchEvent(
      new CustomEvent<SequenceFrameDetail>("sequence:frame", {
        bubbles: true,
        detail: { sequence: spec.id, index, frame: frame.id, isFinal: index === spec.frames.length - 1 },
      }),
    );
  }

  #finish(immediate: boolean): void {
    const spec = this.#spec;
    if (!spec || this.#state === "done") return;
    this.#setState("done");
    this.#observer?.disconnect();
    this.#observer = null;
    document.removeEventListener("visibilitychange", this.#onVisibility);
    this.dispatchEvent(
      new CustomEvent<SequenceCompleteDetail>("sequence:complete", {
        bubbles: true,
        detail: { sequence: spec.id, immediate },
      }),
    );
  }

  #nearViewport(): boolean {
    const rect = this.getBoundingClientRect();
    return rect.bottom > -window.innerHeight * 0.25 && rect.top < window.innerHeight * 1.25;
  }

  #rewindToFirstFrame(): void {
    const first = this.#spec?.frames[0];
    const image = this.#current;
    if (!first || !image) return;
    if (!this.#folder) return;
    image.srcset = frameSrcset(this.#folder, first.id);
    image.src = frameUrl(this.#folder, first.id, 840);
  }

  #setState(state: State): void {
    this.#state = state;
    this.dataset.state = state;
  }

  #isPlaying(): boolean {
    return this.#state === "playing";
  }
}

function whenVisible(): Promise<void> {
  if (!document.hidden) return Promise.resolve();
  return new Promise((resolve) => {
    const onChange = (): void => {
      if (document.hidden) return;
      document.removeEventListener("visibilitychange", onChange);
      resolve();
    };
    document.addEventListener("visibilitychange", onChange);
  });
}

export function defineCharacterSequence(): void {
  if (!customElements.get("character-sequence")) {
    customElements.define("character-sequence", CharacterSequence);
  }
}
