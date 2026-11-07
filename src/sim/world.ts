import { ChunkData, DifficultyParams } from './gen/types';
import { generateChunk } from './gen/chunkGenerator';
import { Player } from './player';
import { TrapManager } from './traps';
import { EnemyManager } from './enemies';
import { FinalCutSystem } from './finalCut';
import { TrailRecorder } from './time/trailRecorder';
import { SnapshotRing } from './time/snapshotRing';
import {
  CHUNK_WIDTH_TILES,
  CHUNK_WIDTH_UNITS,
  DEATH_MARK_BUCKET_UNITS,
  KEYFRAME_INTERVAL_UNITS,
  TILE_SIZE,
  TIME_CONFIG,
  UNITS_PER_METER,
} from '../content/tuning';
import { MODES } from '../content/modes';
import { Btn, CauseId, InputFrame, KeyframeSplit, ModeId, PowerupId, RunStats } from '../core/types';
import { eventBus } from '../core/eventbus';

export class World {
  mode: ModeId = 'studio';
  seed: number = 192837;
  ticks: number = 0;
  distanceUnits: number = 0;
  maxDistanceUnits: number = 0;
  takesCount: number = 1;

  player: Player = new Player();
  traps: TrapManager = new TrapManager();
  enemies: EnemyManager = new EnemyManager();
  finalCut: FinalCutSystem = new FinalCutSystem();

  trail: TrailRecorder = new TrailRecorder();
  snapshots: SnapshotRing = new SnapshotRing();

  // Active chunks window: index -> ChunkData
  chunks: Map<number, ChunkData> = new Map();

  // Retake resources
  retakeCharges: number = 1;
  retakeCooldown: number = 0;
  keyframesPassed: number = 0;
  lastCrossedKeyframe: number = 0;

  // Active powerup pickups in world
  powerupPickups: { type: PowerupId; x: number; y: number; chunkIndex: number; collected: boolean }[] = [];

  // Death / Rewind state
  isDead: boolean = false;
  isRewinding: boolean = false;
  rewindProgress: number = 0;
  rewindDurationSeconds: number = 0.9;
  rewindTimer: number = 0;
  rewindSampleIndex: number = 0;

  // Difficulty adaptation
  difficultyParams: DifficultyParams;

  constructor(mode: ModeId = 'studio', seed = 123456) {
    this.mode = mode;
    this.seed = seed;
    this.difficultyParams = this.computeDifficulty(0);
    this.reset();
  }

  setMode(mode: ModeId, newSeed?: number): void {
    this.mode = mode;
    if (newSeed !== undefined) this.seed = newSeed;
    this.difficultyParams = this.computeDifficulty(0);
    this.reset();
  }

  private computeDifficulty(distanceMeters: number): DifficultyParams {
    const modeCfg = MODES[this.mode];
    const growth = (distanceMeters / 100) * modeCfg.growthPer100m;
    const baseDensity = modeCfg.initialDensity * (1 + growth);

    return {
      density: baseDensity,
      trapMix: {
        jump_cut: 1.0,
        freeze_frame: 0.8,
        film_scratch: 0.7,
        rewind_glitch: 0.6,
      },
      speedScale: 1.0,
      mode: this.mode,
      adaptation: {
        densityShift: 0,
        weightShift: {},
      },
    };
  }

  reset(): void {
    this.ticks = 0;
    this.distanceUnits = 0;
    this.isDead = false;
    this.isRewinding = false;
    this.rewindProgress = 0;
    this.rewindTimer = 0;
    this.rewindSampleIndex = 0;
    this.lastCrossedKeyframe = 0;
    this.keyframesPassed = 0;

    const modeCfg = MODES[this.mode];
    this.retakeCharges = modeCfg.hasRetake ? TIME_CONFIG.retakeInitialCharges : 0;
    this.retakeCooldown = 0;

    this.player.reset(64, 250);
    this.traps.clear();
    this.enemies.clear();
    this.finalCut.reset();
    this.trail.reset();
    this.snapshots.reset();
    this.chunks.clear();
    this.powerupPickups = [];

    // Pre-generate initial chunks (0 to 3)
    this.ensureChunksAround(0);
  }

