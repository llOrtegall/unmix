import type { JobId } from "../../shared/domain/JobId.ts";
import type { QueueJobState } from "./QueueJobState.ts";

export interface QueueRepository {
  findState(id: JobId): Promise<QueueJobState>;
}
