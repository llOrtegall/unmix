import { Dropzone } from "@/presentation/components/dropzone.tsx";
import { TrackList } from "@/presentation/components/track-list.tsx";

export function LibraryPage() {
  return (
    <div className="pt-4 sm:pt-8">
      <Dropzone />
      <TrackList />
    </div>
  );
}
