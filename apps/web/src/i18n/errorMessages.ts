import { useCallback } from "react";
import type { DomainError } from "@/modules/shared/domain/DomainError.ts";
import { JobFailure } from "@/modules/separation/domain/JobFailure.ts";
import { UploadCandidate } from "@/modules/track/domain/UploadCandidate.ts";
import { MESSAGES, type MessageKey } from "./messages.ts";
import { useT } from "./useT.ts";

const FALLBACK: MessageKey = "error.request.failed";

const keyFor = (code: string): MessageKey => {
  const key = `error.${code}`;
  return key in MESSAGES.es ? (key as MessageKey) : FALLBACK;
};

/** The only place that turns an error or a job failure into text for the user. */
export function useErrorMessage(): (failure: DomainError | JobFailure) => string {
  const t = useT();
  return useCallback(
    (failure) => t(keyFor(failure instanceof JobFailure ? failure.getCode() : failure.code), { mb: UploadCandidate.MAX_MEGABYTES }),
    [t],
  );
}
