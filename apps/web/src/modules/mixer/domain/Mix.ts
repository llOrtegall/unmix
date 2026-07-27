import type { StemName } from "../../track/domain/StemName.ts";
import type { Channel } from "./Channel.ts";
import { ChannelList, type ChannelListPrimitive } from "./ChannelList.ts";
import { Volume } from "./Volume.ts";

export interface MixPrimitive {
  readonly channels: ChannelListPrimitive;
}

export class Mix {
  private readonly channels: ChannelList;

  private constructor(channels: ChannelList) {
    this.channels = channels;
  }

  static create(channels: ChannelList): Mix {
    return new Mix(channels);
  }

  static forStems(names: readonly StemName[]): Mix {
    return Mix.create(ChannelList.forStems(names));
  }

  static fromPrimitive(data: MixPrimitive): Mix {
    return Mix.create(ChannelList.fromPrimitive(data.channels));
  }

  channelFor(name: StemName): Channel {
    return this.channels.get(name);
  }

  setVolume(name: StemName, volume: Volume): Mix {
    return Mix.create(this.channels.replace(this.channels.get(name).withVolume(volume)));
  }

  toggleMute(name: StemName): Mix {
    return Mix.create(this.channels.replace(this.channels.get(name).toggleMute()));
  }

  toggleSolo(name: StemName): Mix {
    return Mix.create(this.channels.replace(this.channels.get(name).toggleSolo()));
  }

  toggleExclusiveSolo(name: StemName): Mix {
    const wasSoloed = this.channels.get(name).isSoloed();
    const others = this.channels.unsoloAll();
    return wasSoloed ? Mix.create(others) : Mix.create(others.replace(others.get(name).toggleSolo()));
  }

  // Solo wins over mute: while any channel is soloed, only soloed channels play.
  isAudible(name: StemName): boolean {
    const channel = this.channels.get(name);
    return this.channels.hasSoloed() ? channel.isSoloed() : !channel.isMuted();
  }

  gainOf(name: StemName): Volume {
    return this.isAudible(name) ? this.channels.get(name).getVolume() : Volume.silent();
  }

  gains(): (readonly [StemName, Volume])[] {
    return this.channels.map((channel) => [channel.getName(), this.gainOf(channel.getName())] as const);
  }

  map<T>(transform: (channel: Channel) => T): T[] {
    return this.channels.map(transform);
  }

  equals(other: Mix): boolean {
    return this.channels.equals(other.channels);
  }

  toPrimitive(): MixPrimitive {
    return { channels: this.channels.toPrimitive() };
  }
}
