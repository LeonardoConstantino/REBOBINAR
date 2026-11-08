import { hashSeed, mulberry32 } from '../prng';
import { ChunkData, ChunkEnemySpawn, ChunkPowerupSpawn, ChunkTrapSpawn, DifficultyParams } from './types';
import { ChunkValidator } from './chunkValidator';
import { CHUNK_WIDTH_TILES, TILE_SIZE } from '../../content/tuning';
import { TRAP_DEFS } from '../../content/trapsData';

const HEIGHT_TILES = 23;
const GROUND_Y = 18;

export function generateChunk(seed: number, index: number, params: DifficultyParams): ChunkData {
  let attempt = 0;
  const maxAttempts = 5;

  while (attempt < maxAttempts) {
    const chunkSeed = hashSeed(seed ^ (attempt * 7919), index);
    const rng = mulberry32(chunkSeed);

    const chunk = buildRawChunk(seed, index, params, rng, chunkSeed);
    if (ChunkValidator.validate(chunk)) {
      return chunk;
    }
    attempt++;
  }

  // Fallback to safe template if all attempts failed
  return buildSafeChunk(seed, index, params);
}

function buildRawChunk(
  seed: number,
  index: number,
  params: DifficultyParams,
  rng: () => number,
  chunkSeed: number
): ChunkData {
  const tiles = new Uint8Array(CHUNK_WIDTH_TILES * HEIGHT_TILES);
  const traps: ChunkTrapSpawn[] = [];
  const enemies: ChunkEnemySpawn[] = [];
  const powerups: ChunkPowerupSpawn[] = [];

  // Determine if this chunk contains a Keyframe split (100m = 1600u = every 3.125 chunks)
  const chunkStartUnits = index * CHUNK_WIDTH_TILES * TILE_SIZE;
  const chunkEndUnits = (index + 1) * CHUNK_WIDTH_TILES * TILE_SIZE;
  const isKeyframe = Math.floor(chunkStartUnits / 1600) !== Math.floor(chunkEndUnits / 1600);

  // Chunk 0 is the starting set (0-32m): safe baseline, smooth running
  if (index === 0) {
    for (let x = 0; x < CHUNK_WIDTH_TILES; x++) {
      for (let y = GROUND_Y; y < HEIGHT_TILES; y++) {
        tiles[y * CHUNK_WIDTH_TILES + x] = 1;
      }
    }
    return {
      index,
      seed: chunkSeed,
      widthTiles: CHUNK_WIDTH_TILES,
      heightTiles: HEIGHT_TILES,
      tiles,
      traps,
      enemies,
      powerups,
      isKeyframe: false,
      difficultyParams: params,
    };
  }

  // Base ground with possible pits
  let pitChance = Math.min(0.35, 0.10 + params.density * 0.08);
  if (index < 2) pitChance = 0; // early chunks keep continuous ground

  let inPit = false;
  let pitLength = 0;
  const maxPitLength = 3;

  for (let x = 0; x < CHUNK_WIDTH_TILES; x++) {
    if (inPit) {
      pitLength++;
      if (pitLength >= maxPitLength || rng() > 0.4) {
        inPit = false;
        pitLength = 0;
      }
    } else {
      // Must not start a pit at edges of chunk to ensure boundary continuity
      if (x > 3 && x < CHUNK_WIDTH_TILES - 4 && rng() < pitChance) {
        inPit = true;
        pitLength = 1;
      }
    }

    if (!inPit) {
      for (let y = GROUND_Y; y < HEIGHT_TILES; y++) {
        tiles[y * CHUNK_WIDTH_TILES + x] = 1;
      }
    }
  }

  // Platforms (film reels / studio trusses / scaffolding)
  const numPlatforms = Math.floor(1 + rng() * 3);
  const platformSpans: Array<{ startX: number; endX: number }> = [];

  for (let i = 0; i < numPlatforms; i++) {
    const platWidth = 4 + Math.floor(rng() * 4);
    const platX = 2 + Math.floor(rng() * (CHUNK_WIDTH_TILES - platWidth - 4));
    const platY = GROUND_Y - 4 - Math.floor(rng() * 3);

    for (let px = platX; px < platX + platWidth; px++) {
      tiles[platY * CHUNK_WIDTH_TILES + px] = 1;
    }

    platformSpans.push({ startX: platX, endX: platX + platWidth });

    // Occasional powerup on platform (about 25% chance)
    if (rng() < 0.25 && powerups.length === 0) {
      const pRnd = rng();
      const pType = pRnd < 0.4 ? 'slow_cam' : pRnd < 0.75 ? 'still_frame' : 'golden_tape';
      powerups.push({
        type: pType,
        tileX: platX + Math.floor(platWidth / 2),
        tileY: platY - 1,
      });
    }
  }

  // Fair Level Design (Prevents Muro 3 pit trap):
  // Guarantee solid ground for at least 3 tiles after a platform so players aren't launched into pits
  for (const span of platformSpans) {
    const landingEnd = Math.min(CHUNK_WIDTH_TILES - 1, span.endX + 3);
    for (let lx = span.endX; lx <= landingEnd; lx++) {
      for (let y = GROUND_Y; y < HEIGHT_TILES; y++) {
        tiles[y * CHUNK_WIDTH_TILES + lx] = 1;
      }
    }
  }

  // Spawn Traps (Erros de Edição) based on density and adapted trapMix
  const density = params.density * (1 + (params.adaptation.densityShift || 0));
  const trapBudget = Math.floor(1 + rng() * (1 + density * 1.5));

  for (let t = 0; t < trapBudget; t++) {
    let trapX = 5 + Math.floor(rng() * (CHUNK_WIDTH_TILES - 10));

    // Fair Level Design (Prevents Muro 1 trap right at platform exit):
    // If trap rolls into landing zone, shift it forward into open ground
    for (const span of platformSpans) {
      if (trapX >= span.endX && trapX <= span.endX + 3) {
        trapX = Math.min(CHUNK_WIDTH_TILES - 5, span.endX + 4);
      }
    }

    // Determine trap type via weights
    const roll = rng();
    const w = params.trapMix;
    let trapType: 'jump_cut' | 'freeze_frame' | 'film_scratch' | 'rewind_glitch' = 'jump_cut';

    const totalWeight = w.jump_cut + w.freeze_frame + w.film_scratch + w.rewind_glitch;
    const rScaled = roll * totalWeight;

    if (rScaled < w.jump_cut) {
      trapType = 'jump_cut';
    } else if (rScaled < w.jump_cut + w.freeze_frame) {
      trapType = 'freeze_frame';
    } else if (rScaled < w.jump_cut + w.freeze_frame + w.film_scratch) {
      trapType = 'film_scratch';
    } else {
      trapType = 'rewind_glitch';
    }

    // Position traps so their bottom edge rests solidly ON the floor surface (GROUND_Y * TILE_SIZE)
    const floorPixelY = GROUND_Y * TILE_SIZE; // 288
    const def = TRAP_DEFS[trapType];
    const topPixelY = floorPixelY - def.height;
    const tileY = topPixelY / TILE_SIZE;

    // Guarantee that the ground beneath the trap is solid (no traps floating over pits)
    const trapWidthTiles = Math.ceil(def.width / TILE_SIZE);
    for (let tx = trapX; tx <= Math.min(CHUNK_WIDTH_TILES - 1, trapX + trapWidthTiles); tx++) {
      for (let y = GROUND_Y; y < HEIGHT_TILES; y++) {
        tiles[y * CHUNK_WIDTH_TILES + tx] = 1;
      }
    }

    traps.push({
      type: trapType,
      tileX: trapX,
      tileY,
      phaseOffset: rng() * 2.0,
    });
  }

  // Spawn Enemies (Figurantes)
  const enemyChance = Math.min(0.65, 0.2 + density * 0.25);
  if (rng() < enemyChance && index > 1) {
    const isGhost = rng() < (params.mode === 'censored' ? 0.45 : 0.25);
    enemies.push({
      type: isGhost ? 'ghost_double' : 'rebel_extra',
      tileX: 10 + Math.floor(rng() * (CHUNK_WIDTH_TILES - 16)),
      tileY: GROUND_Y - 1,
      patrolTiles: 4 + Math.floor(rng() * 4),
    });
  }

  return {
    index,
    seed: chunkSeed,
    widthTiles: CHUNK_WIDTH_TILES,
    heightTiles: HEIGHT_TILES,
    tiles,
    traps,
    enemies,
    powerups,
    isKeyframe,
    difficultyParams: params,
  };
}

function buildSafeChunk(seed: number, index: number, params: DifficultyParams): ChunkData {
  const tiles = new Uint8Array(CHUNK_WIDTH_TILES * HEIGHT_TILES);
  // Continuous flat ground
  for (let x = 0; x < CHUNK_WIDTH_TILES; x++) {
    for (let y = GROUND_Y; y < HEIGHT_TILES; y++) {
      tiles[y * CHUNK_WIDTH_TILES + x] = 1;
    }
  }

  return {
    index,
    seed,
    widthTiles: CHUNK_WIDTH_TILES,
    heightTiles: HEIGHT_TILES,
    tiles,
    traps: [],
    enemies: [],
    powerups: [],
    isKeyframe: false,
    difficultyParams: params,
  };
}
