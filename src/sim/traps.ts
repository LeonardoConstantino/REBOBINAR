import { CauseId } from '../core/types';
import { TRAP_DEFS } from '../content/trapsData';

export interface ActiveTrap {
  type: CauseId;
  x: number;
  y: number;
  width: number;
  height: number;
  phaseTimer: number;
  period: number;
  telegraphSeconds: number;
  activeSeconds: number;
  isTelegraphing: boolean;
  isHazardActive: boolean;
  frozenTimer: number; // for still_frame powerup
}

export class TrapManager {
  traps: ActiveTrap[] = [];

  clear(): void {
    this.traps = [];
  }

  addTrap(type: CauseId, x: number, y: number, phaseOffset: number = 0): void {
    const def = TRAP_DEFS[type] || TRAP_DEFS['jump_cut'];
    this.traps.push({
      type,
      x,
      y,
      width: def.width,
      height: def.height,
      phaseTimer: phaseOffset % def.periodSeconds,
      period: def.periodSeconds,
      telegraphSeconds: def.telegraphSeconds,
      activeSeconds: def.activeSeconds,
      isTelegraphing: false,
      isHazardActive: false,
      frozenTimer: 0,
    });
  }

  freezeAll(durationSeconds: number): void {
    for (const trap of this.traps) {
      trap.frozenTimer = durationSeconds;
    }
  }

  update(dt: number, playerSpeed: number, playerDashing: boolean): void {
    for (const trap of this.traps) {
      if (trap.frozenTimer > 0) {
        trap.frozenTimer -= dt;
        continue;
      }

      // Special behaviour for rewind_glitch: triggers when player dashes or exceeds speed
      if (trap.type === 'rewind_glitch') {
        if (playerDashing || playerSpeed > 300) {
          trap.isTelegraphing = true;
          trap.isHazardActive = true;
        } else {
          trap.isTelegraphing = false;
          trap.isHazardActive = false;
        }
        continue;
      }

      trap.phaseTimer = (trap.phaseTimer + dt) % trap.period;

      // Telegraph happens right before active window
      const activeStart = trap.period - trap.activeSeconds;
      const telegraphStart = activeStart - trap.telegraphSeconds;

      if (trap.phaseTimer >= telegraphStart && trap.phaseTimer < activeStart) {
        trap.isTelegraphing = true;
        trap.isHazardActive = false;
      } else if (trap.phaseTimer >= activeStart) {
        trap.isTelegraphing = false;
        trap.isHazardActive = true;
      } else {
        trap.isTelegraphing = false;
        trap.isHazardActive = false;
      }
    }
  }

  /**
   * Check collision against player AABB
   */
  checkCollision(
    px: number,
    py: number,
    pw: number,
    ph: number,
    invulnerable: boolean
  ): CauseId | null {
    if (invulnerable) return null;

    for (const trap of this.traps) {
      if (trap.frozenTimer > 0) continue;
      if (!trap.isHazardActive) continue;

      // AABB overlap check
      if (
        px < trap.x + trap.width &&
        px + pw > trap.x &&
        py < trap.y + trap.height &&
        py + ph > trap.y
      ) {
        return trap.type;
      }
    }
    return null;
  }
}
