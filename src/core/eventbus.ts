import { CauseId, KeyframeSplit, ModeId, PowerupId, RunStats } from './types';

export type GameEventMap = {
  'player:jump': { x: number; y: number };
  'player:dash': { x: number; y: number };
  'player:land': { x: number; y: number; velocity: number };
  'player:stomp': { x: number; y: number };
  'player:damaged': { cause: CauseId; x: number; y: number };
  'player:died': { cause: CauseId; x: number; y: number; bucket: number; stats: RunStats };
  'player:retake': { x: number; y: number; charges: number };
  'rewind:started': { durationMs: number; mode: ModeId };
  'rewind:progress': { progress: number; x: number; y: number };
  'rewind:finished': { mode: ModeId };
  'keyframe:crossed': { split: KeyframeSplit };
  'powerup:collected': { id: PowerupId; x: number; y: number };
  'powerup:activated': { id: PowerupId; durationSeconds: number };
  'powerup:expired': { id: PowerupId };
  'pressure:updated': { pressure: number };
  'record:broken': { distanceMeters: number };
  'run:ended': { stats: RunStats };
  'camera:shake': { intensity: number; durationSeconds: number };
  'audio:play': { sound: string; volume?: number };
};

type EventCallback<T = any> = (payload: T) => void;

class TypedEventBus {
  private listeners: { [K in keyof GameEventMap]?: EventCallback<GameEventMap[K]>[] } = {};

  on<K extends keyof GameEventMap>(event: K, cb: EventCallback<GameEventMap[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(cb);
    return () => this.off(event, cb);
  }

  off<K extends keyof GameEventMap>(event: K, cb: EventCallback<GameEventMap[K]>): void {
    const list = this.listeners[event];
    if (!list) return;
    const idx = list.indexOf(cb);
    if (idx !== -1) {
      list.splice(idx, 1);
    }
  }

  emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K]): void {
    const list = this.listeners[event];
    if (!list || list.length === 0) return;
    // Iterate over a copy in case listener unregisters itself
    for (let i = 0; i < list.length; i++) {
      list[i](payload);
    }
  }

  clear(): void {
    this.listeners = {};
  }
}

export const eventBus = new TypedEventBus();
