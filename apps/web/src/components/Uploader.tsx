import { useUpload } from "@/hooks/useUpload.ts";
import { useErrorMessage } from "@/i18n/errorMessages.ts";
import { DropTarget } from "./DropTarget.tsx";
import { UploadProgressCard } from "./UploadProgressCard.tsx";

export function Uploader() {
  const { active, error, start, cancel } = useUpload();
  const messageFor = useErrorMessage();

  if (active) return <UploadProgressCard filename={active.filename} progress={active.progress} onCancel={cancel} />;
  return <DropTarget error={error ? messageFor(error) : null} onFile={(file) => void start(file)} />;
}
