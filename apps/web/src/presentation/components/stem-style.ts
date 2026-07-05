import type { StemName } from "@/domain/stem.ts";

export const stemColor = (name: StemName) => `var(--stem-${name})`;
