import type { FastifyBaseLogger } from "fastify";
import { describe, expect, it, vi } from "vitest";
import { UserRegistered } from "../modules/identity/domain/UserRegistered.ts";
import type { LibraryModule } from "../modules/library/application/factory.ts";
import * as TrackMother from "../modules/library/test/helpers/TrackMother.ts";
import { ModelName } from "../modules/separation/domain/ModelName.ts";
import { SeparationJob } from "../modules/separation/domain/SeparationJob.ts";
import * as JobFailureMother from "../modules/separation/test/helpers/JobFailureMother.ts";
import * as SeparationJobMother from "../modules/separation/test/helpers/SeparationJobMother.ts";
import * as SeparationResultMother from "../modules/separation/test/helpers/SeparationResultMother.ts";
import type { DomainEvent } from "../modules/shared/domain/DomainEvent.ts";
import { DomainEventList } from "../modules/shared/domain/DomainEventList.ts";
import type { DomainEventClass, DomainEventHandler } from "../modules/shared/domain/EventRepository.ts";
import * as EventRepositoryMother from "../modules/shared/test/helpers/EventRepositoryMother.ts";
import * as UserIdMother from "../modules/shared/test/helpers/UserIdMother.ts";
import { libraryEventConsumer } from "./libraryEventConsumer.ts";

const log = { error: vi.fn() };

const subscribe = (library: Partial<LibraryModule>) => {
  const handlers = new Map<string, DomainEventHandler<DomainEvent>>();
  const eventRepository = EventRepositoryMother.create({
    subscribe: vi.fn(<E extends DomainEvent>(eventClass: DomainEventClass<E>, handler: DomainEventHandler<E>) => {
      handlers.set(eventClass.TYPE, handler as DomainEventHandler<DomainEvent>);
    }),
  });
  libraryEventConsumer(eventRepository, library as LibraryModule, log as unknown as FastifyBaseLogger);
  return (events: DomainEventList) => Promise.all(events.map((event) => handlers.get(event.getType())!(event)));
};

const sameJob = (job: SeparationJob) =>
  expect.objectContaining({ trackId: job.getTrackId().toPrimitive(), jobId: job.getId().toPrimitive() });

describe("libraryEventConsumer", () => {
  it("gives every new user the demo song", async () => {
    const addDemoTrack = vi.fn().mockResolvedValue(null);
    const dispatch = subscribe({ addDemoTrack });
    const userId = UserIdMother.create();

    await dispatch(DomainEventList.empty().add(UserRegistered.occur(userId)));

    expect(addDemoTrack).toHaveBeenCalledWith(userId.toPrimitive());
  });

  it("logs a demo song that could not be added instead of failing the sign-up", async () => {
    const dispatch = subscribe({ addDemoTrack: vi.fn().mockRejectedValue(new Error("storage down")) });

    await dispatch(DomainEventList.empty().add(UserRegistered.occur(UserIdMother.create())));

    expect(log.error).toHaveBeenCalledWith({ err: expect.any(Error) }, "could not add the demo track");
  });

  it("marks the track as separating when a separation is requested", async () => {
    const startTrackSeparation = vi.fn().mockResolvedValue(undefined);
    const dispatch = subscribe({ startTrackSeparation });
    const job = SeparationJob.request(TrackMother.create(), ModelName.create("htdemucs_6s"));

    await dispatch(job.getEvents());

    expect(startTrackSeparation).toHaveBeenCalledWith(sameJob(job));
  });

  it("stores the stems when the separation completes", async () => {
    const completeTrackSeparation = vi.fn().mockResolvedValue(undefined);
    const dispatch = subscribe({ completeTrackSeparation });
    const result = SeparationResultMother.create();
    const job = SeparationJobMother.processing().complete(result);

    await dispatch(job.getEvents());

    expect(completeTrackSeparation).toHaveBeenCalledWith({
      jobId: job.getId().toPrimitive(),
      trackId: job.getTrackId().toPrimitive(),
      ...result.toPrimitive(),
    });
  });

  it("marks the track as failed when the separation fails", async () => {
    const failTrackSeparation = vi.fn().mockResolvedValue(undefined);
    const dispatch = subscribe({ failTrackSeparation });
    const job = SeparationJobMother.processing().fail(JobFailureMother.create());

    await dispatch(job.getEvents());

    expect(failTrackSeparation).toHaveBeenCalledWith(sameJob(job));
  });
});
