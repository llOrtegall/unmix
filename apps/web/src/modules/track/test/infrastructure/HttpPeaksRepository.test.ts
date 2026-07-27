import { afterEach, describe, expect, it, vi } from "vitest";
import { StemName } from "../../domain/StemName.ts";
import { HttpPeaksRepository } from "../../infrastructure/HttpPeaksRepository.ts";
import * as StemMother from "../helpers/StemMother.ts";

describe("HttpPeaksRepository", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads the peaks of every stem", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify({ version: 1, peaks: [0.1, 0.8] }))));

    const waveforms = await new HttpPeaksRepository().findForStems(StemMother.list(["vocals", "bass"]));

    expect(waveforms.toPrimitive()).toEqual({ vocals: [0.1, 0.8], bass: [0.1, 0.8] });
  });

  it("leaves a stem without a waveform when its peaks cannot be loaded", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ version: 1, peaks: [0.5] })))
        .mockResolvedValueOnce(new Response(null, { status: 403 }))
        .mockRejectedValueOnce(new TypeError("offline")),
    );

    const waveforms = await new HttpPeaksRepository().findForStems(StemMother.list(["vocals", "drums", "bass"]));

    expect(waveforms.peaksFor(StemName.create("vocals")).toPrimitive()).toEqual([0.5]);
    expect(waveforms.peaksFor(StemName.create("drums")).isEmpty()).toBe(true);
    expect(waveforms.peaksFor(StemName.create("bass")).isEmpty()).toBe(true);
  });
});
