import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../content/tuning';

export class Camera {
  x: number = 0;
  y: number = 0;
  targetX: number = 0;
  targetY: number = 0;

  // Screen shake
  shakeIntensity: number = 0;
  shakeDuration: number = 0;
  shakeOffsetX: number = 0;
  shakeOffsetY: number = 0;
  shakeMultiplier: number = 1.0;

  reset(): void {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  setShakeMultiplier(m: number): void {
    this.shakeMultiplier = Math.max(0, Math.min(1.5, m));
  }

  addShake(intensity: number, durationSeconds: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity * this.shakeMultiplier);
    this.shakeDuration = Math.max(this.shakeDuration, durationSeconds);
  }

  update(dt: number, focusX: number, focusY: number, facingRight: boolean): void {
    // Lead ahead horizontally
    const leadAhead = facingRight ? 60 : -40;
    this.targetX = Math.max(0, focusX - LOGICAL_WIDTH * 0.35 + leadAhead);
    // Smooth camera lag
    this.x += (this.targetX - this.x) * Math.min(1.0, dt * 10);
    this.y = 0; // Fixed horizontal platformer camera height

    // Screen shake update
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const curAmp = this.shakeIntensity * (this.shakeDuration / 0.35);
      this.shakeOffsetX = (Math.random() - 0.5) * 2 * curAmp;
      this.shakeOffsetY = (Math.random() - 0.5) * 2 * curAmp;
      if (this.shakeDuration <= 0) {
        this.shakeIntensity = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    }
  }
}
