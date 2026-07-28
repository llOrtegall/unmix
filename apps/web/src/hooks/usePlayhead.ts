import { useEffect, useState } from "react";
import { mixer } from "@/modules/mixer/application/factory.ts";
import { Playhead } from "@/modules/mixer/domain/Playhead.ts";
import { useMixer } from "./useMixer.ts";

const PAUSED_POLL_MS = 200;

/** Reads the playback clock once per frame while playing; keeps the store free of 60 fps updates. */
export function usePlayhead(): Playhead {
  const isReady = useMixer((state) => state.status === "ready");
  const isPlaying = useMixer((state) => state.isPlaying);
  const [playhead, setPlayhead] = useState(Playhead.start());

  useEffect(() => {
    if (!isReady) return;
    let frame = 0;
    const tick = () => {
      setPlayhead(mixer.findPlayhead());
      if (isPlaying) frame = requestAnimationFrame(tick);
    };
    tick();
    // Paused: still pick up seeks.
    const poll = isPlaying ? 0 : window.setInterval(() => setPlayhead(mixer.findPlayhead()), PAUSED_POLL_MS);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(poll);
    };
  }, [isReady, isPlaying]);

  return playhead;
}
