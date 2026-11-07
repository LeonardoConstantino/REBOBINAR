import { Btn, InputFrame } from '../../core/types';

export class TouchPadSource {
  private touchButtons: number = 0;
  private touchAxisX: number = 0;

  // Left slide tracking
  private slidePointerId: number | null = null;
  private originX: number = 0;
  private currentX: number = 0;
  private isEngaged: boolean = false;
  private readonly deadzonePx: number = 12;
  private readonly maxTravelPx: number = 48;

  // Right action buttons tracking
  private activePointers = new Map<number, Btn>();

  onSlideStart(pointerId: number, clientX: number): void {
    this.slidePointerId = pointerId;
    this.originX = clientX;
    this.currentX = clientX;
    this.isEngaged = false;
  }

  onSlideMove(pointerId: number, clientX: number): void {
    if (this.slidePointerId !== pointerId) return;
    this.currentX = clientX;
    const delta = this.currentX - this.originX;
    const absDelta = Math.abs(delta);

    // Hysteresis deadzone: 12px to break out, 7.2px (60%) to return
    const threshold = this.isEngaged ? this.deadzonePx * 0.6 : this.deadzonePx;

    if (absDelta > threshold) {
      this.isEngaged = true;
      const signedTravel = delta - Math.sign(delta) * threshold;
      const normalized = signedTravel / (this.maxTravelPx - threshold);
      this.touchAxisX = Math.max(-1, Math.min(1, normalized));
    } else {
      this.isEngaged = false;
      this.touchAxisX = 0;
    }
  }

  onSlideEnd(pointerId: number): void {
    if (this.slidePointerId === pointerId) {
      this.slidePointerId = null;
      this.isEngaged = false;
      this.touchAxisX = 0;
    }
  }

  onButtonDown(pointerId: number, btn: Btn): void {
    this.activePointers.set(pointerId, btn);
    this.touchButtons |= btn;
  }

  onButtonUp(pointerId: number): void {
    const btn = this.activePointers.get(pointerId);
    if (btn !== undefined) {
      this.activePointers.delete(pointerId);
      // Recompute buttons from remaining pointers
      let b = 0;
      for (const val of this.activePointers.values()) {
        b |= val;
      }
      this.touchButtons = b;
    }
  }

  poll(out: InputFrame): void {
    if (Math.abs(this.touchAxisX) > 0.01) {
      out.axisX = Math.max(-1, Math.min(1, out.axisX + this.touchAxisX));
    }
    out.buttons |= this.touchButtons;
  }

  get slideState() {
    return {
      active: this.slidePointerId !== null,
      engaged: this.isEngaged,
      axisX: this.touchAxisX,
      deltaX: this.currentX - this.originX,
    };
  }
}

export const touchPadSource = new TouchPadSource();
