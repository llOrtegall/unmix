import type { Queue } from "bullmq";
import type { EventRepository } from "../../shared/domain/EventRepository.ts";
import type { DrizzleTransactionRepository } from "../../shared/infrastructure/DrizzleTransactionRepository.ts";
import type { LibraryModule } from "../../library/application/factory.ts";
import { ModelName } from "../domain/ModelName.ts";
import { BullMqQueueRepository } from "../infrastructure/BullMqQueueRepository.ts";
import { DrizzleJobRepository } from "../infrastructure/DrizzleJobRepository.ts";
import { InMemoryJobUpdatesRepository } from "../infrastructure/InMemoryJobUpdatesRepository.ts";
import { LibraryTrackCatalogRepository } from "../infrastructure/LibraryTrackCatalogRepository.ts";
import { findJob } from "./findJob.ts";
import { reconcileJobs } from "./reconcileJobs.ts";
import { recordJobProgress } from "./recordJobProgress.ts";
import { requestSeparation } from "./requestSeparation.ts";
import { syncJob } from "./syncJob.ts";
import { watchJob } from "./watchJob.ts";

export const separationModule = ({
  transactions,
  eventRepository,
  queue,
  library,
  model,
}: {
  readonly transactions: DrizzleTransactionRepository;
  readonly eventRepository: EventRepository;
  readonly queue: Queue;
  readonly library: LibraryModule;
  readonly model: string;
}) => {
  const jobRepository = new DrizzleJobRepository(transactions);
  const queueRepository = new BullMqQueueRepository(queue);
  const jobUpdatesRepository = new InMemoryJobUpdatesRepository();
  const trackCatalogRepository = new LibraryTrackCatalogRepository(library);
  const transactionRepository = transactions;
  const separationModel = ModelName.create(model);

  return {
    requestSeparation: requestSeparation({ trackCatalogRepository, jobRepository, eventRepository, transactionRepository, model: separationModel }),
    findJob: findJob({ jobRepository, trackCatalogRepository }),
    watchJob: watchJob({ jobRepository, trackCatalogRepository, jobUpdatesRepository }),
    recordJobProgress: recordJobProgress({ jobRepository, eventRepository, transactionRepository, jobUpdatesRepository }),
    syncJob: syncJob({ jobRepository, eventRepository, transactionRepository, jobUpdatesRepository, queueRepository }),
    reconcileJobs: reconcileJobs({ jobRepository, eventRepository, transactionRepository, jobUpdatesRepository, queueRepository }),
  };
};

export type SeparationModule = ReturnType<typeof separationModule>;
