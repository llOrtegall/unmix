import { faker } from "@faker-js/faker";
import { SEPARATION_REQUESTED_V1 } from "@unmix/contracts";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { BullMqEventRouteRepository } from "../../infrastructure/BullMqEventRouteRepository.ts";
import * as OutboxEventMother from "../helpers/OutboxEventMother.ts";

const REDIS_PORT = 6379;

const separationRequested = () => {
  const trackId = faker.string.uuid();
  return OutboxEventMother.pending({
    type: "separation.requested",
    payload: {
      jobId: faker.string.uuid(),
      trackId,
      inputKey: `tracks/${trackId}/original.mp3`,
      outputPrefix: `tracks/${trackId}/stems`,
      model: "htdemucs_6s",
    },
  });
};

describe("BullMqEventRouteRepository", () => {
  let container: StartedTestContainer;
  let redisUrl: string;
  let queue: Queue;
  let repository: BullMqEventRouteRepository;

  beforeAll(async () => {
    container = await new GenericContainer("redis:7-alpine").withExposedPorts(REDIS_PORT).start();
    redisUrl = `redis://${container.getHost()}:${container.getMappedPort(REDIS_PORT)}`;
  }, 120_000);

  afterEach(async () => {
    await queue.obliterate({ force: true });
    await queue.close();
  });

  afterAll(async () => {
    await container.stop();
  });

  const setup = () => {
    queue = new Queue(`separation-${faker.string.alphanumeric(10)}`, { connection: new Redis(redisUrl, { maxRetriesPerRequest: null }) });
    repository = new BullMqEventRouteRepository(queue);
  };

  it("enqueues a separation request as a versioned message with retries", async () => {
    setup();
    const event = separationRequested();
    const { id, payload } = event.toPrimitive();

    await repository.deliver(event);

    const job = await queue.getJob(String(payload.jobId));
    expect(job?.name).toBe(SEPARATION_REQUESTED_V1);
    expect(job?.data).toEqual({ ...payload, messageId: id });
    expect(job?.opts.attempts).toBe(3);
  });

  it("enqueues one job when the same event is delivered twice", async () => {
    setup();
    const event = separationRequested();

    await repository.deliver(event);
    await repository.deliver(event);

    expect(await queue.count()).toBe(1);
  });

  it("ignores events no external system listens to", async () => {
    setup();

    await repository.deliver(OutboxEventMother.pending({ type: "separation.completed" }));

    expect(await queue.count()).toBe(0);
  });

  it("refuses a request that breaks the message contract", async () => {
    setup();

    await expect(repository.deliver(OutboxEventMother.pending({ payload: { jobId: "not-a-uuid" } }))).rejects.toThrow();
    expect(await queue.count()).toBe(0);
  });
});
