import { PlayableStem } from "../domain/PlayableStem.ts";
import type { Stem } from "../domain/Stem.ts";
import type { StorageRepository } from "../domain/StorageRepository.ts";
import type { TrackTitle } from "../domain/TrackTitle.ts";
import { UrlLifetime } from "../domain/UrlLifetime.ts";

export const signStem =
  ({ storageRepository }: { storageRepository: StorageRepository }) =>
  async (stem: Stem, title: TrackTitle): Promise<PlayableStem> => {
    const lifetime = UrlLifetime.forDownload();
    const midiKey = stem.getMidiKey();
    const [downloadUrl, previewUrl, peaksUrl, midiUrl] = await Promise.all([
      storageRepository.signDownload(stem.getKey(), lifetime, stem.downloadFilename(title)),
      storageRepository.signDownload(stem.getPreviewKey(), lifetime),
      storageRepository.signDownload(stem.getPeaksKey(), lifetime),
      midiKey ? storageRepository.signDownload(midiKey, lifetime, stem.midiFilename(title)) : null,
    ]);
    return PlayableStem.create({ stem, downloadUrl, previewUrl, peaksUrl, midiUrl });
  };
