import type { StemList } from "./StemList.ts";
import type { Waveforms } from "./Waveforms.ts";

export interface PeaksRepository {
  findForStems(stems: StemList): Promise<Waveforms>;
}
