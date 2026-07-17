import { faker } from "@faker-js/faker";
import { SampleEvent, type SampleEventPrimitive } from "./SampleEvent.ts";

export const createPrimitive = (overrides: Partial<SampleEventPrimitive> = {}): SampleEventPrimitive => ({
  id: faker.string.uuid(),
  type: SampleEvent.TYPE,
  occurredAt: faker.date.recent().toISOString(),
  payload: { note: faker.lorem.sentence() },
  ...overrides,
});

export const create = (overrides: Partial<SampleEventPrimitive> = {}): SampleEvent =>
  SampleEvent.fromPrimitive(createPrimitive(overrides));
