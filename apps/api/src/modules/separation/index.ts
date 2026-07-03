// Public API of the separation module. Other modules import only from here.
export {
  SEPARATION_COMPLETED,
  SEPARATION_FAILED,
  SEPARATION_REQUESTED,
  type SeparationCompleted,
  type SeparationFailed,
  type SeparationRequested,
} from "./domain/events.ts";
