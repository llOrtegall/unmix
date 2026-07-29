import { TrackLibrary } from "@/components/TrackLibrary.tsx";
import { Uploader } from "@/components/Uploader.tsx";

export function LibraryPage() {
  return (
    <div className="pt-4 sm:pt-8">
      <Uploader />
      <TrackLibrary />
    </div>
  );
}