  private ensureChunksAround(currentChunkIdx: number): void {
    const minChunk = Math.max(0, currentChunkIdx - 1);
    const maxChunk = currentChunkIdx + 2;

    for (let c = minChunk; c <= maxChunk; c++) {
      if (!this.chunks.has(c)) {
        const chunk = generateChunk(this.seed, c, this.difficultyParams);
        this.chunks.set(c, chunk);
        this.spawnChunkEntities(chunk);
      }
    }

    // Prune chunks too far behind
    for (const [idx] of this.chunks) {
      if (idx < currentChunkIdx - 2) {
        this.chunks.delete(idx);
      }
    }
  }

  private spawnChunkEntities(chunk: ChunkData): void {
    const chunkOriginX = chunk.index * CHUNK_WIDTH_UNITS;

    for (const t of chunk.traps) {
      this.traps.addTrap(
        t.type,
        chunkOriginX + t.tileX * TILE_SIZE,
        t.tileY * TILE_SIZE,
        t.phaseOffset
      );
    }

    for (const e of chunk.enemies) {
      this.enemies.addEnemy(
        e.type,
        chunkOriginX + e.tileX * TILE_SIZE,
        e.tileY * TILE_SIZE,
        e.patrolTiles
      );
    }

    for (const p of chunk.powerups) {
      this.powerupPickups.push({
        type: p.type,
        x: chunkOriginX + p.tileX * TILE_SIZE + 4,
        y: p.tileY * TILE_SIZE,
        chunkIndex: chunk.index,
        collected: false,
      });
    }
  }

  tick(input: InputFrame): void {
    if (this.isRewinding) {
      this.updateRewindScrub(TIME_CONFIG.fixedDt);
      return;
    }

    if (this.isDead) return;

    this.ticks++;
    const dt = TIME_CONFIG.fixedDt;
    const modeCfg = MODES[this.mode];

    // Check Stored Item / Retake activation inputs
    if ((input.buttons & Btn.Item) !== 0 && this.player.storedPowerup) {
      this.activateStoredPowerup();
    }

    if ((input.buttons & Btn.Retake) !== 0 && modeCfg.hasRetake && this.retakeCharges > 0 && this.retakeCooldown <= 0) {
      // Retake disabled during Golden Tape (GDD Section 6.2)
      if (this.player.activePowerup !== 'golden_tape') {
        this.triggerRetake();
      }
    }

    if (this.retakeCooldown > 0) {
      this.retakeCooldown -= dt;
    }

    // Slow Cam effect applies 60% speed factor
    const simTimeScale = this.player.activePowerup === 'slow_cam' ? 0.6 : 1.0;
    const scaledDt = dt * simTimeScale;

    // Player simulation
    this.player.update(
      scaledDt,
      input,
      modeCfg.coyoteSeconds,
      modeCfg.bufferSeconds,
      () => eventBus.emit('player:jump', { x: this.player.x, y: this.player.y }),
      () => eventBus.emit('player:dash', { x: this.player.x, y: this.player.y })
    );

    // Resolve Player Collision with Tile Grid
    this.resolveTileCollisions(scaledDt);

    // Track Distance
    this.distanceUnits = Math.max(this.distanceUnits, this.player.x);
    if (this.distanceUnits > this.maxDistanceUnits) {
      if (Math.floor(this.distanceUnits / UNITS_PER_METER) > Math.floor(this.maxDistanceUnits / UNITS_PER_METER)) {
        eventBus.emit('record:broken', { distanceMeters: Math.floor(this.distanceUnits / UNITS_PER_METER) });
      }
      this.maxDistanceUnits = this.distanceUnits;
    }

    // Update enemies & traps
    this.enemies.recordPlayerPosition(this.player.x, this.player.y);
    this.enemies.update(scaledDt);
    this.traps.update(scaledDt, Math.abs(this.player.vx), this.player.dashing);

    // Update Final Cut pressure
    const currentPressure = this.finalCut.update(scaledDt, this.player.x);
    eventBus.emit('pressure:updated', { pressure: currentPressure });

    // Check Powerup Pickups
    this.checkPowerupPickups();

    // Check Keyframes
    this.checkKeyframeCrossings();

    // Check Collisions with Hazards / Enemies / Pits
    this.checkHazards();

    // Ensure chunks around player
    const playerChunkIdx = Math.floor(this.player.x / CHUNK_WIDTH_UNITS);
    this.ensureChunksAround(playerChunkIdx);

    // Snapshot Ring recording at 10Hz
    if (this.ticks % TIME_CONFIG.snapshotIntervalTicks === 0) {
      this.snapshots.push({
        tick: this.ticks,
        playerX: this.player.x,
        playerY: this.player.y,
        playerVx: this.player.vx,
        playerVy: this.player.vy,
        grounded: this.player.grounded,
        facingRight: this.player.facingRight,
        dashing: this.player.dashing,
        dashTimer: this.player.dashTimer,
        dashCooldown: this.player.dashCooldownTimer,
        invulnTimer: this.player.invulnTimer,
        storedPowerup: this.player.storedPowerup,
        activePowerup: this.player.activePowerup,
        activePowerupTimer: this.player.activePowerupTimer,
        distanceUnits: this.distanceUnits,
        pressure: currentPressure,
      });
    }

    // Trail Recorder recording at 15Hz
    if (this.ticks % TIME_CONFIG.trailSampleEveryTicks === 0) {
      this.trail.record(this.ticks, this.player.x, this.player.y, this.player.animFrame);
    }
  }

