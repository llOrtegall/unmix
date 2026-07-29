import { faker } from "@faker-js/faker";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { tracks } from "@/modules/track/application/factory.ts";
import type { UploadTrackInput } from "@/modules/track/application/uploadTrack.ts";
import { UnsupportedMediaTypeError } from "@/modules/track/domain/errors/UnsupportedMediaTypeError.ts";
import { UploadCancelledError } from "@/modules/track/domain/errors/UploadCancelledError.ts";
import { TrackId } from "@/modules/track/domain/TrackId.ts";
import { UploadProgress } from "@/modules/track/domain/UploadProgress.ts";
import * as FileMother from "@/modules/track/test/helpers/FileMother.ts";
import { chooseSpanish } from "@/test/chooseSpanish.ts";
import { Uploader } from "./Uploader.tsx";

vi.mock("@/modules/track/application/factory.ts", () => ({ tracks: { uploadTrack: vi.fn() } }));

const pick = (file: File) => userEvent.setup({ applyAccept: false }).upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, file);

describe("Uploader", () => {
  beforeEach(() => {
    chooseSpanish();
    window.history.replaceState(null, "", "/");
  });

  it("shows the upload progress and opens the song when it is done", async () => {
    const trackId = faker.string.uuid();
    let finish!: () => void;
    vi.mocked(tracks.uploadTrack).mockImplementation(({ onProgress }: UploadTrackInput) => {
      onProgress(UploadProgress.uploading(0.4));
      return new Promise((resolve) => {
        finish = () => resolve(TrackId.create(trackId));
      });
    });
    render(<Uploader />);

    await pick(FileMother.create("Lovesong.mp3"));

    expect(await screen.findByText("Subiendo Lovesong.mp3…")).toBeVisible();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "40%");
    finish();
    await vi.waitFor(() => expect(window.location.pathname).toBe(`/tracks/${trackId}`));
  });

  it("shows the dictionary message when the file is rejected", async () => {
    vi.mocked(tracks.uploadTrack).mockRejectedValue(new UnsupportedMediaTypeError("text/plain"));
    render(<Uploader />);

    await pick(FileMother.create("notes.txt", "text/plain"));

    expect(await screen.findByRole("alert")).toHaveTextContent("Ese formato no está soportado");
  });

  it("cancels the upload", async () => {
    vi.mocked(tracks.uploadTrack).mockImplementation(
      ({ signal }: UploadTrackInput) => new Promise((_, reject) => signal?.addEventListener("abort", () => reject(new UploadCancelledError()))),
    );
    render(<Uploader />);

    await pick(FileMother.create());
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Subida cancelada.");
  });
});
