import { useEffect, useRef } from "react";
import type { WaveformPeaks } from "@/modules/track/domain/WaveformPeaks.ts";

interface Props {
  readonly peaks: WaveformPeaks;
  readonly color: string;
  /** 0..1 */
  readonly progress: number;
  /** Shared scale for every lane, so quiet stems look quiet. */
  readonly loudest: number;
  readonly isDimmed: boolean;
  readonly label: string;
  readonly onSeek: (fraction: number) => void;
}

const BAR_WIDTH = 2;
const BAR_GAP = 1;
const QUIETEST_SCALE = 0.05;
const PLAYED_OPACITY = 1;
const UNPLAYED_OPACITY = 0.42;

/** Mirrored bar waveform on canvas; the played part is drawn in full color. */
export function Waveform({ peaks, color, progress, loudest, isDimmed, label, onSeek }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const values = peaks.toPrimitive();
    const draw = () => {
      const ratio = window.devicePixelRatio || 1;
      const { width, height } = element.getBoundingClientRect();
      element.width = Math.round(width * ratio);
      element.height = Math.round(height * ratio);
      const context = element.getContext("2d");
      if (!context) return;
      context.scale(ratio, ratio);
      context.clearRect(0, 0, width, height);

      const fill = getComputedStyle(element).getPropertyValue("--wave").trim() || "#fff";
      const count = Math.max(1, Math.floor(width / (BAR_WIDTH + BAR_GAP)));
      const middle = height / 2;
      const scale = Math.max(QUIETEST_SCALE, loudest);
      for (let i = 0; i < count; i++) {
        const from = Math.floor((i / count) * values.length);
        const to = Math.max(from + 1, Math.floor(((i + 1) / count) * values.length));
        let peak = 0;
        for (let j = from; j < to; j++) peak = Math.max(peak, values[j] ?? 0);
        const barHeight = Math.max(1, (peak / scale) * (height - 4) * 0.95);
        const x = i * (BAR_WIDTH + BAR_GAP);
        context.globalAlpha = x / width <= progress ? PLAYED_OPACITY : UNPLAYED_OPACITY;
        context.fillStyle = fill;
        context.fillRect(x, middle - barHeight / 2, BAR_WIDTH, barHeight);
      }
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    return () => observer.disconnect();
  }, [peaks, progress, color, loudest]);

  return (
    <canvas
      ref={canvas}
      role="slider"
      tabIndex={-1}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        onSeek((event.clientX - rect.left) / rect.width);
      }}
      className="h-14 w-full cursor-pointer transition-opacity"
      style={{ ["--wave" as string]: color, opacity: isDimmed ? 0.35 : 1 }}
    />
  );
}
