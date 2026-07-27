import type { StemName } from "../../track/domain/StemName.ts";
import { Channel, type ChannelPrimitive } from "./Channel.ts";
import { DuplicatedChannelError } from "./errors/DuplicatedChannelError.ts";
import { UnknownChannelError } from "./errors/UnknownChannelError.ts";

export type ChannelListPrimitive = readonly ChannelPrimitive[];

export class ChannelList {
  private readonly channels: readonly Channel[];

  private constructor(channels: readonly Channel[]) {
    this.channels = channels;
  }

  static create(channels: readonly Channel[]): ChannelList {
    ChannelList.ensureHasNoDuplicates(channels);
    return new ChannelList([...channels]);
  }

  static forStems(names: readonly StemName[]): ChannelList {
    return ChannelList.create(names.map((name) => Channel.forStem(name)));
  }

  static fromPrimitive(data: ChannelListPrimitive): ChannelList {
    return ChannelList.create(data.map(Channel.fromPrimitive));
  }

  private static ensureHasNoDuplicates(channels: readonly Channel[]): void {
    const names = channels.map((channel) => channel.getName().toPrimitive());
    const duplicated = names.find((name, index) => names.indexOf(name) !== index);
    if (duplicated) throw new DuplicatedChannelError(duplicated);
  }

  get(name: StemName): Channel {
    const channel = this.channels.find((candidate) => candidate.getName().equals(name));
    if (!channel) throw new UnknownChannelError(name.toPrimitive());
    return channel;
  }

  replace(updated: Channel): ChannelList {
    this.get(updated.getName());
    return ChannelList.create(this.channels.map((channel) => (channel.getName().equals(updated.getName()) ? updated : channel)));
  }

  unsoloAll(): ChannelList {
    return ChannelList.create(this.channels.map((channel) => channel.unsolo()));
  }

  hasSoloed(): boolean {
    return this.channels.some((channel) => channel.isSoloed());
  }

  map<T>(transform: (channel: Channel) => T): T[] {
    return this.channels.map(transform);
  }

  equals(other: ChannelList): boolean {
    return this.channels.length === other.channels.length && this.channels.every((channel, index) => other.channels[index]?.equals(channel));
  }

  toPrimitive(): ChannelListPrimitive {
    return this.channels.map((channel) => channel.toPrimitive());
  }
}
