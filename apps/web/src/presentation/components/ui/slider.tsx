import { Slider as SliderPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/presentation/lib/utils.ts";

export function Slider({ className, style, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("relative flex w-full touch-none items-center select-none data-[disabled]:opacity-40", className)}
      style={style}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-[var(--slider-color,var(--primary))]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block size-3.5 rounded-full border-2 border-[var(--slider-color,var(--primary))] bg-background shadow transition-[box-shadow] hover:ring-4 hover:ring-ring/30 focus-visible:ring-4 focus-visible:ring-ring/50 focus-visible:outline-none" />
    </SliderPrimitive.Root>
  );
}
