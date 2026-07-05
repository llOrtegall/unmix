import type { StemName } from "./stem.ts";

export interface ChannelState {
  volume: number; // 0..1
  muted: boolean;
  soloed: boolean;
}

export type MixState = Record<StemName, ChannelState>;

export const DEFAULT_CHANNEL: ChannelState = { volume: 0.8, muted: false, soloed: false };

export function initialMix(names: readonly StemName[]): MixState {
  return Object.fromEntries(names.map((n) => [n, { ...DEFAULT_CHANNEL }])) as MixState;
}

/** Solo wins over mute: if any channel is soloed, only soloed channels play. */
export function isAudible(mix: MixState, name: StemName): boolean {
  const channel = mix[name];
  if (!channel) return false;
  const anySolo = Object.values(mix).some((c) => c.soloed);
  return anySolo ? channel.soloed : !channel.muted;
}

export function effectiveGain(mix: MixState, name: StemName): number {
  return isAudible(mix, name) ? (mix[name]?.volume ?? 0) : 0;
}

export function toggleSolo(mix: MixState, name: StemName, exclusive: boolean): MixState {
  const next = structuredClone(mix);
  const target = !mix[name].soloed;
  if (exclusive) for (const key of Object.keys(next) as StemName[]) next[key].soloed = false;
  next[name].soloed = target;
  return next;
}
