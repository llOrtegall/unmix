import { httpGet } from "../../shared/infrastructure/http.ts";
import type { PeaksRepository } from "../domain/PeaksRepository.ts";
import type { Stem } from "../domain/Stem.ts";
import type { StemList } from "../domain/StemList.ts";
import { WaveformPeaks } from "../domain/WaveformPeaks.ts";
import { Waveforms } from "../domain/Waveforms.ts";

interface PeaksDocument {
  readonly version: number;
  readonly peaks: readonly number[];
}

export class HttpPeaksRepository implements PeaksRepository {
  async findForStems(stems: StemList): Promise<Waveforms> {
    return Waveforms.create(await Promise.all(stems.map((stem) => this.findForStem(stem))));
  }

  // Waveforms are decoration: a peaks file that is missing or broken must not block playback.
  private async findForStem(stem: Stem) {
    const document = await httpGet<PeaksDocument>(stem.getPeaksUrl().toPrimitive()).catch(() => null);
    const peaks = Array.isArray(document?.peaks) ? WaveformPeaks.fromPrimitive(document.peaks) : WaveformPeaks.empty();
    return [stem.getName(), peaks] as const;
  }
}
