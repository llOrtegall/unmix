import { useCallback, useEffect, useState } from "react";
import type { DomainError } from "@/modules/shared/domain/DomainError.ts";
import { tracks } from "@/modules/track/application/factory.ts";
import type { PageCursor } from "@/modules/track/domain/PageCursor.ts";
import type { TrackList } from "@/modules/track/domain/TrackList.ts";
import type { TrackSummary } from "@/modules/track/domain/TrackSummary.ts";

// Keep separating songs fresh without a socket per row.
const REFRESH_WHILE_SEPARATING_MS = 5000;

export function useTracks() {
  const [trackList, setTrackList] = useState<TrackList | null>(null);
  const [nextCursor, setNextCursor] = useState<PageCursor | null>(null);
  const [loadError, setLoadError] = useState<DomainError | null>(null);
  const [notice, setNotice] = useState<DomainError | null>(null);

  const refresh = useCallback(async () => {
    try {
      const page = await tracks.listTracks();
      setTrackList(page.getTracks());
      setNextCursor(page.getNextCursor());
      setLoadError(null);
    } catch (failure) {
      setLoadError(failure as DomainError);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isSeparating = trackList?.hasSeparating() ?? false;
  useEffect(() => {
    if (!isSeparating) return;
    const timer = window.setInterval(() => void refresh(), REFRESH_WHILE_SEPARATING_MS);
    return () => window.clearInterval(timer);
  }, [isSeparating, refresh]);

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    try {
      const page = await tracks.listTracks(nextCursor.toPrimitive());
      setTrackList((current) => (current ? current.append(page.getTracks()) : page.getTracks()));
      setNextCursor(page.getNextCursor());
    } catch (failure) {
      setNotice(failure as DomainError);
    }
  }, [nextCursor]);

  const remove = useCallback(async (track: TrackSummary) => {
    try {
      await tracks.deleteTrack(track.getId().toPrimitive());
      setTrackList((current) => current?.remove(track.getId()) ?? null);
    } catch (failure) {
      setNotice(failure as DomainError);
    }
  }, []);

  return { trackList, hasMore: nextCursor !== null, loadError, notice, refresh, loadMore, remove };
}
