import { config } from "../../../config.ts";
import { HttpPeaksRepository } from "../infrastructure/HttpPeaksRepository.ts";
import { HttpTrackRepository } from "../infrastructure/HttpTrackRepository.ts";
import { XhrUploadRepository } from "../infrastructure/XhrUploadRepository.ts";
import { deleteTrack } from "./deleteTrack.ts";
import { findTrack } from "./findTrack.ts";
import { listTracks } from "./listTracks.ts";
import { uploadTrack } from "./uploadTrack.ts";

export const trackModule = (baseUrl: string) => {
  const trackRepository = new HttpTrackRepository(baseUrl);
  const peaksRepository = new HttpPeaksRepository();
  const uploadRepository = new XhrUploadRepository();

  return {
    listTracks: listTracks({ trackRepository }),
    findTrack: findTrack({ trackRepository, peaksRepository }),
    deleteTrack: deleteTrack({ trackRepository }),
    uploadTrack: uploadTrack({ trackRepository, uploadRepository }),
  };
};

export type TrackModule = ReturnType<typeof trackModule>;

export const tracks = trackModule(config.apiBaseUrl);
