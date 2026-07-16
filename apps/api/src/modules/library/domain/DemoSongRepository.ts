import type { DemoSong } from "./DemoSong.ts";

export interface DemoSongRepository {
  find(): Promise<DemoSong | null>;
}
