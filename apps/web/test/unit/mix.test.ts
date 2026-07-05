import { describe, expect, it } from "vitest";
import { effectiveGain, initialMix, isAudible, toggleSolo } from "../../src/domain/mix.ts";
import { STEM_ORDER } from "../../src/domain/stem.ts";

describe("mix rules", () => {
  it("plays everything by default at the default volume", () => {
    const mix = initialMix(STEM_ORDER);
    expect(STEM_ORDER.every((n) => isAudible(mix, n))).toBe(true);
    expect(effectiveGain(mix, "vocals")).toBe(0.8);
  });

  it("mute silences only that channel", () => {
    const mix = initialMix(STEM_ORDER);
    mix.drums.muted = true;
    expect(effectiveGain(mix, "drums")).toBe(0);
    expect(isAudible(mix, "bass")).toBe(true);
  });

  it("solo wins over mute and silences the rest", () => {
    let mix = initialMix(STEM_ORDER);
    mix.vocals.muted = true;
    mix = toggleSolo(mix, "vocals", false);
    mix = toggleSolo(mix, "bass", false);
    expect(isAudible(mix, "vocals")).toBe(true);
    expect(isAudible(mix, "bass")).toBe(true);
    expect(isAudible(mix, "drums")).toBe(false);
  });

  it("exclusive solo keeps a single channel", () => {
    let mix = toggleSolo(initialMix(STEM_ORDER), "vocals", false);
    mix = toggleSolo(mix, "guitar", true);
    expect(STEM_ORDER.filter((n) => isAudible(mix, n))).toEqual(["guitar"]);
  });
});
