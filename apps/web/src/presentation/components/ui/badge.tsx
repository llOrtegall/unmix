import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/presentation/lib/utils.ts";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3", {
  variants: {
    variant: {
      default: "border-transparent bg-primary/15 text-primary",
      secondary: "border-transparent bg-secondary text-secondary-foreground",
      success: "border-transparent bg-emerald-500/15 text-emerald-300",
      warning: "border-transparent bg-amber-500/15 text-amber-300",
      destructive: "border-transparent bg-destructive/15 text-red-300",
      outline: "text-muted-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}
