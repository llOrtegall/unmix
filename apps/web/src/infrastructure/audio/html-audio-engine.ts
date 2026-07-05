import type { AudioEngine } from "../../application/ports/index.ts";
import type { StemName } from "../../domain/stem.ts";

const MAX_DRIFT_SECONDS = 0.04;

/**
 * Plays every stem with its own streaming <audio> element (no full decode, so
 * memory stays low) and keeps them aligned to the first one.
 */
export class HtmlAudioEngine implements AudioEngine {
  #elements = new Map<StemName, HTMLAudioElement>();
  #master: HTMLAudioElement | null = null;
  #syncTimer: number | null = null;
  #endedListeners = new Set<() => void>();

  async load(stems: { name: StemName; url: string }[]): Promise<void> {
    this.dispose();
    const ready = stems.map(({ name, url }) => {
      const el = new Audio();
      el.preload = "auto";
      el.src = url;
      this.#elements.set(name, el);
      return new Promise<void>((resolve, reject) => {
        el.addEventListener("canplaythrough", () => resolve(), { once: true });
        el.addEventListener("error", () => reject(new Error(`Could not load ${name}`)), { once: true });
      });
    });
    this.#master = this.#elements.values().next().value ?? null;
    this.#master?.addEventListener("ended", this.#handleEnded);
    await Promise.all(ready);
  }

  async play(): Promise<void> {
    const t = this.currentTime;
    for (const el of this.#elements.values()) el.currentTime = t;
    await Promise.all([...this.#elements.values()].map((el) => el.play()));
    this.#syncTimer ??= window.setInterval(this.#resync, 250);
  }

  pause(): void {
    for (const el of this.#elements.values()) el.pause();
    this.#stopSync();
  }

  seek(seconds: number): void {
    const t = Math.max(0, Math.min(seconds, this.duration || 0));
    for (const el of this.#elements.values()) el.currentTime = t;
  }

  setGain(name: StemName, gain: number): void {
    const el = this.#elements.get(name);
    if (el) el.volume = Math.max(0, Math.min(1, gain));
  }

  get duration(): number {
    return this.#master?.duration || 0;
  }

  get currentTime(): number {
    return this.#master?.currentTime ?? 0;
  }

  onEnded(listener: () => void): () => void {
    this.#endedListeners.add(listener);
    return () => this.#endedListeners.delete(listener);
  }

  dispose(): void {
    this.#stopSync();
    this.#master?.removeEventListener("ended", this.#handleEnded);
    for (const el of this.#elements.values()) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    this.#elements.clear();
    this.#master = null;
  }

  #resync = () => {
    if (!this.#master || this.#master.paused) return;
    const t = this.#master.currentTime;
    for (const el of this.#elements.values()) {
      if (el !== this.#master && Math.abs(el.currentTime - t) > MAX_DRIFT_SECONDS) el.currentTime = t;
    }
  };

  #handleEnded = () => {
    this.pause();
    for (const listener of this.#endedListeners) listener();
  };

  #stopSync() {
    if (this.#syncTimer !== null) window.clearInterval(this.#syncTimer);
    this.#syncTimer = null;
  }
}
