import { CauseId, ModeId, PowerupId } from '../../core/types';

export interface TrapWeights {
  jump_cut: number;
  freeze_frame: number;
  film_scratch: number;
  rewind_glitch: number;
}

export interface AdaptationBias {
  mostFrequentCause?: CauseId;
  weightShift: Partial<TrapWeights>;
  densityShift: number; // clamped to [-0.10, +0.10]
}

export interface DifficultyParams {
  density: number;
  trapMix: TrapWeights;
  speedScale: number;
  mode: ModeId;
  adaptation: AdaptationBias;
}

export interface ChunkTrapSpawn {
  type: CauseId;
  tileX: number;
  tileY: number;
  phaseOffset: number;
}

export interface ChunkEnemySpawn {
  type: 'rebel_extra' | 'ghost_double';
  tileX: number;
  tileY: number;
  patrolTiles: number;
}

export interface ChunkPowerupSpawn {
  type: PowerupId;
  tileX: number;
  tileY: number;
}

export interface ChunkData {
  index: number;
  seed: number;
  widthTiles: number;
  heightTiles: number;
  tiles: Uint8Array; // 32 * 23 tiles
  traps: ChunkTrapSpawn[];
  enemies: ChunkEnemySpawn[];
  powerups: ChunkPowerupSpawn[];
  isKeyframe: boolean;
  difficultyParams: DifficultyParams;
}
