import type { FastifyBaseLogger } from "fastify";
import { UserRegistered } from "../modules/identity/domain/UserRegistered.ts";
import type { LibraryModule } from "../modules/library/application/factory.ts";
import type { EventRepository } from "../modules/shared/domain/EventRepository.ts";
import { SeparationCompleted } from "../modules/separation/domain/SeparationCompleted.ts";
import { SeparationFailed } from "../modules/separation/domain/SeparationFailed.ts";
import { SeparationRequested } from "../modules/separation/domain/SeparationRequested.ts";

export const libraryEventConsumer = (eventRepository: EventRepository, library: LibraryModule, log: FastifyBaseLogger): void => {
  // The demo song is a welcome gift: failing to add it is logged and never blocks the sign-in.
  eventRepository.subscribe(UserRegistered, async (event) => {
    await library
      .addDemoTrack(event.toPrimitive().payload.userId)
      .catch((error: unknown) => log.error({ err: error }, "could not add the demo track"));
  });
  eventRepository.subscribe(SeparationRequested, async (event) => {
    await library.startTrackSeparation(event.toPrimitive().payload);
  });
  eventRepository.subscribe(SeparationCompleted, async (event) => {
    await library.completeTrackSeparation(event.toPrimitive().payload);
  });
  eventRepository.subscribe(SeparationFailed, async (event) => {
    await library.failTrackSeparation(event.toPrimitive().payload);
  });
};
