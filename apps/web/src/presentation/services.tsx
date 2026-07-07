import { createContext, type ReactNode, useContext } from "react";
import type { AudioEngine, SessionGateway, TrackGateway } from "@/application/ports/index.ts";
import type { LoadTrack, RetrySeparation, WatchJob } from "@/application/use-cases/track-use-cases.ts";
import type { UploadTrack } from "@/application/use-cases/upload-track.ts";

/** What the UI needs; main.tsx provides the real implementations from container.ts. */
export interface Services {
  session: SessionGateway;
  tracks: Pick<TrackGateway, "listTracks" | "deleteTrack" | "zipUrl">;
  uploadTrack: UploadTrack;
  loadTrack: LoadTrack;
  watchJob: WatchJob;
  retrySeparation: RetrySeparation;
  createAudioEngine: () => AudioEngine;
}

const ServicesContext = createContext<Services | null>(null);

export function ServicesProvider({ services, children }: { services: Services; children: ReactNode }) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error("ServicesProvider missing");
  return services;
}
