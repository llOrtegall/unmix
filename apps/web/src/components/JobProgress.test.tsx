import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { separation } from "@/modules/separation/application/factory.ts";
import type { Job } from "@/modules/separation/domain/Job.ts";
import type { JobListener } from "@/modules/separation/domain/JobListener.ts";
import { JobNotFoundError } from "@/modules/separation/domain/errors/JobNotFoundError.ts";
import * as JobMother from "@/modules/separation/test/helpers/JobMother.ts";
import { chooseSpanish } from "@/test/chooseSpanish.ts";
import { JobProgress } from "./JobProgress.tsx";

vi.mock("@/modules/separation/application/factory.ts", () => ({ separation: { watchJob: vi.fn(), requestSeparation: vi.fn() } }));

const reporting = (...jobs: Job[]) =>
  vi.mocked(separation.watchJob).mockImplementation(async (_, listener: JobListener) => {
    for (const job of jobs) listener.onUpdate(job);
    return vi.fn<() => void>();
  });

const renderFor = (job: Job, onFinished = vi.fn()) => {
  const { id, trackId } = job.toPrimitive();
  render(<JobProgress jobId={id} trackId={trackId} onFinished={onFinished} />);
  return onFinished;
};

describe("JobProgress", () => {
  beforeEach(() => chooseSpanish());

  it("shows the stage and the progress of the job", async () => {
    const job = JobMother.create({ stage: "separating", progress: 42 });
    reporting(job);

    const onFinished = renderFor(job);

    expect(await screen.findByText("Separando instrumentos…")).toBeVisible();
    expect(screen.getByText("42%")).toBeVisible();
    expect(onFinished).not.toHaveBeenCalled();
  });

  it("shows a queued job as waiting", async () => {
    const job = JobMother.queued();
    reporting(job);

    renderFor(job);

    expect(await screen.findByText("En cola…")).toBeVisible();
  });

  it("tells the page when the job finishes", async () => {
    const job = JobMother.create();
    reporting(job, JobMother.completed({ id: job.toPrimitive().id }));

    const onFinished = renderFor(job);

    await vi.waitFor(() => expect(onFinished).toHaveBeenCalledOnce());
  });

  it("explains a failure that a retry cannot fix, without a retry button", async () => {
    const job = JobMother.failed("separation.duration_exceeded");
    reporting(job);

    renderFor(job);

    expect(await screen.findByText("La canción dura más de 10 minutos.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Intentar de nuevo" })).not.toBeInTheDocument();
  });

  it("retries a failure and follows the new job", async () => {
    const job = JobMother.failed("separation.failed");
    const retried = JobMother.queued({ trackId: job.toPrimitive().trackId });
    reporting(job);
    vi.mocked(separation.requestSeparation).mockResolvedValue(retried);
    renderFor(job);

    await userEvent.click(await screen.findByRole("button", { name: "Intentar de nuevo" }));

    expect(separation.requestSeparation).toHaveBeenCalledWith(job.toPrimitive().trackId);
    expect(separation.watchJob).toHaveBeenLastCalledWith(retried.toPrimitive().id, expect.anything());
  });

  it("shows the dictionary message when the job cannot be followed", async () => {
    const job = JobMother.create();
    vi.mocked(separation.watchJob).mockRejectedValue(new JobNotFoundError(job.toPrimitive().id));

    renderFor(job);

    expect(await screen.findByRole("alert")).toHaveTextContent("No encontramos este proceso.");
  });
});
