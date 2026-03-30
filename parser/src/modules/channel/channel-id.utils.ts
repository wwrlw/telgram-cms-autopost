/**
 * Единый модуль для работы с ID каналов Telegram.
 *
 * Форматы ID:
 *  - stored  : число в БД/-100 префикс, например -1002416194304
 *  - expanded: положительный полный ID,  например  1002416194304  (для getEntity с числом)
 *  - raw     : чистый ID канала без префикса, например  2416194304  (для PeerChannel.channelId)
 */

import bigInt from 'big-integer';
import { Api } from 'telegram';
import { ChannelConfig } from '../../types/index.js';

const CHANNEL_PREFIX = 1_000_000_000_000;

/** stored/any → raw ID для PeerChannel (убирает -100 префикс)
 *  -1002416194304 → 2416194304
 *   2416194304    → 2416194304 */
export function toRawId(id: number): number {
  const abs = Math.abs(id);
  return abs > CHANNEL_PREFIX ? abs - CHANNEL_PREFIX : abs;
}

/** any → expanded ID для getEntity(число)
 *  -1002416194304 → 1002416194304
 *   2416194304    → 1002416194304 */
export function toExpandedId(id: number): number {
  const abs = Math.abs(id);
  return abs < CHANNEL_PREFIX ? CHANNEL_PREFIX + abs : abs;
}

/** peer объект gramjs → stored ID с -100 префиксом для хранения в БД
 *  { channelId: 2416194304 } → -1002416194304 */
export function peerToStoredId(peer: any): number {
  const raw = Number(peer.channelId || peer.userId || peer.chatId || 0);
  if (peer.channelId) return -(CHANNEL_PREFIX + raw);
  return raw;
}

/** Строит PeerChannel с bigInt (из библиотеки big-integer, не нативный BigInt).
 *  Нативный BigInt вызывает "Do not know how to serialize a BigInt" внутри gramjs. */
export function toPeerChannel(id: number): Api.PeerChannel {
  return new Api.PeerChannel({ channelId: bigInt(toRawId(id)) as any });
}

export function toPeerUser(id: number): Api.PeerUser {
  return new Api.PeerUser({ userId: bigInt(Math.abs(id)) as any });
}

export function toPeerChat(id: number): Api.PeerChat {
  return new Api.PeerChat({ chatId: bigInt(Math.abs(id)) as any });
}

/** ChannelConfig → аргумент для client.getEntity()
 *  Приватный или без username → PeerChannel
 *  Публичный с username → строка username */
export function configToEntityArg(channelConfig: ChannelConfig): Api.PeerChannel | string {
  if (!channelConfig.is_private && channelConfig.username) {
    return channelConfig.username.replace('@', '');
  }
  return toPeerChannel(channelConfig.id);
}
