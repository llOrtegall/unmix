import { useJob } from "@/hooks/useJob.ts";
import { useErrorMessage } from "@/i18n/errorMessages.ts";
import { JobFailedCard } from "./JobFailedCard.tsx";
import { JobProgressCard } from "./JobProgressCard.tsx";

interface Props {
  readonly jobId: string;
  readonly trackId: string;
  readonly onFinished: () => void;
}

export function JobProgress({ jobId, trackId, onFinished }: Props) {
  const { job, error, retry } = useJob(jobId, trackId, onFinished);
  const messageFor = useErrorMessage();
  const failure = job?.getFailure();

  if (failure) {
    return <JobFailedCard reason={messageFor(failure)} canBeRetried={failure.canBeRetried()} onRetry={() => void retry()} />;
  }
  return <JobProgressCard job={job} error={error ? messageFor(error) : null} />;
}
