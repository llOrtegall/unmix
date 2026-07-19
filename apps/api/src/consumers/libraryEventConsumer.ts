import type { EventRepository } from "../modules/shared/domain/EventRepository.ts";
import type { LibraryModule } from "../modules/library/application/factory.ts";
import { SeparationCompleted } from "../modules/separation/domain/SeparationCompleted.ts";
import { SeparationFailed } from "../modules/separation/domain/SeparationFailed.ts";
import { SeparationRequested } from "../modules/separation/domain/SeparationRequested.ts";

export const libraryEventConsumer = (eventRepository: EventRepository, library: LibraryModule): void => {
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