  private resolveTileCollisions(dt: number): void {
    const p = this.player;

    // Move X
    p.x += p.vx * dt;
    this.checkHorizontalCollisions(p);

    // Move Y
    p.y += p.vy * dt;
    p.grounded = false;
    this.checkVerticalCollisions(p);

    // Pit fall check
    if (p.y > 370) {
      this.killPlayer('fall');
    }
  }

  private checkHorizontalCollisions(p: Player): void {
    const leftTile = Math.floor(p.x / TILE_SIZE);
    const rightTile = Math.floor((p.x + p.width) / TILE_SIZE);
    const topTile = Math.floor(p.y / TILE_SIZE);
    const botTile = Math.floor((p.y + p.height - 1) / TILE_SIZE);

    if (p.vx > 0) {
      for (let y = topTile; y <= botTile; y++) {
        if (this.isTileSolid(rightTile, y)) {
          p.x = rightTile * TILE_SIZE - p.width - 0.01;
          p.vx = 0;
          break;
        }
      }
    } else if (p.vx < 0) {
      for (let y = topTile; y <= botTile; y++) {
        if (this.isTileSolid(leftTile, y)) {
          p.x = (leftTile + 1) * TILE_SIZE + 0.01;
          p.vx = 0;
          break;
        }
      }
    }
  }

  private checkVerticalCollisions(p: Player): void {
    const leftTile = Math.floor((p.x + 2) / TILE_SIZE);
    const rightTile = Math.floor((p.x + p.width - 2) / TILE_SIZE);
    const topTile = Math.floor(p.y / TILE_SIZE);
    const botTile = Math.floor((p.y + p.height) / TILE_SIZE);

    if (p.vy > 0) {
      // Falling
      for (let x = leftTile; x <= rightTile; x++) {
        if (this.isTileSolid(x, botTile)) {
          p.y = botTile * TILE_SIZE - p.height;
          if (p.vy > 250) {
            p.triggerLandSquash(p.vy);
            eventBus.emit('player:land', { x: p.x, y: p.y, velocity: p.vy });
          }
          p.vy = 0;
          p.grounded = true;
          break;
        }
      }
    } else if (p.vy < 0) {
      // Jumping up
      for (let x = leftTile; x <= rightTile; x++) {
        if (this.isTileSolid(x, topTile)) {
          p.y = (topTile + 1) * TILE_SIZE;
          p.vy = 0;
          break;
        }
      }
    }
  }

