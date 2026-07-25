import { faker } from "@faker-js/faker";
import { SeparationFailureCode } from "@unmix/contracts";
import { type Processor, Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { JobId } from "../../../shared/domain/JobId.ts";
import { JobFailure } from "../../domain/JobFailure.ts";
import { BullMqQueueRepository } from "../../infrastructure/BullMqQueueRepository.ts";
import * as SeparationResultMother from "../helpers/SeparationResultMother.ts";

const REDIS_PORT = 6379;
const FINISHED = ["completed", "failed"];

describe("BullMqQueueRepository", () => {
  let container: StartedTestContainer;
  let redisUrl: string;
  const closables: { close(): Promise<unknown> }[] = [];

  const connect = () => new Redis(redisUrl, { maxRetriesPerRequest: null });

  const setup = () => {
    const queue = new Queue(`separation-${faker.string.alphanumeric(10)}`, { connection: connect() });
    closables.push(queue);
    return { queue, repository: new BullMqQueueRepository(queue) };
  };

  const enqueue = async (queue: Queue, processor?: Processor): Promise<JobId> => {
    const id = JobId.generate();
    if (processor) closables.push(new Worker(queue.name, processor, { connection: connect() }));
    await queue.add("separate", {}, { jobId: id.toPrimitive(), attempts: 1 });
    return id;
  };

  const settle = async (queue: Queue, processor: Processor): Promise<JobId> => {
    const id = await enqueue(queue, processor);
    await vi.waitFor(async () => expect(FINISHED).toContain(await queue.getJobState(id.toPrimitive())), { timeout: 10_000 });
    return id;
  };

  beforeAll(async () => {
    container = await new GenericContainer("redis:7-alpine").withExposedPorts(REDIS_PORT).start();
    redisUrl = `redis://${container.getHost()}:${container.getMappedPort(REDIS_PORT)}`;
  }, 120_000);

  afterEach(async () => {
    await Promise.all(closables.splice(0).map((closable) => closable.close()));
  });

  afterAll(async () => {
    await container.stop();
  });

  describe("Basic behaviour", () => {
    it("reports a job the queue does not know as missing", async () => {
      const { repository } = setup();

      expect((await repository.findState(JobId.generate())).toPrimitive()).toEqual({ state: "missing" });
    });

    it("reports a waiting job as pending", async () => {
      const { queue, repository } = setup();
      const id = await enqueue(queue);

      expect((await repository.findState(id)).toPrimitive()).toEqual({ state: "pending" });
    });

    it("reports the progress of an active job", async () => {
      const { queue, repository } = setup();
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const id = await enqueue(queue, async (job) => {
        await job.updateProgress({ stage: "separating", progress: 40 });
        await gate;
      });

      await vi.waitFor(
        async () => expect((await repository.findState(id)).toPrimitive()).toEqual({ state: "active", stage: "separating", progress: 40 }),
        { timeout: 10_000 },
      );
      release();
    });

    it("reads the worker's result, defaulting a missing MIDI key to null", async () => {
      const { queue, repository } = setup();
      const result = SeparationResultMother.createPrimitive();
      const id = await settle(queue, async (job) => ({
        jobId: job.id,
        trackId: faker.string.uuid(),
        durationSeconds: result.durationSeconds,
        stems: result.stems.map(({ midiKey: _midiKey, ...stem }) => ({ ...stem, format: "flac" })),
      }));

      expect((await repository.findState(id)).toPrimitive()).toEqual({
        state: "completed",
        result: { ...result, stems: result.stems.map((stem) => ({ ...stem, midiKey: null })) },
      });
    });

    it("reads the worker's failure", async () => {
      const { queue, repository } = setup();
      const failure = { code: "separation.duration_exceeded", message: "Track lasts 720 s; the limit is 600 s.", retryable: false };
      const id = await settle(queue, async () => {
        throw new Error(JSON.stringify(failure));
      });

      expect((await repository.findState(id)).toPrimitive()).toEqual({
        state: "failed",
        failure: { code: failure.code, message: failure.message },
      });
    });
  });

  describe("Edge cases", () => {
    it("reports an active job without progress as pending", async () => {
      const { queue, repository } = setup();
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const id = await enqueue(queue, () => gate);

      await vi.waitFor(async () => expect(await queue.getJobState(id.toPrimitive())).toBe("active"), { timeout: 10_000 });
      expect((await repository.findState(id)).toPrimitive()).toEqual({ state: "pending" });
      release();
    });

    it("fails with a generic code when the worker's reason is not a known failure", async () => {
      const { queue, repository } = setup();
      const id = await settle(queue, async () => {
        throw new Error("segmentation fault");
      });

      expect((await repository.findState(id)).toPrimitive()).toEqual({
        state: "failed",
        failure: { code: "separation.failed", message: "segmentation fault" },
      });
    });

    it("fails with a generic code when the worker sends a code from before the rename", async () => {
      const { queue, repository } = setup();
      const reason = JSON.stringify({ code: "DURATION_EXCEEDED", message: "Track lasts 720 s.", retryable: false });
      const id = await settle(queue, async () => {
        throw new Error(reason);
      });

      expect((await repository.findState(id)).toPrimitive()).toEqual({
        state: "failed",
        failure: { code: "separation.failed", message: reason },
      });
    });

    it("fails when the worker's result breaks the contract", async () => {
      const { queue, repository } = setup();
      const id = await settle(queue, async () => ({ stems: "none" }));

      expect((await repository.findState(id)).toPrimitive()).toEqual({
        state: "failed",
        failure: { code: "separation.failed", message: "The worker returned an invalid result." },
      });
    });

    it.each(SeparationFailureCode.options)("accepts the contract failure code %s", (code) => {
      expect(JobFailure.create(code, faker.lorem.sentence()).toPrimitive().code).toBe(code);
    });
  });
});
