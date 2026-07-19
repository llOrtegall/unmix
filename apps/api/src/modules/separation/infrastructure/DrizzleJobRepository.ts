import { asc, eq, inArray } from "drizzle-orm";
import type { JobId } from "../../shared/domain/JobId.ts";
import type { DrizzleTransactionRepository } from "../../shared/infrastructure/DrizzleTransactionRepository.ts";
import type { JobRepository } from "../domain/JobRepository.ts";
import type { JobStatusPrimitive } from "../domain/JobStatus.ts";
import type { ModelNamePrimitive } from "../domain/ModelName.ts";
import { SeparationJob } from "../domain/SeparationJob.ts";
import { SeparationJobList } from "../domain/SeparationJobList.ts";
import type { StagePrimitive } from "../domain/Stage.ts";
import { separationJobs } from "./jobSchema.ts";

type JobRow = typeof separationJobs.$inferSelect;

const UNFINISHED_STATUSES: JobStatusPrimitive[] = ["queued", "processing"];

export class DrizzleJobRepository implements JobRepository {
  private readonly transactions: DrizzleTransactionRepository;

  constructor(transactions: DrizzleTransactionRepository) {
    this.transactions = transactions;
  }

  async save(job: SeparationJob): Promise<void> {
    const row = this.toRow(job);
    await this.transactions.executor().insert(separationJobs).values(row).onConflictDoUpdate({ target: separationJobs.id, set: row });
  }

  async findById(id: JobId): Promise<SeparationJob | null> {
    const [row] = await this.selectById(id);
    return row ? this.toDomain(row) : null;
  }

  async findByIdForUpdate(id: JobId): Promise<SeparationJob | null> {
    const [row] = await this.selectById(id).for("update");
    return row ? this.toDomain(row) : null;
  }

  async findUnfinished(): Promise<SeparationJobList> {
    const rows = await this.transactions
      .executor()
      .select()
      .from(separationJobs)
      .where(inArray(separationJobs.status, UNFINISHED_STATUSES))
      .orderBy(asc(separationJobs.createdAt));
    return SeparationJobList.create(rows.map((row) => this.toDomain(row)));
  }

  private selectById(id: JobId) {
    return this.transactions.executor().select().from(separationJobs).where(eq(separationJobs.id, id.toPrimitive()));
  }

  private toRow(job: SeparationJob): typeof separationJobs.$inferInsert {
    const primitive = job.toPrimitive();
    return {
      ...primitive,
      createdAt: new Date(primitive.createdAt),
      finishedAt: primitive.finishedAt === null ? null : new Date(primitive.finishedAt),
    };
  }

  private toDomain(row: JobRow): SeparationJob {
    return SeparationJob.fromPrimitive({
      id: row.id,
      trackId: row.trackId,
      model: row.model as ModelNamePrimitive,
      status: row.status as JobStatusPrimitive,
      stage: row.stage as StagePrimitive | null,
      progress: row.progress,
      failure: row.failure,
      createdAt: row.createdAt.toISOString(),
      finishedAt: row.finishedAt?.toISOString() ?? null,
    });
  }
}
