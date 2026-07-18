import { faker } from "@faker-js/faker";
import { SeparationResult, type SeparationResultPrimitive } from "../../domain/SeparationResult.ts";
import * as StemMother from "../../../library/test/helpers/StemMother.ts";

export const createPrimitive = (overrides: Partial<SeparationResultPrimitive> = {}): SeparationResultPrimitive => ({
  durationSeconds: faker.number.float({ min: 30, max: 600, fractionDigits: 1 }),
  stems: StemMother.listPrimitive(),
  ...overrides,
});

export const create = (overrides: Partial<SeparationResultPrimitive> = {}): SeparationResult =>
  SeparationResult.fromPrimitive(createPrimitive(overrides));
