import { PRESSURE_CONFIG } from '../content/tuning';

/**
 * Final Cut (Edição Final) - pressure signal in [0, 1].
 * Pure simulation module that monitors pace and tension.
 * Never deals damage directly.
 */
export class FinalCutSystem {
  private pressure: number = 0;
  private lastX: number = 0;
  private slowTimeAccumulator: number = 0;

  reset(): void {
    this.pressure = 0;
    this.lastX = 0;
    this.slowTimeAccumulator = 0;
  }

  update(dt: number, currentX: number): number {
    const deltaX = Math.max(0, currentX - this.lastX);
    this.lastX = currentX;

    const currentSpeed = deltaX / (dt || 0.016);
    const expectedMinSpeed = PRESSURE_CONFIG.minExpectedSpeedMetersPerSec * 16; // in units/sec

    if (currentSpeed < expectedMinSpeed) {
      this.slowTimeAccumulator += dt;
      // Increase pressure smoothly
      this.pressure = Math.min(1.0, this.pressure + PRESSURE_CONFIG.pressureFillRate * dt);
    } else {
      // Natural steady pace cools down slowly
      this.slowTimeAccumulator = Math.max(0, this.slowTimeAccumulator - dt * 0.5);
      this.pressure = Math.max(0, this.pressure - dt * 0.02);
    }

    return this.pressure;
  }

  relieveOnKeyframe(): void {
    this.pressure = Math.max(0, this.pressure - PRESSURE_CONFIG.pressureDecayOnKeyframe);
  }

  get currentPressure(): number {
    return this.pressure;
  }

  setPressure(val: number): void {
    this.pressure = Math.max(0, Math.min(1.0, val));
  }
}
