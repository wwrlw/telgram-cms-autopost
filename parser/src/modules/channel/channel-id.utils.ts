import bigInt from 'big-integer';
import { Api } from 'telegram';
import { ChannelConfig } from '../../types/index.js';

const CHANNEL_PREFIX = 1_000_000_000_000;


export function toRawId(id: number): number {
  const abs = Math.abs(id);
  return abs > CHANNEL_PREFIX ? abs - CHANNEL_PREFIX : abs;
}

export function toExpandedId(id: number): number {
  const abs = Math.abs(id);
  return abs < CHANNEL_PREFIX ? CHANNEL_PREFIX + abs : abs;
}


export function peerToStoredId(peer: any): number {
  const raw = Number(peer.channelId || peer.userId || peer.chatId || 0);
  if (peer.channelId) return -(CHANNEL_PREFIX + raw);
  return raw;
}

export function toPeerChannel(id: number): Api.PeerChannel {
  return new Api.PeerChannel({ channelId: bigInt(toRawId(id)) as any });
}

export function toPeerUser(id: number): Api.PeerUser {
  return new Api.PeerUser({ userId: bigInt(Math.abs(id)) as any });
}

export function toPeerChat(id: number): Api.PeerChat {
  return new Api.PeerChat({ chatId: bigInt(Math.abs(id)) as any });
}

export function configToEntityArg(channelConfig: ChannelConfig): Api.PeerChannel | string {
  if (!channelConfig.is_private && channelConfig.username) {
    return channelConfig.username.replace('@', '');
  }
  return toPeerChannel(channelConfig.id);
}
