import { TIME_CONFIG } from '../../content/tuning';

/**
 * Pre-allocated append-only typed buffer for visual rewind replay.
 * Uses 16-bit integers with 4x subunit scaling for compact footprint (<70KB for 15min run).
 * Zero garbage collection allocation during run.
 */
export class TrailRecorder {
  private xBuffer: Int16Array;
  private yBuffer: Int16Array;
  private animBuffer: Uint8Array;
  private sampleTicks: Uint32Array;
  private sampleCount: number = 0;
  private maxCapacity: number;

  constructor(capacity = TIME_CONFIG.trailMaxCapacity) {
    this.maxCapacity = capacity;
    this.xBuffer = new Int16Array(capacity);
    this.yBuffer = new Int16Array(capacity);
    this.animBuffer = new Uint8Array(capacity);
    this.sampleTicks = new Uint32Array(capacity);
  }

  reset(): void {
    this.sampleCount = 0;
  }

  record(tick: number, x: number, y: number, animFrame: number): void {
    if (this.sampleCount >= this.maxCapacity) {
      // Loop or stop appending if reached limit (15+ min)
      return;
    }
    const idx = this.sampleCount;
    // 4x sub-unit scale clamped to Int16
    this.xBuffer[idx] = Math.max(-32768, Math.min(32767, Math.round(x * 4)));
    this.yBuffer[idx] = Math.max(-32768, Math.min(32767, Math.round(y * 4)));
    this.animBuffer[idx] = animFrame & 0xff;
    this.sampleTicks[idx] = tick;
    this.sampleCount++;
  }

  get count(): number {
    return this.sampleCount;
  }

  getSample(index: number, out: { x: number; y: number; animFrame: number; tick: number }): boolean {
    if (index < 0 || index >= this.sampleCount) return false;
    out.x = this.xBuffer[index] / 4;
    out.y = this.yBuffer[index] / 4;
    out.animFrame = this.animBuffer[index];
    out.tick = this.sampleTicks[index];
    return true;
  }

  getLatestSample(out: { x: number; y: number; animFrame: number; tick: number }): boolean {
    if (this.sampleCount === 0) return false;
    return this.getSample(this.sampleCount - 1, out);
  }
}
