import { faker } from "@faker-js/faker";
import { Job, type JobPrimitive } from "../../domain/Job.ts";

export const createPrimitive = (overrides: Partial<JobPrimitive> = {}): JobPrimitive => ({
  id: faker.string.uuid(),
  trackId: faker.string.uuid(),
  status: "processing",
  stage: "separating",
  progress: faker.number.int({ min: 10, max: 90 }),
  failure: null,
  ...overrides,
});

export const create = (overrides: Partial<JobPrimitive> = {}): Job => Job.fromPrimitive(createPrimitive(overrides));

export const queued = (overrides: Partial<JobPrimitive> = {}): Job => create({ status: "queued", stage: null, progress: 0, ...overrides });

export const completed = (overrides: Partial<JobPrimitive> = {}): Job =>
  create({ status: "completed", stage: "uploading", progress: 100, ...overrides });

export const failed = (code = "separation.failed", overrides: Partial<JobPrimitive> = {}): Job =>
  create({ status: "failed", failure: { code, message: faker.lorem.sentence() }, ...overrides });
