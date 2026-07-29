import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { useT } from "@/i18n/useT.ts";
import { cn } from "@/lib/utils.ts";
import { MediaType } from "@/modules/track/domain/MediaType.ts";
import { UploadCandidate } from "@/modules/track/domain/UploadCandidate.ts";

interface Props {
  readonly error: string | null;
  readonly onFile: (file: File) => void;
}

const ACCEPT = MediaType.acceptedFormats().join(",");

export function DropTarget({ error, onFile }: Props) {
  const t = useT();
  const [isDragging, setIsDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) onFile(file);
        }}
        className={cn(
          "group flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring sm:py-16",
          isDragging ? "scale-[1.01] border-primary bg-primary/10" : "border-border bg-card/50 hover:border-primary/50 hover:bg-card",
        )}
      >
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary transition-transform group-hover:-translate-y-0.5">
          <UploadCloud className="size-7" />
        </div>
        <div>
          {/* Touch screens cannot drag files: offer the picker instead. */}
          <p className="text-lg font-semibold pointer-coarse:hidden">{t("upload.title")}</p>
          <p className="mt-1 text-sm text-muted-foreground pointer-coarse:hidden">{t("upload.subtitle")}</p>
          <p className="hidden text-lg font-semibold pointer-coarse:block">{t("upload.titleTouch")}</p>
          <p className="mt-1 hidden text-sm text-muted-foreground pointer-coarse:block">{t("upload.subtitleTouch")}</p>
        </div>
        <p className="text-xs text-muted-foreground/80">{t("upload.formats", { mb: UploadCandidate.MAX_MEGABYTES })}</p>
      </button>
      <input
        ref={input}
        type="file"
        className="sr-only"
        accept={ACCEPT}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
