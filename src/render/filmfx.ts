import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../content/tuning';

export interface EraColorMap {
  name: string;
  skyTop: string;
  skyBottom: string;
  groundSurface: string;
  groundSoil: string;
  accent: string;
  glitchIntensity: number;
}

export class FilmFX {
  private grainCanvases: HTMLCanvasElement[] = [];
  private grainIndex: number = 0;
  private grainTimer: number = 0;
  private scratchOffsets: number[] = [0.2, 0.5, 0.75];

  constructor() {
    this.initGrainTiles();
  }

  private initGrainTiles(): void {
    // Pre-bake 4 small grain tiles (128x128) to avoid ANY runtime Math.random allocation in hot loop
    for (let i = 0; i < 4; i++) {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d');
      if (ctx) {
        const imgData = ctx.createImageData(128, 128);
        const data = imgData.data;
        for (let p = 0; p < data.length; p += 4) {
          const v = Math.random() * 255;
          data[p] = v;
          data[p + 1] = v;
          data[p + 2] = v;
          data[p + 3] = 18; // Very subtle noise alpha
        }
        ctx.putImageData(imgData, 0, 0);
      }
      this.grainCanvases.push(c);
    }
  }

  getEra(distanceMeters: number): EraColorMap {
    if (distanceMeters < 200) {
      // 0 - 200m: Silent Era / P&B / Sépia
      return {
        name: 'Era do Cinema Mudo (1920)',
        skyTop: '#1E2024',
        skyBottom: '#2B2B28',
        groundSurface: '#7D7565',
        groundSoil: '#2D2824',
        accent: '#E8DFC9',
        glitchIntensity: 0.05,
      };
    } else if (distanceMeters < 500) {
      // 200 - 500m: Era de Ouro / Âmbar de Projetor
      return {
        name: 'Era de Ouro dos Estúdios (1940)',
        skyTop: '#181C26',
        skyBottom: '#2E2822',
        groundSurface: '#D69A45',
        groundSoil: '#33261C',
        accent: '#D69A45',
        glitchIntensity: 0.15,
      };
    } else if (distanceMeters < 1000) {
      // 500 - 1000m: Technicolor Saturado
      return {
        name: 'Glorioso Technicolor (1960)',
        skyTop: '#132838',
        skyBottom: '#1F3F3E',
        groundSurface: '#42BFC2',
        groundSoil: '#1A2930',
        accent: '#D94B43',
        glitchIntensity: 0.35,
      };
    } else {
      // 1000m+: Colapso Digital / Neon Glitch
      return {
        name: 'Colapso Digital da Edição (2020+)',
        skyTop: '#1E0E2E',
        skyBottom: '#381640',
        groundSurface: '#8068B8',
        groundSoil: '#210B2B',
        accent: '#42BFC2',
        glitchIntensity: 0.7,
      };
    }
  }

  renderPostProcess(
    ctx: CanvasRenderingContext2D,
    pressure: number,
    isRewinding: boolean,
    fxTier: 'high' | 'mid' | 'low',
    flickerReduced: boolean
  ): void {
    if (fxTier === 'low') {
      // Static minimal vignette only
      this.drawVignette(ctx, 0.4);
      return;
    }

    // Step Grain Tile every ~3 frames
    this.grainTimer++;
    if (this.grainTimer % 3 === 0) {
      this.grainIndex = (this.grainIndex + 1) % this.grainCanvases.length;
    }

    // 1. Film Grain
    const grainCanvas = this.grainCanvases[this.grainIndex];
    if (grainCanvas) {
      ctx.save();
      ctx.globalAlpha = 0.35 + pressure * 0.3;
      ctx.globalCompositeOperation = isRewinding ? 'difference' : 'screen';
      // Tile 128x128 across 640x360
      const offsetX = (this.grainIndex * 37) % 128;
      const offsetY = (this.grainIndex * 59) % 128;
      for (let x = -offsetX; x < LOGICAL_WIDTH; x += 128) {
        for (let y = -offsetY; y < LOGICAL_HEIGHT; y += 128) {
          ctx.drawImage(grainCanvas, x, y);
        }
      }
      ctx.restore();
    }

    // 2. Vignette
    const vignetteStrength = Math.min(0.85, 0.45 + pressure * 0.35 + (isRewinding ? 0.3 : 0));
    this.drawVignette(ctx, vignetteStrength);

    // 3. Film Scratches and Flicker (only on 'high' tier or when pressure is high)
    if (fxTier === 'high' && !flickerReduced) {
      // Vertical jitter
      if (Math.random() < pressure * 0.4) {
        ctx.fillStyle = 'rgba(232, 223, 201, 0.15)';
        const scratchX = Math.random() * LOGICAL_WIDTH;
        ctx.fillRect(scratchX, 0, 1.5, LOGICAL_HEIGHT);
      }

      // Border frame flicker
      if (pressure > 0.6 && Math.random() < 0.25) {
        ctx.fillStyle = 'rgba(217, 75, 67, 0.08)'; // REC red flash
        ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      }
    }

    // 4. Rewind Lines
    if (isRewinding) {
      this.drawRewindLines(ctx);
    }
  }

  private drawVignette(ctx: CanvasRenderingContext2D, strength: number): void {
    ctx.save();
    const grad = ctx.createRadialGradient(
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT / 2,
      LOGICAL_WIDTH * 0.3,
      LOGICAL_WIDTH / 2,
      LOGICAL_HEIGHT / 2,
      LOGICAL_WIDTH * 0.65
    );
    grad.addColorStop(0, 'rgba(23, 25, 29, 0)');
    grad.addColorStop(1, `rgba(23, 25, 29, ${strength})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.restore();
  }

  private drawRewindLines(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = 'rgba(232, 223, 201, 0.3)';
    // Horizontal scan / scrub lines
    for (let y = 0; y < LOGICAL_HEIGHT; y += 14) {
      if (Math.random() < 0.35) {
        ctx.fillRect(0, y, LOGICAL_WIDTH, 1.5);
      }
    }

    // Large "<< REBOBINAR" watermark in center
    ctx.fillStyle = 'rgba(232, 223, 201, 0.45)';
    ctx.font = 'bold 22px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('<< REBOBINANDO FITA <<', LOGICAL_WIDTH / 2, 45);

    ctx.restore();
  }
}
