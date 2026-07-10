import { FileAudio, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { useLocation } from "wouter";
import type { UploadPhase } from "@/application/use-cases/upload-track.ts";
import { ACCEPTED_TYPES, MAX_UPLOAD_MB } from "@/domain/upload-policy.ts";
import { Button } from "@/presentation/components/ui/button.tsx";
import { Progress } from "@/presentation/components/ui/progress.tsx";
import { errorMessage, useT } from "@/presentation/i18n/use-t.ts";
import { cn } from "@/presentation/lib/utils.ts";
import { useServices } from "@/presentation/services.tsx";

type State = { kind: "idle"; error?: string } | { kind: "busy"; file: File; phase: UploadPhase };

export function Dropzone() {
  const t = useT();
  const { uploadTrack } = useServices();
  const [, navigate] = useLocation();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);

  async function start(file: File) {
    abort.current = new AbortController();
    setState({ kind: "busy", file, phase: { phase: "uploading", fraction: 0 } });
    const result = await uploadTrack.execute(file, (phase) => setState({ kind: "busy", file, phase }), abort.current.signal);
    if (result.ok) navigate(`/tracks/${result.value.trackId}`);
    else setState({ kind: "idle", error: errorMessage(t, result.error.code) });
  }

  if (state.kind === "busy") {
    const uploading = state.phase.phase === "uploading";
    const percent = uploading ? Math.round((state.phase as { fraction: number }).fraction * 100) : 100;
    return (
      <div className="rounded-2xl border bg-card p-6 sm:p-8" aria-live="polite">
        <div className="flex items-center gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <FileAudio className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{uploading ? t("upload.uploading", { name: state.file.name }) : t("upload.requesting")}</p>
            <Progress value={percent} className="mt-3" aria-label={`${percent}%`} />
          </div>
          {uploading && (
            <Button variant="ghost" size="icon" aria-label={t("upload.cancel")} onClick={() => abort.current?.abort()}>
              <X />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) void start(file);
        }}
        className={cn(
          "group flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring sm:py-16",
          dragging ? "scale-[1.01] border-primary bg-primary/10" : "border-border bg-card/50 hover:border-primary/50 hover:bg-card",
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
        <p className="text-xs text-muted-foreground/80">{t("upload.formats", { mb: MAX_UPLOAD_MB })}</p>
      </button>
      <input
        ref={input}
        type="file"
        className="sr-only"
        accept={[...Object.keys(ACCEPTED_TYPES), ".mp3,.wav,.flac,.m4a,.ogg,.mp4,.mov,.webm,.mkv"].join(",")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void start(file);
        }}
      />
      {state.error && (
        <p role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      )}
    </div>
  );
}
