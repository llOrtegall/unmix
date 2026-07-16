import { eq, inArray } from "drizzle-orm";
import type { DrizzleTransactionRepository } from "../../shared/infrastructure/DrizzleTransactionRepository.ts";
import type { JobRepository } from "../application/ports/index.ts";
import { type JobStatus, SeparationJob, type Stage } from "../domain/separation-job.ts";
import { separationJobs } from "./schema.ts";

export class DrizzleJobRepository implements JobRepository {
  #tx: DrizzleTransactionRepository;

  constructor(tx: DrizzleTransactionRepository) {
    this.#tx = tx;
  }

  async findById(id: string): Promise<SeparationJob | null> {
    const [row] = await this.#tx.executor().select().from(separationJobs).where(eq(separationJobs.id, id));
    return row ? toDomain(row) : null;
  }

  async save(job: SeparationJob): Promise<void> {
    const values = job.toSnapshot();
    await this.#tx
      .executor()
      .insert(separationJobs)
      .values(values)
      .onConflictDoUpdate({ target: separationJobs.id, set: values });
  }

  async findUnfinished(): Promise<SeparationJob[]> {
    const rows = await this.#tx
      .executor()
      .select()
      .from(separationJobs)
      .where(inArray(separationJobs.status, ["queued", "processing"]));
    return rows.map(toDomain);
  }
}

function toDomain(row: typeof separationJobs.$inferSelect): SeparationJob {
  return SeparationJob.restore({
    ...row,
    status: row.status as JobStatus,
    stage: row.stage as Stage | null,
    failure: row.failure ?? null,
  });
}
