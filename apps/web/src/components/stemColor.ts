import type { StemName } from "@/modules/track/domain/StemName.ts";

export const stemColor = (name: StemName): string => `var(--stem-${name.toPrimitive()})`;
