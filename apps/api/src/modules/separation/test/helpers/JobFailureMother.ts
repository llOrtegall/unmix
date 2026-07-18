import { faker } from "@faker-js/faker";
import { JobFailure, type JobFailurePrimitive } from "../../domain/JobFailure.ts";

export const createPrimitive = (overrides: Partial<JobFailurePrimitive> = {}): JobFailurePrimitive => ({
  code: faker.helpers.arrayElement(["INVALID_MEDIA", "DURATION_EXCEEDED", "SEPARATION_ERROR"] as const),
  message: faker.lorem.sentence(),
  ...overrides,
});

export const create = (overrides: Partial<JobFailurePrimitive> = {}): JobFailure =>
  JobFailure.fromPrimitive(createPrimitive(overrides));
