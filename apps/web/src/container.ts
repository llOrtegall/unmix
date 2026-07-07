// Composition root (ADR 0015): the only place that picks concrete adapters.
import { UploadTrack } from "./application/use-cases/upload-track.ts";
import { LoadTrack, RetrySeparation, WatchJob } from "./application/use-cases/track-use-cases.ts";
import { BetterAuthSessionGateway } from "./infrastructure/auth/better-auth-session-gateway.ts";
import { HtmlAudioEngine } from "./infrastructure/audio/html-audio-engine.ts";
import { FetchPeaksGateway } from "./infrastructure/http/fetch-peaks-gateway.ts";
import { HttpTrackGateway } from "./infrastructure/http/http-track-gateway.ts";
import { EventSourceJobEvents } from "./infrastructure/sse/event-source-job-events.ts";
import { XhrUploadGateway } from "./infrastructure/upload/xhr-upload-gateway.ts";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api/v1";

const session = new BetterAuthSessionGateway();
const tracks = new HttpTrackGateway(API_BASE, { onUnauthorized: () => session.expire() });
const events = new EventSourceJobEvents(API_BASE);
const peaks = new FetchPeaksGateway();

export const container = {
  session,
  tracks,
  uploadTrack: new UploadTrack({ tracks, uploads: new XhrUploadGateway() }),
  loadTrack: new LoadTrack({ tracks, peaks }),
  watchJob: new WatchJob({ tracks, events }),
  retrySeparation: new RetrySeparation({ tracks }),
  createAudioEngine: () => new HtmlAudioEngine(),
};

export type Container = typeof container;
