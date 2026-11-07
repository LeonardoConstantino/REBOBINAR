/**
 * REBOBINAR - Domain Types & Core Definitions
 */

export type ModeId = 'studio' | 'director' | 'censored';

export const enum Btn {
  Left = 1,
  Right = 2,
  Jump = 4,
  Dash = 8,
  Item = 16,
  Retake = 32,
  Pause = 64
}

export interface InputFrame {
  buttons: number;
  axisX: number; // -1 to 1
}

export type CauseId =
  | 'jump_cut'
  | 'freeze_frame'
  | 'film_scratch'
  | 'rewind_glitch'
  | 'rebel_extra'
  | 'ghost_double'
  | 'fall'
  | 'crush';

export type PowerupId = 'slow_cam' | 'still_frame' | 'golden_tape';

export interface KeyframeSplit {
  distanceMeters: number;
  tick: number;
  timeSeconds: number;
  deltaVsBest?: number; // negative is faster (green), positive is slower (red)
  isNewBest?: boolean;
}

export interface RunStats {
  mode: ModeId;
  seed: number;
  distanceMeters: number;
  ticks: number;
  timeSeconds: number;
  takesCount: number;
  keyframesCrossed: number;
  retakesUsed: number;
  powerupsCollected: number;
  deathCause?: CauseId;
  deathX?: number;
  deathBucket?: number;
}
