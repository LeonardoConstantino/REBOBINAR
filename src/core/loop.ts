import { TIME_CONFIG } from '../content/tuning';

export type SimTickCallback = () => void;
export type RenderCallback = (alpha: number) => void;

export class GameLoop {
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private rafId: number = 0;
  private lastTime: number = 0;
  private accumulator: number = 0;

  private onTick: SimTickCallback;
  private onRender: RenderCallback;

  // Performance monitoring for FX Tiers (Section 15.2)
  private frameTimes: number[] = [];
  private onPerformanceDegraded?: () => void;

  constructor(
    onTick: SimTickCallback,
    onRender: RenderCallback,
    onPerformanceDegraded?: () => void
  ) {
    this.onTick = onTick;
    this.onRender = onRender;
    this.onPerformanceDegraded = onPerformanceDegraded;

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.isPaused = true;
    } else {
      this.isPaused = false;
      this.lastTime = performance.now();
      this.accumulator = 0;
    }
  };

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.step);
  }

  stop(): void {
    this.isRunning = false;
    cancelAnimationFrame(this.rafId);
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused;
    if (!paused) {
      this.lastTime = performance.now();
      this.accumulator = 0;
    }
  }

  get paused(): boolean {
    return this.isPaused;
  }

  private step = (now: number): void => {
    if (!this.isRunning) return;

    const frameDelta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Track frame time for hardware adaptation
    if (this.frameTimes.length > 180) this.frameTimes.shift();
    this.frameTimes.push(frameDelta * 1000);

    // Check if 95th percentile exceeds 14ms
    if (this.frameTimes.length >= 180 && this.onPerformanceDegraded) {
      const sorted = [...this.frameTimes].sort((a, b) => a - b);
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      if (p95 > 14) {
        this.onPerformanceDegraded();
      }
    }

    if (!this.isPaused) {
      // Clamp accumulator to protect against lag spikes
      this.accumulator += Math.min(TIME_CONFIG.maxAccumulator, frameDelta);

      // Fixed timestep updates
      while (this.accumulator >= TIME_CONFIG.fixedDt) {
        this.onTick();
        this.accumulator -= TIME_CONFIG.fixedDt;
      }

      // Interpolation alpha for smooth rendering
      const alpha = this.accumulator / TIME_CONFIG.fixedDt;
      this.onRender(alpha);
    }

    this.rafId = requestAnimationFrame(this.step);
  };

  destroy(): void {
    this.stop();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}
