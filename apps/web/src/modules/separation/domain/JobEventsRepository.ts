import type { Unsubscribe } from "../../shared/domain/Unsubscribe.ts";
import type { JobId } from "./JobId.ts";
import type { JobListener } from "./JobListener.ts";

export interface JobEventsRepository {
  watch(id: JobId, listener: JobListener): Unsubscribe;
}
