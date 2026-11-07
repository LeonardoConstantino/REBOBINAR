import { CauseId } from '../core/types';
import { ENEMY_DEFS } from '../content/enemiesData';

export interface ActiveEnemy {
  type: 'rebel_extra' | 'ghost_double';
  x: number;
  y: number;
  startX: number;
  patrolRange: number;
  vx: number;
  width: number;
  height: number;
  facingRight: boolean;
  frozenTimer: number;
  animTimer: number;
}

export class EnemyManager {
  enemies: ActiveEnemy[] = [];
  // Short history buffer for Ghost Double (2 seconds = 120 ticks at 60 FPS)
  private playerHistoryX: Float32Array = new Float32Array(120);
  private playerHistoryY: Float32Array = new Float32Array(120);
  private historyIndex: number = 0;
  private historyCount: number = 0;

  clear(): void {
    this.enemies = [];
    this.historyCount = 0;
    this.historyIndex = 0;
  }

  recordPlayerPosition(px: number, py: number): void {
    this.playerHistoryX[this.historyIndex] = px;
    this.playerHistoryY[this.historyIndex] = py;
    this.historyIndex = (this.historyIndex + 1) % 120;
    if (this.historyCount < 120) this.historyCount++;
  }

  addEnemy(type: 'rebel_extra' | 'ghost_double', x: number, y: number, patrolTiles: number): void {
    const def = ENEMY_DEFS[type];
    const patrolRange = patrolTiles * 16;
    this.enemies.push({
      type,
      x,
      y,
      startX: x,
      patrolRange,
      vx: def.speed,
      width: def.width,
      height: def.height,
      facingRight: true,
      frozenTimer: 0,
      animTimer: 0,
    });
  }

  freezeAll(durationSeconds: number): void {
    for (const enemy of this.enemies) {
      enemy.frozenTimer = durationSeconds;
    }
  }

  update(dt: number): void {
    for (const enemy of this.enemies) {
      if (enemy.frozenTimer > 0) {
        enemy.frozenTimer -= dt;
        continue;
      }

      enemy.animTimer += dt * 8;

      if (enemy.type === 'rebel_extra') {
        // Standard patrol within startX ± patrolRange
        enemy.x += enemy.vx * dt;
        if (enemy.x > enemy.startX + enemy.patrolRange) {
          enemy.vx = -Math.abs(enemy.vx);
          enemy.facingRight = false;
        } else if (enemy.x < enemy.startX - enemy.patrolRange) {
          enemy.vx = Math.abs(enemy.vx);
          enemy.facingRight = true;
        }
      } else if (enemy.type === 'ghost_double') {
        // Ghost double pulls from 2 seconds ago in player position history
        if (this.historyCount >= 100) {
          const pastIdx = (this.historyIndex - 100 + 120) % 120;
          const targetX = this.playerHistoryX[pastIdx];
          const targetY = this.playerHistoryY[pastIdx];

          // Lerp gently towards the 2s delayed position
          const dx = targetX - enemy.x;
          enemy.facingRight = dx >= 0;
          enemy.x += Math.sign(dx) * Math.min(Math.abs(dx), 110 * dt);
          enemy.y = targetY;
        }
      }
    }
  }

  checkCollision(
    px: number,
    py: number,
    pw: number,
    ph: number,
    invulnerable: boolean
  ): CauseId | null {
    if (invulnerable) return null;

    for (const enemy of this.enemies) {
      if (enemy.frozenTimer > 0) continue;

      if (
        px < enemy.x + enemy.width &&
        px + pw > enemy.x &&
        py < enemy.y + enemy.height &&
        py + ph > enemy.y
      ) {
        return enemy.type === 'ghost_double' ? 'ghost_double' : 'rebel_extra';
      }
    }
    return null;
  }
}
