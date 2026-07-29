import { FileAudio, X } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { useT } from "@/i18n/useT.ts";
import type { UploadProgress } from "@/modules/track/domain/UploadProgress.ts";

interface Props {
  readonly filename: string;
  readonly progress: UploadProgress;
  readonly onCancel: () => void;
}

export function UploadProgressCard({ filename, progress, onCancel }: Props) {
  const t = useT();
  const percent = progress.percent();
  const isUploading = !progress.isRequesting();
  return (
    <div className="rounded-2xl border bg-card p-6 sm:p-8" aria-live="polite">
      <div className="flex items-center gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <FileAudio className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{isUploading ? t("upload.uploading", { name: filename }) : t("upload.requesting")}</p>
          <Progress value={percent} className="mt-3" aria-label={`${percent}%`} />
        </div>
        {isUploading && (
          <Button variant="ghost" size="icon" aria-label={t("upload.cancel")} onClick={onCancel}>
            <X />
          </Button>
        )}
      </div>
    </div>
  );
}
