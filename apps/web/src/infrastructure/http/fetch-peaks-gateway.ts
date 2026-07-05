import type { PeaksGateway } from "../../application/ports/index.ts";

export class FetchPeaksGateway implements PeaksGateway {
  async load(url: string): Promise<number[]> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`peaks ${res.status}`);
    const body = (await res.json()) as { peaks?: unknown };
    return Array.isArray(body.peaks) ? body.peaks.map(Number) : [];
  }
}
