/**
 * REBOBINAR - Game Tuning Constants
 * All adjustable values specified by GDD live here.
 */

export const LOGICAL_WIDTH = 640;
export const LOGICAL_HEIGHT = 360;
export const TILE_SIZE = 16;
export const CHUNK_WIDTH_TILES = 32;
export const CHUNK_WIDTH_UNITS = CHUNK_WIDTH_TILES * TILE_SIZE; // 512 units
export const UNITS_PER_METER = 16; // 1 tile = 1 meter = 16 units
export const KEYFRAME_DISTANCE_METERS = 100;
export const KEYFRAME_INTERVAL_UNITS = KEYFRAME_DISTANCE_METERS * UNITS_PER_METER; // 1600 units
export const DEATH_MARK_BUCKET_METERS = 4;
export const DEATH_MARK_BUCKET_UNITS = DEATH_MARK_BUCKET_METERS * UNITS_PER_METER; // 64 units

export const PHYSICS_CONFIG = {
  gravity: 1100, // units/s^2
  jumpVelocity: -430, // units/s
  variableJumpCutFactor: 0.45, // velocity cut when release jump early
  maxFallVelocity: 650, // terminal fall velocity
  moveSpeed: 210, // units/s horizontal run
  accelGround: 1400,
  accelAir: 900,
  frictionGround: 1300,
  frictionAir: 200,
  dashSpeed: 420,
  dashDurationSeconds: 0.18,
  dashCooldownSeconds: 0.75,
  playerWidth: 14,
  playerHeight: 22,
};

export const TIME_CONFIG = {
  fixedTickRate: 60,
  fixedDt: 1 / 60,
  maxAccumulator: 0.1, // 100ms clamp for loop lag spike protection
  trailSampleEveryTicks: 4, // 15 Hz at 60 FPS
  trailMaxCapacity: 13500, // 15 minutes of run
  snapshotHz: 10, // 10 snapshots per second
  snapshotIntervalTicks: 6, // 60 / 10 = every 6 ticks
  snapshotCapacity: 50, // 5 seconds depth
  retakeRewindSeconds: 3.0,
  retakeInvulnSeconds: 0.6,
  retakeCooldownSeconds: 5.0,
  retakeInitialCharges: 2,
  retakeKeyframesPerCharge: 3,
  retakeMaxCharges: 3,
};

export const PRESSURE_CONFIG = {
  minExpectedSpeedMetersPerSec: 2.5,
  pressureFillRate: 0.05, // per second when standing still or crawling
  pressureDecayOnKeyframe: 0.25,
  maxRebelSpawnMultiplier: 0.25, // +25% spawn at 1.0 pressure
};
