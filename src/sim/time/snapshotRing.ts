import { TIME_CONFIG } from '../../content/tuning';
import { PowerupId } from '../../core/types';

export interface SimSnapshot {
  tick: number;
  playerX: number;
  playerY: number;
  playerVx: number;
  playerVy: number;
  grounded: boolean;
  facingRight: boolean;
  dashing: boolean;
  dashTimer: number;
  dashCooldown: number;
  invulnTimer: number;
  storedPowerup: PowerupId | null;
  activePowerup: PowerupId | null;
  activePowerupTimer: number;
  distanceUnits: number;
  pressure: number;
}

/**
 * Pre-allocated circular snapshot buffer for Retomada.
 * Records state at 10Hz (every 6 ticks). Capacity 50 = 5 seconds.
 */
export class SnapshotRing {
  private buffer: SimSnapshot[];
  private capacity: number;
  private head: number = 0;
  private count: number = 0;

  constructor(capacity = TIME_CONFIG.snapshotCapacity) {
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(null).map(() => ({
      tick: 0,
      playerX: 0,
      playerY: 0,
      playerVx: 0,
      playerVy: 0,
      grounded: true,
      facingRight: true,
      dashing: false,
      dashTimer: 0,
      dashCooldown: 0,
      invulnTimer: 0,
      storedPowerup: null,
      activePowerup: null,
      activePowerupTimer: 0,
      distanceUnits: 0,
      pressure: 0,
    }));
  }

  reset(): void {
    this.head = 0;
    this.count = 0;
  }

  push(snapshot: SimSnapshot): void {
    const target = this.buffer[this.head];
    // Copy fields
    target.tick = snapshot.tick;
    target.playerX = snapshot.playerX;
    target.playerY = snapshot.playerY;
    target.playerVx = snapshot.playerVx;
    target.playerVy = snapshot.playerVy;
    target.grounded = snapshot.grounded;
    target.facingRight = snapshot.facingRight;
    target.dashing = snapshot.dashing;
    target.dashTimer = snapshot.dashTimer;
    target.dashCooldown = snapshot.dashCooldown;
    target.invulnTimer = snapshot.invulnTimer;
    target.storedPowerup = snapshot.storedPowerup;
    target.activePowerup = snapshot.activePowerup;
    target.activePowerupTimer = snapshot.activePowerupTimer;
    target.distanceUnits = snapshot.distanceUnits;
    target.pressure = snapshot.pressure;

    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  /**
   * Find the snapshot closest to (targetTick).
   * E.g., for retake 3 seconds ago: targetTick = currentTick - (3 * 60)
   */
  findClosest(targetTick: number): SimSnapshot | null {
    if (this.count === 0) return null;

    let bestDist = Infinity;
    let bestSnapshot: SimSnapshot | null = null;

    for (let i = 0; i < this.count; i++) {
      // Walk backwards from head
      const idx = (this.head - 1 - i + this.capacity) % this.capacity;
      const snap = this.buffer[idx];
      const diff = Math.abs(snap.tick - targetTick);
      if (diff < bestDist) {
        bestDist = diff;
        bestSnapshot = snap;
      }
    }

    return bestSnapshot;
  }
}
