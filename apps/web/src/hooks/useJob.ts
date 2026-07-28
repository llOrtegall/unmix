import { useCallback, useEffect, useState } from "react";
import { separation } from "@/modules/separation/application/factory.ts";
import type { Job } from "@/modules/separation/domain/Job.ts";
import type { DomainError } from "@/modules/shared/domain/DomainError.ts";
import type { Unsubscribe } from "@/modules/shared/domain/Unsubscribe.ts";

export function useJob(jobId: string, trackId: string, onFinished: () => void) {
  const [job, setJob] = useState<Job | null>(null);
  const [current, setCurrent] = useState(jobId);
  const [error, setError] = useState<DomainError | null>(null);

  useEffect(() => {
    let isActive = true;
    let stop: Unsubscribe | null = null;
    setError(null);
    separation
      .watchJob(current, {
        onUpdate: (update) => {
          if (!isActive) return;
          setJob(update);
          if (update.isFinished()) onFinished();
        },
        onError: (failure) => isActive && setError(failure),
      })
      .then((unsubscribe) => (isActive ? (stop = unsubscribe) : unsubscribe()))
      .catch((failure: DomainError) => isActive && setError(failure));
    return () => {
      isActive = false;
      stop?.();
    };
  }, [current, onFinished]);

  const retry = useCallback(async () => {
    try {
      const requested = await separation.requestSeparation(trackId);
      setJob(requested);
      setCurrent(requested.getId().toPrimitive());
    } catch (failure) {
      setError(failure as DomainError);
    }
  }, [trackId]);

  return { job, error, retry };
}
