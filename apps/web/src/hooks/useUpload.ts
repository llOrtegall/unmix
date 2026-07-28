import { useCallback, useRef, useState } from "react";
import { useLocation } from "wouter";
import type { DomainError } from "@/modules/shared/domain/DomainError.ts";
import { tracks } from "@/modules/track/application/factory.ts";
import { UploadProgress } from "@/modules/track/domain/UploadProgress.ts";

export interface ActiveUpload {
  readonly filename: string;
  readonly progress: UploadProgress;
}

export function useUpload() {
  const [, navigate] = useLocation();
  const [active, setActive] = useState<ActiveUpload | null>(null);
  const [error, setError] = useState<DomainError | null>(null);
  const abort = useRef<AbortController | null>(null);

  const start = useCallback(
    async (file: File) => {
      abort.current = new AbortController();
      setError(null);
      setActive({ filename: file.name, progress: UploadProgress.uploading(0) });
      try {
        const trackId = await tracks.uploadTrack({
          file,
          onProgress: (progress) => setActive({ filename: file.name, progress }),
          signal: abort.current.signal,
        });
        navigate(`/tracks/${trackId.toPrimitive()}`);
      } catch (failure) {
        setActive(null);
        setError(failure as DomainError);
      }
    },
    [navigate],
  );

  const cancel = useCallback(() => abort.current?.abort(), []);

  return { active, error, start, cancel };
}
