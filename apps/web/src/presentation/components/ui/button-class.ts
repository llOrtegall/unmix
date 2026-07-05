// Plain class strings for Radix parts that render their own <button>.
const base =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-50";

const variants = {
  outline: "border bg-transparent hover:bg-accent",
  destructive: "bg-destructive text-white hover:bg-destructive/90",
} as const;

export const buttonClass = (variant: keyof typeof variants) => `${base} ${variants[variant]}`;
