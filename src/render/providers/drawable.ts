export interface AnimState {
  scaleX?: number;
  scaleY?: number;
  facingRight?: boolean;
  frame?: number;
  isInvulnerable?: boolean;
  isDashing?: boolean;
  pressure?: number;
  alpha?: number;
  text?: string;
  count?: number;
}

export interface Drawable {
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, state?: AnimState): void;
}

export interface DrawableProvider {
  get(kind: string, variant?: number): Drawable;
}
