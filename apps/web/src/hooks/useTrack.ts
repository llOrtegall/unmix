import { useCallback, useEffect, useState } from "react";
import type { DomainError } from "@/modules/shared/domain/DomainError.ts";
import { tracks } from "@/modules/track/application/factory.ts";
import type { FoundTrack } from "@/modules/track/application/findTrack.ts";

export function useTrack(id: string) {
  const [found, setFound] = useState<FoundTrack | null>(null);
  const [error, setError] = useState<DomainError | null>(null);

  const reload = useCallback(async () => {
    try {
      setFound(await tracks.findTrack(id));
    } catch (failure) {
      setError(failure as DomainError);
    }
  }, [id]);

  useEffect(() => {
    setFound(null);
    setError(null);
    void reload();
  }, [reload]);

  const retry = useCallback(() => {
    setError(null);
    void reload();
  }, [reload]);

  return { found, error, reload, retry };
}
