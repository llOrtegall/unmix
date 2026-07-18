import type { EventRepository } from "../../shared/domain/EventRepository.ts";
import type { TransactionRepository } from "../../shared/domain/TransactionRepository.ts";
import type { JobRepository } from "../domain/JobRepository.ts";
import type { ModelName } from "../domain/ModelName.ts";
import type { SeparationJob } from "../domain/SeparationJob.ts";
import type { TrackCatalogRepository } from "../domain/TrackCatalogRepository.ts";
import { createJob } from "./createJob.ts";

interface Dependencies {
  readonly trackCatalogRepository: TrackCatalogRepository;
  readonly jobRepository: JobRepository;
  readonly eventRepository: EventRepository;
  readonly transactionRepository: TransactionRepository;
  readonly model: ModelName;
}

// The library reacts to the published request in the same transaction, so the track and the job change together.
export const requestSeparation = ({ transactionRepository, ...dependencies }: Dependencies) => {
  const create = createJob(dependencies);

  return (trackId: string, userId: string): Promise<SeparationJob> => transactionRepository.run(() => create(trackId, userId));
};
