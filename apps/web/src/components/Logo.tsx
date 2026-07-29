const BARS = [
  ["--stem-vocals", 10],
  ["--stem-drums", 18],
  ["--stem-bass", 12],
  ["--stem-guitar", 6],
] as const;

export function Logo() {
  return (
    <div aria-hidden className="flex size-9 items-center justify-center gap-[3px] rounded-lg border bg-card">
      {BARS.map(([color, height]) => (
        <span key={color} className="w-[3px] rounded-full transition-[height] group-hover:h-5" style={{ height, background: `var(${color})` }} />
      ))}
    </div>
  );
}
