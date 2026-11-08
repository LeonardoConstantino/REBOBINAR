import { LOGICAL_WIDTH, LOGICAL_HEIGHT, TILE_SIZE, CHUNK_WIDTH_UNITS, DEATH_MARK_BUCKET_UNITS } from '../content/tuning';
import { World } from '../sim/world';
import { Camera } from './camera';
import { ProceduralProvider } from './providers/proceduralProvider';
import { FilmFX } from './filmfx';
import { DeathMarkRecord } from '../platform/storage/db';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenBuffer: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  camera: Camera = new Camera();
  provider: ProceduralProvider = new ProceduralProvider();
  filmFx: FilmFX = new FilmFX();

  // Cached death marks for active mode
  deathMarks: DeathMarkRecord[] = [];
  marksVisibility: 'all' | 'nearby' | 'off' = 'all';
  fxTier: 'high' | 'mid' | 'low' = 'high';
  flickerReduced: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    this.offscreenBuffer = document.createElement('canvas');
    this.offscreenBuffer.width = LOGICAL_WIDTH;
    this.offscreenBuffer.height = LOGICAL_HEIGHT;
    const offCtx = this.offscreenBuffer.getContext('2d', { alpha: false });
    if (!offCtx) throw new Error('Could not get offscreen 2D context');
    this.offscreenCtx = offCtx;

    this.ctx.imageSmoothingEnabled = false;
    this.offscreenCtx.imageSmoothingEnabled = false;

    this.resize();
    window.addEventListener('resize', this.resize);
  }

  resize = (): void => {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.imageSmoothingEnabled = false;
  };

  setDeathMarks(marks: DeathMarkRecord[]): void {
    this.deathMarks = marks;
  }

  render(world: World, alpha: number): void {
    const ctx = this.offscreenCtx;
    const cam = this.camera;

    // Update Camera
    cam.update(0.016, world.player.x, world.player.y, world.player.facingRight);

    // Get current visual Era
    const era = this.filmFx.getEra(Math.floor(world.player.x / 16));

    // 1. Draw Parallax Background (Film Studio Soundstage)
    this.drawBackground(ctx, cam, era);

    // 2. Begin Camera Translation
    ctx.save();
    ctx.translate(-Math.floor(cam.x + cam.shakeOffsetX), -Math.floor(cam.y + cam.shakeOffsetY));

    // 3. Draw Chunks (Ground and Platforms)
    this.drawChunks(ctx, world, era);

    // 4. Draw Death Marks (Clapboards)
    if (this.marksVisibility !== 'off') {
      this.drawDeathMarks(ctx, cam);
    }

    // 5. Draw Keyframes
    this.drawKeyframes(ctx, world);

    // 6. Draw Traps (Erros de Edição)
    this.drawTraps(ctx, world);

    // 7. Draw Powerups
    this.drawPowerups(ctx, world);

    // 8. Draw Enemies (Figurantes)
    this.drawEnemies(ctx, world);

    // 9. Draw Player
    const playerDrawable = this.provider.get('player');
    playerDrawable.draw(ctx, world.player.x, world.player.y, {
      scaleX: world.player.scaleX,
      scaleY: world.player.scaleY,
      facingRight: world.player.facingRight,
      frame: world.player.animFrame,
      isInvulnerable: world.player.invulnTimer > 0,
      isDashing: world.player.dashing,
    });

    ctx.restore();

    // 10. Film FX Post Processing (Grain, Vignette, Scratches)
    this.filmFx.renderPostProcess(
      ctx,
      world.finalCut.currentPressure,
      world.isRewinding,
      this.fxTier,
      this.flickerReduced
    );

    // 11. Blit to main screen with aspect ratio preservation (Letterbox)
    this.blitToScreen();
  }

  private drawBackground(ctx: CanvasRenderingContext2D, cam: Camera, era: any): void {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    grad.addColorStop(0, era.skyTop);
    grad.addColorStop(1, era.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Parallax Layer 1: Distant studio roof trusses (slow 0.15 factor)
    ctx.save();
    ctx.fillStyle = 'rgba(23, 25, 29, 0.4)';
    const offset1 = (cam.x * 0.15) % 120;
    for (let x = -offset1; x < LOGICAL_WIDTH; x += 120) {
      // Triangle trusses
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 60, 45);
      ctx.lineTo(x + 120, 0);
      ctx.stroke();
      // Suspended spotlight outline
      ctx.fillRect(x + 55, 45, 10, 16);
    }
    ctx.restore();

    // Parallax Layer 2: Midground soundstage flats and reels (0.35 factor)
    ctx.save();
    ctx.fillStyle = 'rgba(35, 39, 46, 0.5)';
    const offset2 = (cam.x * 0.35) % 180;
    for (let x = -offset2; x < LOGICAL_WIDTH; x += 180) {
      ctx.fillRect(x, 140, 60, 150);
      // Film reel disc
      ctx.beginPath();
      ctx.arc(x + 110, 200, 22, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawChunks(ctx: CanvasRenderingContext2D, world: World, era: any): void {
    for (const [, chunk] of world.chunks) {
      const originX = chunk.index * CHUNK_WIDTH_UNITS;

      for (let y = 0; y < chunk.heightTiles; y++) {
        for (let x = 0; x < chunk.widthTiles; x++) {
          const tile = chunk.tiles[y * chunk.widthTiles + x];
          if (tile === 1) {
            const worldX = originX + x * TILE_SIZE;
            const worldY = y * TILE_SIZE;

            // Surface vs subterranean soil
            const isSurface = y === 0 || chunk.tiles[(y - 1) * chunk.widthTiles + x] === 0;

            if (isSurface) {
              ctx.fillStyle = era.groundSurface;
              ctx.fillRect(worldX, worldY, TILE_SIZE, 4);

              ctx.fillStyle = era.groundSoil;
              ctx.fillRect(worldX, worldY + 4, TILE_SIZE, TILE_SIZE - 4);

              // Sprocket dots on ground border (film strip aesthetic)
              ctx.fillStyle = '#17191D';
              ctx.fillRect(worldX + 2, worldY + 6, 3, 4);
              ctx.fillRect(worldX + 11, worldY + 6, 3, 4);
            } else {
              ctx.fillStyle = era.groundSoil;
              ctx.fillRect(worldX, worldY, TILE_SIZE, TILE_SIZE);
            }
          }
        }
      }
    }
  }

  private drawDeathMarks(ctx: CanvasRenderingContext2D, cam: Camera): void {
    const clapper = this.provider.get('clapper');
    const viewLeft = cam.x - 50;
    const viewRight = cam.x + LOGICAL_WIDTH + 50;

    for (const mark of this.deathMarks) {
      const worldX = mark.bucket * DEATH_MARK_BUCKET_UNITS + DEATH_MARK_BUCKET_UNITS / 2;
      // Culling
      if (worldX < viewLeft || worldX > viewRight) continue;

      if (this.marksVisibility === 'nearby' && Math.abs(worldX - cam.x) > 300) {
        continue;
      }

      clapper.draw(ctx, worldX, 288, { count: mark.count });
    }
  }

  private drawKeyframes(ctx: CanvasRenderingContext2D, world: World): void {
    const keyframeDrawable = this.provider.get('keyframe');
    const viewLeft = this.camera.x - 100;
    const viewRight = this.camera.x + LOGICAL_WIDTH + 100;

    for (const [, chunk] of world.chunks) {
      if (chunk.isKeyframe) {
        const chunkStart = chunk.index * CHUNK_WIDTH_UNITS;
        const keyframeX = Math.round(chunkStart / 1600) * 1600;
        if (keyframeX >= viewLeft && keyframeX <= viewRight) {
          const sceneNumber = Math.floor(keyframeX / 1600);
          keyframeDrawable.draw(ctx, keyframeX, 288, {
            text: `CENA ${String(sceneNumber).padStart(3, '0')} — ${sceneNumber * 100}M`,
          });
        }
      }
    }
  }

  private drawTraps(ctx: CanvasRenderingContext2D, world: World): void {
    for (const trap of world.traps.traps) {
      if (trap.x + trap.width < this.camera.x - 40 || trap.x > this.camera.x + LOGICAL_WIDTH + 40) {
        continue;
      }

      ctx.save();

      if (trap.type === 'jump_cut') {
        // Jump cut: blinking negative missing frame with hazard outline
        if (trap.isTelegraphing) {
          ctx.strokeStyle = '#D94B43';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(trap.x, trap.y, trap.width, trap.height);
          // Scissor icon cue
          ctx.fillStyle = '#D69A45';
          ctx.font = '10px monospace';
          ctx.fillText('✂ CORTE', trap.x + 4, trap.y - 4);
        } else if (trap.isHazardActive) {
          // Empty pitch black cut with red teeth
          ctx.fillStyle = '#17191D';
          ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
          ctx.fillStyle = '#D94B43';
          for (let tx = trap.x; tx < trap.x + trap.width; tx += 8) {
            ctx.beginPath();
            ctx.moveTo(tx, trap.y + trap.height);
            ctx.lineTo(tx + 4, trap.y);
            ctx.lineTo(tx + 8, trap.y + trap.height);
            ctx.fill();
          }
        }
      } else if (trap.type === 'freeze_frame') {
        // Freeze frame: theatrical spotlight and pause barrier
        if (trap.isTelegraphing) {
          ctx.fillStyle = 'rgba(66, 191, 194, 0.25)';
          ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
          ctx.strokeStyle = '#42BFC2';
          ctx.lineWidth = 1;
          ctx.strokeRect(trap.x, trap.y, trap.width, trap.height);
          ctx.fillStyle = '#42BFC2';
          ctx.font = '10px monospace';
          ctx.fillText('⏸ PAUSA', trap.x - 2, trap.y - 6);
        } else if (trap.isHazardActive) {
          ctx.fillStyle = '#D94B43';
          ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
          ctx.fillStyle = '#E8DFC9';
          ctx.fillRect(trap.x + 6, trap.y + 10, 5, 28);
          ctx.fillRect(trap.x + 17, trap.y + 10, 5, 28);
        }
      } else if (trap.type === 'film_scratch') {
        // Vertical film scratch line
        if (trap.isTelegraphing) {
          ctx.strokeStyle = 'rgba(232, 223, 201, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(trap.x + 7, trap.y);
          ctx.lineTo(trap.x + 7, trap.y + trap.height);
          ctx.stroke();
          ctx.fillStyle = '#D69A45';
          ctx.font = '9px monospace';
          ctx.fillText('⚡ RISCO', trap.x - 6, trap.y - 6);
        } else if (trap.isHazardActive) {
          ctx.strokeStyle = '#D94B43';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(trap.x + 7, trap.y);
          ctx.lineTo(trap.x + 9, trap.y + trap.height * 0.4);
          ctx.lineTo(trap.x + 5, trap.y + trap.height * 0.7);
          ctx.lineTo(trap.x + 7, trap.y + trap.height);
          ctx.stroke();
        }
      } else if (trap.type === 'rewind_glitch') {
        // Rewind glitch box
        if (trap.isTelegraphing) {
          ctx.strokeStyle = 'rgba(128, 104, 184, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(trap.x, trap.y, trap.width, trap.height);
          ctx.fillStyle = '#8068B8';
          ctx.font = '10px monospace';
          ctx.fillText('<< GLITCH', trap.x - 4, trap.y - 4);
        } else if (trap.isHazardActive) {
          ctx.fillStyle = 'rgba(128, 104, 184, 0.85)'; // Violet
          ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
          ctx.fillStyle = '#E8DFC9';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('<<', trap.x + 8, trap.y + 20);
        }
      }

      ctx.restore();
    }
  }

  private drawPowerups(ctx: CanvasRenderingContext2D, world: World): void {
    for (const p of world.powerupPickups) {
      if (p.collected) continue;
      if (p.x < this.camera.x - 20 || p.x > this.camera.x + LOGICAL_WIDTH + 20) continue;

      ctx.save();
      ctx.translate(p.x + 8, p.y + 8);

      // Gentle floating bob
      const bob = Math.sin((Date.now() / 250) + p.x) * 3;
      ctx.translate(0, bob);

      if (p.type === 'golden_tape') {
        // Golden Tape reel
        ctx.fillStyle = '#D69A45'; // Amber gold
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#17191D';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'slow_cam') {
        // Cyan stopwatch camera
        ctx.fillStyle = '#42BFC2';
        ctx.fillRect(-7, -7, 14, 14);
        ctx.fillStyle = '#17191D';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'still_frame') {
        // Pause card
        ctx.fillStyle = '#E8DFC9';
        ctx.fillRect(-6, -8, 12, 16);
        ctx.fillStyle = '#17191D';
        ctx.fillRect(-3, -4, 2, 8);
        ctx.fillRect(1, -4, 2, 8);
      }

      ctx.restore();
    }
  }

  private drawEnemies(ctx: CanvasRenderingContext2D, world: World): void {
    const rebel = this.provider.get('rebel_extra');
    const ghost = this.provider.get('ghost_double');

    for (const e of world.enemies.enemies) {
      if (e.x < this.camera.x - 30 || e.x > this.camera.x + LOGICAL_WIDTH + 30) continue;

      ctx.save();
      if (e.defeated) {
        // Cut slash & dissolve fade upon stomp or expiration
        ctx.globalAlpha = Math.max(0, e.defeatedTimer / 0.35);
        ctx.strokeStyle = '#D94B43';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(e.x - 4, e.y + e.height / 2);
        ctx.lineTo(e.x + e.width + 4, e.y + e.height / 2);
        ctx.stroke();
      } else if (e.type === 'ghost_double') {
        // Flickering dissipation as ghost approaches lifetime expiration
        if (e.lifeTimer < 1.8) {
          ctx.globalAlpha = 0.35 + Math.sin(world.ticks * 0.4) * 0.25;
        }
      }

      if (e.type === 'rebel_extra') {
        rebel.draw(ctx, e.x, e.y, { facingRight: e.facingRight });
      } else {
        ghost.draw(ctx, e.x, e.y, { facingRight: e.facingRight });
      }
      ctx.restore();
    }
  }

  private blitToScreen(): void {
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // Calculate aspect fit scaling (16:9)
    const scale = Math.min(cw / LOGICAL_WIDTH, ch / LOGICAL_HEIGHT);
    const destW = Math.round(LOGICAL_WIDTH * scale);
    const destH = Math.round(LOGICAL_HEIGHT * scale);
    const destX = Math.round((cw - destW) / 2);
    const destY = Math.round((ch - destH) / 2);

    // Letterbox bars in pure cinema black #17191D
    this.ctx.fillStyle = '#17191D';
    this.ctx.fillRect(0, 0, cw, ch);

    // Blit logical canvas centered
    this.ctx.drawImage(
      this.offscreenBuffer,
      0,
      0,
      LOGICAL_WIDTH,
      LOGICAL_HEIGHT,
      destX,
      destY,
      destW,
      destH
    );
  }

  destroy(): void {
    window.removeEventListener('resize', this.resize);
  }
}
