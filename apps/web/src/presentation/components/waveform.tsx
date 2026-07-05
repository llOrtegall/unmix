import { useEffect, useRef } from "react";

interface Props {
  peaks: number[];
  color: string;
  /** 0..1 */
  progress: number;
  /** Shared scale for every lane, so quiet stems look quiet. */
  max: number;
  dimmed?: boolean;
  label: string;
  onSeek: (fraction: number) => void;
}

/** Mirrored bar waveform on canvas; the played part is drawn in full color. */
export function Waveform({ peaks, color, progress, max, dimmed, label, onSeek }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = el.getBoundingClientRect();
      el.width = Math.round(width * dpr);
      el.height = Math.round(height * dpr);
      const ctx = el.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const resolved = getComputedStyle(el).getPropertyValue("--wave").trim() || "#fff";
      const bar = 2;
      const gap = 1;
      const count = Math.max(1, Math.floor(width / (bar + gap)));
      const mid = height / 2;
      const loudest = Math.max(0.05, max);
      for (let i = 0; i < count; i++) {
        const from = Math.floor((i / count) * peaks.length);
        const to = Math.max(from + 1, Math.floor(((i + 1) / count) * peaks.length));
        let peak = 0;
        for (let j = from; j < to; j++) peak = Math.max(peak, peaks[j] ?? 0);
        const h = Math.max(1, (peak / loudest) * (height - 4) * 0.95);
        const x = i * (bar + gap);
        ctx.globalAlpha = x / width <= progress ? 1 : 0.42;
        ctx.fillStyle = resolved;
        ctx.fillRect(x, mid - h / 2, bar, h);
      }
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(el);
    return () => observer.disconnect();
  }, [peaks, progress, color, max]);

  return (
    <canvas
      ref={canvas}
      role="slider"
      tabIndex={-1}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onSeek((e.clientX - rect.left) / rect.width);
      }}
      className="h-14 w-full cursor-pointer transition-opacity"
      style={{ ["--wave" as string]: color, opacity: dimmed ? 0.35 : 1 }}
    />
  );
}
