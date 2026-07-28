import type { Unsubscribe } from "../../shared/domain/Unsubscribe.ts";
import type { StemList } from "../../track/domain/StemList.ts";
import type { StemNamePrimitive } from "../../track/domain/StemName.ts";
import { PlaybackLoadFailedError } from "../domain/errors/PlaybackLoadFailedError.ts";
import type { Mix } from "../domain/Mix.ts";
import type { PlaybackRepository } from "../domain/PlaybackRepository.ts";
import { Playhead } from "../domain/Playhead.ts";

const MAX_DRIFT_SECONDS = 0.04;
const RESYNC_EVERY_MS = 250;

/**
 * Plays every stem with its own streaming <audio> element (no full decode, so
 * memory stays low) and keeps them aligned to the first one.
 */
export class HtmlAudioPlaybackRepository implements PlaybackRepository {
  private readonly elements = new Map<StemNamePrimitive, HTMLAudioElement>();
  private readonly endedListeners = new Set<() => void>();
  private master: HTMLAudioElement | null = null;
  private mix: Mix | null = null;
  private syncTimer: number | null = null;

  async load(stems: StemList): Promise<void> {
    this.unload();
    const ready = stems.map((stem) => {
      const name = stem.getName().toPrimitive();
      const element = new Audio();
      element.preload = "auto";
      element.src = stem.getPreviewUrl().toPrimitive();
      this.elements.set(name, element);
      return new Promise<void>((resolve, reject) => {
        element.addEventListener("canplaythrough", () => resolve(), { once: true });
        element.addEventListener("error", () => reject(new PlaybackLoadFailedError(name)), { once: true });
      });
    });
    this.master = this.elements.values().next().value ?? null;
    this.master?.addEventListener("ended", this.handleEnded);
    // Gains set while the elements did not exist yet still have to reach them.
    if (this.mix) this.apply(this.mix);
    await Promise.all(ready);
  }

  unload(): void {
    this.stopSync();
    this.master?.removeEventListener("ended", this.handleEnded);
    for (const element of this.elements.values()) {
      element.pause();
      element.removeAttribute("src");
      element.load();
    }
    this.elements.clear();
    this.master = null;
  }

  async play(): Promise<void> {
    const position = this.master?.currentTime ?? 0;
    for (const element of this.elements.values()) element.currentTime = position;
    await Promise.all([...this.elements.values()].map((element) => element.play()));
    this.syncTimer ??= window.setInterval(this.resync, RESYNC_EVERY_MS);
  }

  pause(): void {
    for (const element of this.elements.values()) element.pause();
    this.stopSync();
  }

  isPlaying(): boolean {
    return this.master !== null && !this.master.paused;
  }

  seek(playhead: Playhead): void {
    const { positionSeconds } = playhead.toPrimitive();
    for (const element of this.elements.values()) element.currentTime = positionSeconds;
  }

  playhead(): Playhead {
    return Playhead.create(this.master?.currentTime ?? 0, this.master?.duration || 0);
  }

  apply(mix: Mix): void {
    this.mix = mix;
    for (const [name, gain] of mix.gains()) {
      const element = this.elements.get(name.toPrimitive());
      if (element) element.volume = gain.toPrimitive();
    }
  }

  onEnded(listener: () => void): Unsubscribe {
    this.endedListeners.add(listener);
    return () => this.endedListeners.delete(listener);
  }

  private readonly resync = () => {
    if (!this.master || this.master.paused) return;
    const position = this.master.currentTime;
    for (const element of this.elements.values()) {
      if (element !== this.master && Math.abs(element.currentTime - position) > MAX_DRIFT_SECONDS) element.currentTime = position;
    }
  };

  private readonly handleEnded = () => {
    this.pause();
    for (const listener of this.endedListeners) listener();
  };

  private stopSync(): void {
    if (this.syncTimer !== null) window.clearInterval(this.syncTimer);
    this.syncTimer = null;
  }
}
