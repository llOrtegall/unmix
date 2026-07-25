import { readFile } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { JobId } from "../../../shared/domain/JobId.ts";
import { startTestDatabase, type TestDatabase } from "../../../shared/test/helpers/TestDatabase.ts";
import { DrizzleJobRepository } from "../../infrastructure/DrizzleJobRepository.ts";
import * as SeparationJobMother from "../helpers/SeparationJobMother.ts";
import * as SeparationResultMother from "../helpers/SeparationResultMother.ts";

const LOCK_HOLD_MS = 300;
const FAILURE_CODES_MIGRATION = new URL("../../../../../drizzle/0005_separation_failure_codes.sql", import.meta.url);

describe("DrizzleJobRepository", () => {
  let database: TestDatabase;
  let repository: DrizzleJobRepository;

  beforeAll(async () => {
    database = await startTestDatabase();
    repository = new DrizzleJobRepository(database.transactions);
  }, 120_000);

  afterAll(async () => {
    await database.stop();
  });

  beforeEach(async () => {
    await database.truncate();
  });

  it("stores a job and reads it back unchanged", async () => {
    const job = SeparationJobMother.failed();

    await repository.save(job);

    expect((await repository.findById(job.getId()))?.toPrimitive()).toEqual(job.toPrimitive());
  });

  it("updates the stored job on every save", async () => {
    const job = SeparationJobMother.processing();
    const completed = job.complete(SeparationResultMother.create());

    await repository.save(job);
    await repository.save(completed);

    expect((await repository.findById(job.getId()))?.toPrimitive()).toEqual(completed.toPrimitive());
  });

  it("finds nothing for an unknown id", async () => {
    expect(await repository.findById(JobId.generate())).toBeNull();
    expect(await repository.findByIdForUpdate(JobId.generate())).toBeNull();
  });

  it("lists the unfinished jobs, oldest first", async () => {
    const older = SeparationJobMother.processing({ createdAt: "2026-07-01T10:00:00.000Z" });
    const newer = SeparationJobMother.queued({ createdAt: "2026-07-01T11:00:00.000Z" });
    for (const job of [newer, SeparationJobMother.completed(), older, SeparationJobMother.failed()]) await repository.save(job);

    const unfinished = await repository.findUnfinished();

    expect(unfinished.map((job) => job.getId().toPrimitive())).toEqual([older.getId().toPrimitive(), newer.getId().toPrimitive()]);
  });

  it("makes a second transaction wait for a job locked for update", async () => {
    const job = SeparationJobMother.processing();
    await repository.save(job);
    let signalLocked!: () => void;
    const locked = new Promise<void>((resolve) => {
      signalLocked = resolve;
    });

    const first = database.transactions.run(async () => {
      await repository.findByIdForUpdate(job.getId());
      signalLocked();
      await new Promise((resolve) => setTimeout(resolve, LOCK_HOLD_MS));
      await repository.save(job.complete(SeparationResultMother.create()));
    });
    await locked;
    const second = database.transactions.run(() => repository.findByIdForUpdate(job.getId()));
    await first;

    expect((await second)?.toPrimitive().status).toBe("completed");
  });

  it("renames the failure codes stored before the separation.* codes", async () => {
    const job = SeparationJobMother.failed();
    await repository.save(job);
    await database.db.execute(sql`UPDATE separation_jobs SET failure = jsonb_set(failure, '{code}', '"DURATION_EXCEEDED"')`);
    const migration = await readFile(FAILURE_CODES_MIGRATION, "utf8");

    for (const statement of migration.split("--> statement-breakpoint")) await database.db.execute(sql.raw(statement));

    expect((await repository.findById(job.getId()))?.toPrimitive().failure?.code).toBe("separation.duration_exceeded");
  });
});
