import { useTracks } from "@/hooks/useTracks.ts";
import { useErrorMessage } from "@/i18n/errorMessages.ts";
import { TrackList } from "./TrackList.tsx";

export function TrackLibrary() {
  const { trackList, hasMore, loadError, notice, refresh, loadMore, remove } = useTracks();
  const messageFor = useErrorMessage();
  return (
    <TrackList
      trackList={trackList}
      loadError={loadError ? messageFor(loadError) : null}
      notice={notice ? messageFor(notice) : null}
      hasMore={hasMore}
      onRetry={() => void refresh()}
      onLoadMore={() => void loadMore()}
      onDelete={(track) => void remove(track)}
    />
  );
}
