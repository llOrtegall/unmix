import { create } from "zustand";
import type { AudioEngine } from "@/application/ports/index.ts";
import { effectiveGain, initialMix, type MixState, toggleSolo } from "@/domain/mix.ts";
import type { Stem, StemName } from "@/domain/stem.ts";

type Status = "idle" | "loading" | "ready" | "error";

interface MixerState {
  status: Status;
  playing: boolean;
  duration: number;
  mix: MixState;
  engine: AudioEngine | null;
  load: (stems: Stem[], engine: AudioEngine) => Promise<void>;
  togglePlay: () => Promise<void>;
  pause: () => void;
  seek: (seconds: number) => void;
  setVolume: (name: StemName, volume: number) => void;
  toggleMute: (name: StemName) => void;
  toggleSolo: (name: StemName, exclusive: boolean) => void;
  dispose: () => void;
}

/** Mixer UI state. The domain decides gains (mix.ts); the engine only applies them. */
export const useMixer = create<MixerState>()((set, get) => {
  const apply = (mix: MixState) => {
    const { engine } = get();
    for (const name of Object.keys(mix) as StemName[]) engine?.setGain(name, effectiveGain(mix, name));
    set({ mix });
  };

  return {
    status: "idle",
    playing: false,
    duration: 0,
    mix: initialMix([]),
    engine: null,

    async load(stems, engine) {
      get().dispose();
      set({ status: "loading", engine, mix: initialMix(stems.map((s) => s.name)) });
      engine.onEnded(() => set({ playing: false }));
      try {
        await engine.load(stems.map((s) => ({ name: s.name, url: s.previewUrl })));
        if (get().engine !== engine) return; // a newer load replaced this one
        apply(get().mix);
        set({ status: "ready", duration: engine.duration });
      } catch {
        if (get().engine === engine) set({ status: "error" });
      }
    },

    async togglePlay() {
      const { engine, playing, status } = get();
      if (!engine || status !== "ready") return;
      if (playing) {
        engine.pause();
        set({ playing: false });
      } else {
        await engine.play();
        set({ playing: true });
      }
    },

    pause() {
      get().engine?.pause();
      set({ playing: false });
    },

    seek(seconds) {
      get().engine?.seek(seconds);
    },

    setVolume(name, volume) {
      const mix = structuredClone(get().mix);
      mix[name].volume = volume;
      apply(mix);
    },

    toggleMute(name) {
      const mix = structuredClone(get().mix);
      mix[name].muted = !mix[name].muted;
      apply(mix);
    },

    toggleSolo(name, exclusive) {
      apply(toggleSolo(get().mix, name, exclusive));
    },

    dispose() {
      get().engine?.dispose();
      set({ status: "idle", playing: false, duration: 0, engine: null });
    },
  };
});
