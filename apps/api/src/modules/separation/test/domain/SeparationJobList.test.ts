import { describe, expect, it } from "vitest";
import { DuplicatedJobError } from "../../domain/errors/DuplicatedJobError.ts";
import { SeparationJobList } from "../../domain/SeparationJobList.ts";
import * as SeparationJobMother from "../helpers/SeparationJobMother.ts";

describe("SeparationJobList", () => {
  it("survives a primitive round-trip", () => {
    const primitive = [SeparationJobMother.queued().toPrimitive(), SeparationJobMother.processing().toPrimitive()];

    expect(SeparationJobList.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
  });

  it("counts and maps its jobs", () => {
    const jobs = [SeparationJobMother.queued(), SeparationJobMother.processing()];
    const list = SeparationJobList.create(jobs);

    expect(list.count()).toBe(2);
    expect(list.map((job) => job.getId())).toEqual(jobs.map((job) => job.getId()));
    expect(SeparationJobList.empty().isEmpty()).toBe(true);
  });

  it("compares by content", () => {
    const job = SeparationJobMother.queued();

    expect(SeparationJobList.create([job]).equals(SeparationJobList.create([job]))).toBe(true);
    expect(SeparationJobList.create([job]).equals(SeparationJobList.empty())).toBe(false);
  });

  it("rejects the same job twice", () => {
    const job = SeparationJobMother.queued();

    expect(() => SeparationJobList.create([job, job])).toThrow(DuplicatedJobError);
  });
});
