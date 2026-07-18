import { faker } from "@faker-js/faker";
import { SeparationJob, type SeparationJobPrimitive } from "../../domain/SeparationJob.ts";
import * as JobFailureMother from "./JobFailureMother.ts";

export const createPrimitive = (overrides: Partial<SeparationJobPrimitive> = {}): SeparationJobPrimitive => ({
  id: faker.string.uuid(),
  trackId: faker.string.uuid(),
  model: "htdemucs_6s",
  status: "queued",
  stage: null,
  progress: 0,
  failure: null,
  createdAt: faker.date.recent().toISOString(),
  finishedAt: null,
  ...overrides,
});

export const create = (overrides: Partial<SeparationJobPrimitive> = {}): SeparationJob =>
  SeparationJob.fromPrimitive(createPrimitive(overrides));

export const queued = (overrides: Partial<SeparationJobPrimitive> = {}): SeparationJob => create(overrides);

export const processing = (overrides: Partial<SeparationJobPrimitive> = {}): SeparationJob =>
  create({ status: "processing", stage: "separating", progress: faker.number.int({ min: 1, max: 99 }), ...overrides });

export const completed = (overrides: Partial<SeparationJobPrimitive> = {}): SeparationJob =>
  create({ status: "completed", stage: "uploading", progress: 100, finishedAt: faker.date.recent().toISOString(), ...overrides });

export const failed = (overrides: Partial<SeparationJobPrimitive> = {}): SeparationJob =>
  create({
    status: "failed",
    stage: "normalizing",
    progress: faker.number.int({ min: 0, max: 99 }),
    failure: JobFailureMother.createPrimitive(),
    finishedAt: faker.date.recent().toISOString(),
    ...overrides,
  });
