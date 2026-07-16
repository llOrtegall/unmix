import { faker } from "@faker-js/faker";
import { describe, expect, it, vi } from "vitest";
import * as TransactionRepositoryMother from "../../../shared/test/helpers/TransactionRepositoryMother.ts";
import { deleteTrack } from "../../application/deleteTrack.ts";
import { TrackBusyError } from "../../domain/errors/TrackBusyError.ts";
import { TrackNotFoundError } from "../../domain/errors/TrackNotFoundError.ts";
import type { Track } from "../../domain/Track.ts";
import * as StorageRepositoryMother from "../helpers/StorageRepositoryMother.ts";
import * as TrackMother from "../helpers/TrackMother.ts";
import * as TrackRepositoryMother from "../helpers/TrackRepositoryMother.ts";

const setup = (track: Track | null) => {
  const trackRepository = TrackRepositoryMother.create({ findById: vi.fn().mockResolvedValue(track) });
  const storageRepository = StorageRepositoryMother.create();
  const transactionRepository = TransactionRepositoryMother.create();
  const remove = deleteTrack({ trackRepository, storageRepository, transactionRepository });
  return { trackRepository, storageRepository, transactionRepository, remove };
};

describe("deleteTrack", () => {
  it("deletes the row inside a transaction and then its folder", async () => {
    const track = TrackMother.completed();
    const { trackRepository, storageRepository, transactionRepository, remove } = setup(track);
    const { id, ownerId } = track.toPrimitive();

    await remove(id, ownerId);

    expect(transactionRepository.run).toHaveBeenCalledOnce();
    expect(trackRepository.delete.mock.calls[0]![0].toPrimitive()).toBe(id);
    expect(storageRepository.deleteFolder.mock.calls[0]![0].toPrimitive()).toBe(`tracks/${id}/`);
    expect(trackRepository.delete.mock.invocationCallOrder[0]).toBeLessThan(
      storageRepository.deleteFolder.mock.invocationCallOrder[0]!,
    );
  });

  it("keeps the files when the row cannot be deleted", async () => {
    const track = TrackMother.separating();
    const { trackRepository, storageRepository, remove } = setup(track);
    const { id, ownerId } = track.toPrimitive();

    await expect(remove(id, ownerId)).rejects.toThrow(TrackBusyError);
    expect(trackRepository.delete).not.toHaveBeenCalled();
    expect(storageRepository.deleteFolder).not.toHaveBeenCalled();
  });

  it("does not delete someone else's track", async () => {
    const track = TrackMother.completed();
    const { trackRepository, remove } = setup(track);

    await expect(remove(track.toPrimitive().id, faker.string.uuid())).rejects.toThrow(TrackNotFoundError);
    expect(trackRepository.delete).not.toHaveBeenCalled();
  });
});
