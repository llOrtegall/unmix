import { config } from "../../../config.ts";
import { EventSourceJobEventsRepository } from "../infrastructure/EventSourceJobEventsRepository.ts";
import { HttpJobRepository } from "../infrastructure/HttpJobRepository.ts";
import { requestSeparation } from "./requestSeparation.ts";
import { watchJob } from "./watchJob.ts";

export const separationModule = (baseUrl: string) => {
  const jobRepository = new HttpJobRepository(baseUrl);
  const jobEventsRepository = new EventSourceJobEventsRepository(baseUrl);

  return {
    watchJob: watchJob({ jobRepository, jobEventsRepository }),
    requestSeparation: requestSeparation({ jobRepository }),
  };
};

export type SeparationModule = ReturnType<typeof separationModule>;

export const separation = separationModule(config.apiBaseUrl);
