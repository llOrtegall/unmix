import { create } from "zustand";
import { mixer } from "@/modules/mixer/application/factory.ts";
import type { Mix } from "@/modules/mixer/domain/Mix.ts";
import type { DomainError } from "@/modules/shared/domain/DomainError.ts";
import type { StemList } from "@/modules/track/domain/StemList.ts";

type Status = "idle" | "loading" | "ready" | "error";

interface MixerState {
  status: Status;
  isPlaying: boolean;
  mix: Mix | null;
  error: DomainError | null;
  loading: symbol | null;
  load: (stems: StemList) => Promise<void>;
  unload: () => void;
  togglePlayback: () => Promise<void>;
  seekTo: (fraction: number) => void;
  setVolume: (stem: string, volume: number) => void;
  toggleMute: (stem: string) => void;
  toggleSolo: (stem: string) => void;
  toggleExclusiveSolo: (stem: string) => void;
}

/** Mixer UI state. The domain decides gains (Mix); the use cases apply them. */
export const useMixer = create<MixerState>()((set, get) => {
  mixer.watchPlaybackEnd(() => set({ isPlaying: false }));

  const change = (apply: (mix: Mix) => Mix) => {
    const { mix } = get();
    if (mix) set({ mix: apply(mix) });
  };

  return {
    status: "idle",
    isPlaying: false,
    mix: null,
    error: null,
    loading: null,

    async load(stems) {
      const loading = Symbol("load");
      set({ status: "loading", isPlaying: false, mix: null, error: null, loading });
      try {
        const mix = await mixer.loadMix(stems);
        if (get().loading === loading) set({ status: "ready", mix });
      } catch (failure) {
        if (get().loading === loading) set({ status: "error", error: failure as DomainError });
      }
    },

    unload() {
      mixer.unloadMix();
      set({ status: "idle", isPlaying: false, mix: null, loading: null });
    },

    async togglePlayback() {
      if (get().status !== "ready") return;
      set({ isPlaying: await mixer.togglePlayback() });
    },

    seekTo(fraction) {
      mixer.seekTo(fraction);
    },

    setVolume(stem, volume) {
      change((mix) => mixer.setChannelVolume({ mix, stem, volume }));
    },

    toggleMute(stem) {
      change((mix) => mixer.toggleChannelMute({ mix, stem }));
    },

    toggleSolo(stem) {
      change((mix) => mixer.toggleChannelSolo({ mix, stem }));
    },

    toggleExclusiveSolo(stem) {
      change((mix) => mixer.toggleExclusiveChannelSolo({ mix, stem }));
    },
  };
});
