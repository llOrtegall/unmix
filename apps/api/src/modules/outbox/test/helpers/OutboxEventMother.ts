import { faker } from "@faker-js/faker";
import { OutboxEvent, type OutboxEventPrimitive } from "../../domain/OutboxEvent.ts";

export const createPrimitive = (overrides: Partial<OutboxEventPrimitive> = {}): OutboxEventPrimitive => ({
  id: faker.string.uuid(),
  type: "separation.requested",
  payload: { jobId: faker.string.uuid(), note: faker.lorem.word() },
  attempts: 0,
  publishedAt: null,
  lastFailure: null,
  ...overrides,
});

export const create = (overrides: Partial<OutboxEventPrimitive> = {}): OutboxEvent =>
  OutboxEvent.fromPrimitive(createPrimitive(overrides));

export const pending = (overrides: Partial<OutboxEventPrimitive> = {}): OutboxEvent => create(overrides);

export const published = (overrides: Partial<OutboxEventPrimitive> = {}): OutboxEvent =>
  create({ publishedAt: faker.date.recent().toISOString(), ...overrides });

export const failedBefore = (overrides: Partial<OutboxEventPrimitive> = {}): OutboxEvent =>
  create({ attempts: faker.number.int({ min: 1, max: 5 }), lastFailure: faker.lorem.sentence(), ...overrides });