  private isTileSolid(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || ty >= 23) return false;
    const chunkIdx = Math.floor(tx / CHUNK_WIDTH_TILES);
    const chunk = this.chunks.get(chunkIdx);
    if (!chunk) return false;

    const localTx = tx % CHUNK_WIDTH_TILES;
    const tileVal = chunk.tiles[ty * CHUNK_WIDTH_TILES + localTx];
    return tileVal === 1;
  }

  private checkPowerupPickups(): void {
    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.width;
    const ph = this.player.height;

    for (const p of this.powerupPickups) {
      if (p.collected) continue;
      if (px < p.x + 16 && px + pw > p.x && py < p.y + 16 && py + ph > p.y) {
        p.collected = true;
        this.player.storedPowerup = p.type;
        eventBus.emit('powerup:collected', { id: p.type, x: p.x, y: p.y });
      }
    }
  }

  private activateStoredPowerup(): void {
    const id = this.player.storedPowerup;
    if (!id) return;

    this.player.storedPowerup = null;
    this.player.activePowerup = id;

    if (id === 'slow_cam') {
      this.player.activePowerupTimer = 3.0;
    } else if (id === 'still_frame') {
      this.player.activePowerupTimer = 4.0;
      this.traps.freezeAll(4.0);
      this.enemies.freezeAll(4.0);
    } else if (id === 'golden_tape') {
      this.player.activePowerupTimer = 12.0;
    }

    eventBus.emit('powerup:activated', { id, durationSeconds: this.player.activePowerupTimer });
  }

  private checkKeyframeCrossings(): void {
    const currentKeyframeIdx = Math.floor(this.player.x / KEYFRAME_INTERVAL_UNITS);
    if (currentKeyframeIdx > this.lastCrossedKeyframe) {
      this.lastCrossedKeyframe = currentKeyframeIdx;
      this.keyframesPassed++;

      const distanceMeters = currentKeyframeIdx * 100;
      const timeSeconds = this.ticks / 60;

      const split: KeyframeSplit = {
        distanceMeters,
        tick: this.ticks,
        timeSeconds,
      };

      // Award Retake charge every 3 keyframes
      if (this.keyframesPassed % TIME_CONFIG.retakeKeyframesPerCharge === 0) {
        if (this.retakeCharges < TIME_CONFIG.retakeMaxCharges) {
          this.retakeCharges++;
        }
      }

      // Relieve pressure
      this.finalCut.relieveOnKeyframe();

      eventBus.emit('keyframe:crossed', { split });
    }
  }

  private checkHazards(): void {
    if (this.player.invulnTimer > 0) return;

    // Check Traps
    const trapCause = this.traps.checkCollision(
      this.player.x,
      this.player.y,
      this.player.width,
      this.player.height,
      false
    );
    if (trapCause) {
      this.killPlayer(trapCause);
      return;
    }

    // Check Enemies
    const enemyCause = this.enemies.checkCollision(
      this.player.x,
      this.player.y,
      this.player.width,
      this.player.height,
      false
    );
    if (enemyCause) {
      this.killPlayer(enemyCause);
    }
  }

  killPlayer(cause: CauseId): void {
    if (this.isDead || this.isRewinding) return;

    this.isDead = true;
    const bucket = Math.floor(this.player.x / DEATH_MARK_BUCKET_UNITS);
    const stats: RunStats = {
      mode: this.mode,
      seed: this.seed,
      distanceMeters: Math.floor(this.player.x / UNITS_PER_METER),
      ticks: this.ticks,
      timeSeconds: this.ticks / 60,
      takesCount: this.takesCount,
      keyframesCrossed: this.keyframesPassed,
      retakesUsed: 0,
      powerupsCollected: 0,
      deathCause: cause,
      deathX: this.player.x,
      deathBucket: bucket,
    };

    eventBus.emit('player:damaged', { cause, x: this.player.x, y: this.player.y });
    eventBus.emit('camera:shake', { intensity: 10, durationSeconds: 0.35 });
    eventBus.emit('player:died', { cause, x: this.player.x, y: this.player.y, bucket, stats });

    this.startRewindScrub();
  }

  triggerRetake(): void {
    const targetTick = Math.max(0, this.ticks - Math.round(TIME_CONFIG.retakeRewindSeconds * 60));
    const snapshot = this.snapshots.findClosest(targetTick);
    if (!snapshot) return;

    this.retakeCharges--;
    this.retakeCooldown = TIME_CONFIG.retakeCooldownSeconds;

    // Restore state
    this.ticks = snapshot.tick;
    this.player.x = snapshot.playerX;
    this.player.y = snapshot.playerY;
    this.player.vx = snapshot.playerVx;
    this.player.vy = snapshot.playerVy;
    this.player.grounded = snapshot.grounded;
    this.player.facingRight = snapshot.facingRight;
    this.player.dashing = snapshot.dashing;
    this.player.dashTimer = snapshot.dashTimer;
    this.player.dashCooldownTimer = snapshot.dashCooldown;
    this.player.invulnTimer = TIME_CONFIG.retakeInvulnSeconds;
    this.player.storedPowerup = snapshot.storedPowerup;
    this.player.activePowerup = snapshot.activePowerup;
    this.player.activePowerupTimer = snapshot.activePowerupTimer;
    this.distanceUnits = snapshot.distanceUnits;
    this.finalCut.setPressure(snapshot.pressure);

    eventBus.emit('player:retake', {
      x: this.player.x,
      y: this.player.y,
      charges: this.retakeCharges,
    });
    eventBus.emit('camera:shake', { intensity: 4, durationSeconds: 0.2 });
  }

  private startRewindScrub(): void {
    const modeCfg = MODES[this.mode];
    this.isRewinding = true;
    this.rewindTimer = 0;
    this.rewindProgress = 0;
    this.rewindDurationSeconds = modeCfg.rewindDurationMs / 1000;
    this.rewindSampleIndex = Math.max(0, this.trail.count - 1);

    eventBus.emit('rewind:started', {
      durationMs: modeCfg.rewindDurationMs,
      mode: this.mode,
    });

    if (modeCfg.rewindDurationMs <= 0) {
      // Instant rewind for Censored mode (≤ 1 frame)
      this.finishRewind();
    }
  }

  private updateRewindScrub(dt: number): void {
    if (this.rewindDurationSeconds <= 0) {
      this.finishRewind();
      return;
    }

    this.rewindTimer += dt;
    this.rewindProgress = Math.min(1.0, this.rewindTimer / this.rewindDurationSeconds);

    // Ease-in-out scrub through recorded trail
    const eased = 0.5 - 0.5 * Math.cos(this.rewindProgress * Math.PI);
    const targetSample = Math.floor((1.0 - eased) * (this.trail.count - 1));
    this.rewindSampleIndex = Math.max(0, targetSample);

    const sample = { x: 0, y: 0, animFrame: 0, tick: 0 };
    if (this.trail.getSample(this.rewindSampleIndex, sample)) {
      this.player.x = sample.x;
      this.player.y = sample.y;
      this.player.animFrame = sample.animFrame;
      eventBus.emit('rewind:progress', {
        progress: this.rewindProgress,
        x: sample.x,
        y: sample.y,
      });
    }

    if (this.rewindProgress >= 1.0) {
      this.finishRewind();
    }
  }

  skipRewind(): void {
    if (this.isRewinding) {
      this.finishRewind();
    }
  }

  private finishRewind(): void {
    this.isRewinding = false;
    this.isDead = false;
    this.takesCount++;
    this.reset();
    eventBus.emit('rewind:finished', { mode: this.mode });
  }
}
