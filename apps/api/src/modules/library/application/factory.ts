import type { DrizzleTransactionRepository } from "../../shared/infrastructure/DrizzleTransactionRepository.ts";
import { FileSize } from "../domain/FileSize.ts";
import { ArchiverStemArchiveRepository } from "../infrastructure/ArchiverStemArchiveRepository.ts";
import { DrizzleTrackRepository } from "../infrastructure/DrizzleTrackRepository.ts";
import { S3DemoSongRepository } from "../infrastructure/S3DemoSongRepository.ts";
import { type S3Settings, S3StorageRepository } from "../infrastructure/S3StorageRepository.ts";
import { addDemoTrack } from "./addDemoTrack.ts";
import { checkTrackOwnership } from "./checkTrackOwnership.ts";
import { collectGarbage } from "./collectGarbage.ts";
import { completeTrackSeparation } from "./completeTrackSeparation.ts";
import { deleteTrack } from "./deleteTrack.ts";
import { downloadStems } from "./downloadStems.ts";
import { failTrackSeparation } from "./failTrackSeparation.ts";
import { findSeparableTrack } from "./findSeparableTrack.ts";
import { findTrack } from "./findTrack.ts";
import { listTracks } from "./listTracks.ts";
import { registerUpload } from "./registerUpload.ts";
import { startTrackSeparation } from "./startTrackSeparation.ts";

export const libraryModule = (transactions: DrizzleTransactionRepository, s3: S3Settings, uploadLimitBytes: number) => {
  const trackRepository = new DrizzleTrackRepository(transactions);
  const storageRepository = new S3StorageRepository(s3);
  const demoSongRepository = new S3DemoSongRepository(storageRepository);
  const stemArchiveRepository = new ArchiverStemArchiveRepository(storageRepository);
  const uploadLimit = FileSize.create(uploadLimitBytes);

  return {
    registerUpload: registerUpload({ trackRepository, storageRepository, uploadLimit }),
    listTracks: listTracks({ trackRepository }),
    findTrack: findTrack({ trackRepository, storageRepository }),
    deleteTrack: deleteTrack({ trackRepository, storageRepository, transactionRepository: transactions }),
    downloadStems: downloadStems({ trackRepository, stemArchiveRepository }),
    addDemoTrack: addDemoTrack({ trackRepository, demoSongRepository }),
    collectGarbage: collectGarbage({ trackRepository, storageRepository }),
    findSeparableTrack: findSeparableTrack({ trackRepository, storageRepository }),
    checkTrackOwnership: checkTrackOwnership({ trackRepository }),
    startTrackSeparation: startTrackSeparation({ trackRepository }),
    completeTrackSeparation: completeTrackSeparation({ trackRepository }),
    failTrackSeparation: failTrackSeparation({ trackRepository }),
  };
};

export type LibraryModule = ReturnType<typeof libraryModule>;
