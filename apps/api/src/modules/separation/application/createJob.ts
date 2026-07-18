import type { EventRepository } from "../../shared/domain/EventRepository.ts";
import { UserId } from "../../shared/domain/UserId.ts";
import { TrackId } from "../../library/domain/TrackId.ts";
import type { JobRepository } from "../domain/JobRepository.ts";
import type { ModelName } from "../domain/ModelName.ts";
import { SeparationJob } from "../domain/SeparationJob.ts";
import type { TrackCatalogRepository } from "../domain/TrackCatalogRepository.ts";

interface Dependencies {
  readonly trackCatalogRepository: TrackCatalogRepository;
  readonly jobRepository: JobRepository;
  readonly eventRepository: EventRepository;
  readonly model: ModelName;
}

export const createJob =
  ({ trackCatalogRepository, jobRepository, eventRepository, model }: Dependencies) =>
  async (trackId: string, userId: string): Promise<SeparationJob> => {
    const track = await trackCatalogRepository.findSeparableTrack(TrackId.fromPrimitive(trackId), UserId.fromPrimitive(userId));
    const job = SeparationJob.request(track, model);
    await jobRepository.save(job);
    await eventRepository.publish(job.getEvents());
    return job;
  };
