import { Btn, InputFrame, PowerupId } from '../core/types';
import { PHYSICS_CONFIG } from '../content/tuning';

export class Player {
  x: number = 64;
  y: number = 260;
  vx: number = 0;
  vy: number = 0;
  width: number = PHYSICS_CONFIG.playerWidth;
  height: number = PHYSICS_CONFIG.playerHeight;

  grounded: boolean = false;
  facingRight: boolean = true;

  // Jump feel buffers
  coyoteTimer: number = 0;
  jumpBufferTimer: number = 0;

  // Dash
  dashing: boolean = false;
  dashTimer: number = 0;
  dashCooldownTimer: number = 0;
  dashDir: number = 1;

  // Invulnerability
  invulnTimer: number = 0;

  // Juice: Squash and stretch factors
  scaleX: number = 1.0;
  scaleY: number = 1.0;

  // Stored and active powerups
  storedPowerup: PowerupId | null = null;
  activePowerup: PowerupId | null = null;
  activePowerupTimer: number = 0;

  // Animation frame indicator
  animFrame: number = 0;
  runCycleTimer: number = 0;

  reset(startX = 64, startY = 260): void {
    this.x = startX;
    this.y = startY;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.facingRight = true;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.dashing = false;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.invulnTimer = 0;
    this.scaleX = 1.0;
    this.scaleY = 1.0;
    this.storedPowerup = null;
    this.activePowerup = null;
    this.activePowerupTimer = 0;
    this.animFrame = 0;
    this.runCycleTimer = 0;
  }

  update(
    dt: number,
    input: InputFrame,
    coyoteMaxSeconds: number,
    bufferMaxSeconds: number,
    onJump?: () => void,
    onDash?: () => void
  ): void {
    // Relax squash/stretch smoothly toward 1.0
    this.scaleX += (1.0 - this.scaleX) * Math.min(1.0, dt * 14);
    this.scaleY += (1.0 - this.scaleY) * Math.min(1.0, dt * 14);

    // Decrement timers
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;

    if (this.activePowerupTimer > 0) {
      this.activePowerupTimer -= dt;
      if (this.activePowerupTimer <= 0) {
        this.activePowerup = null;
      }
    }

    // Input buffer for jump
    if ((input.buttons & Btn.Jump) !== 0) {
      this.jumpBufferTimer = bufferMaxSeconds;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    // Coyote timer
    if (this.grounded) {
      this.coyoteTimer = coyoteMaxSeconds;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer -= dt;
    }

    // Dash handle
    if (this.dashing) {
      this.dashTimer -= dt;
      this.vx = this.dashDir * PHYSICS_CONFIG.dashSpeed;
      this.vy = 0;
      this.animFrame = 5; // Dash frame
      if (this.dashTimer <= 0) {
        this.dashing = false;
        this.dashCooldownTimer = PHYSICS_CONFIG.dashCooldownSeconds;
      }
      return;
    }

    // Initiate Dash
    if ((input.buttons & Btn.Dash) !== 0 && this.dashCooldownTimer <= 0 && !this.dashing) {
      this.dashing = true;
      this.dashTimer = PHYSICS_CONFIG.dashDurationSeconds;
      this.dashDir = input.axisX !== 0 ? Math.sign(input.axisX) : this.facingRight ? 1 : -1;
      this.scaleX = 1.35;
      this.scaleY = 0.7;
      if (onDash) onDash();
      return;
    }

    // Horizontal Movement
    const targetVx = input.axisX * PHYSICS_CONFIG.moveSpeed;
    if (input.axisX > 0.15) {
      this.facingRight = true;
    } else if (input.axisX < -0.15) {
      this.facingRight = false;
    }

    const accel = this.grounded ? PHYSICS_CONFIG.accelGround : PHYSICS_CONFIG.accelAir;
    const friction = this.grounded ? PHYSICS_CONFIG.frictionGround : PHYSICS_CONFIG.frictionAir;

    if (Math.abs(input.axisX) > 0.05) {
      // Accelerate towards target
      if (this.vx < targetVx) {
        this.vx = Math.min(targetVx, this.vx + accel * dt);
      } else if (this.vx > targetVx) {
        this.vx = Math.max(targetVx, this.vx - accel * dt);
      }
    } else {
      // Decelerate / friction
      if (this.vx > 0) {
        this.vx = Math.max(0, this.vx - friction * dt);
      } else if (this.vx < 0) {
        this.vx = Math.min(0, this.vx + friction * dt);
      }
    }

    // Jump Execution
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.vy = PHYSICS_CONFIG.jumpVelocity;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.grounded = false;
      this.scaleX = 0.75;
      this.scaleY = 1.35;
      if (onJump) onJump();
    }

    // Variable jump cut: if ascending and player released jump button
    if (this.vy < 0 && (input.buttons & Btn.Jump) === 0) {
      this.vy += PHYSICS_CONFIG.gravity * PHYSICS_CONFIG.variableJumpCutFactor * dt;
    }

    // Gravity
    this.vy = Math.min(
      PHYSICS_CONFIG.maxFallVelocity,
      this.vy + PHYSICS_CONFIG.gravity * dt
    );

    // Update animation state
    if (!this.grounded) {
      this.animFrame = this.vy < 0 ? 3 : 4; // Jump up or fall down
    } else if (Math.abs(this.vx) > 15) {
      this.runCycleTimer += dt * 12;
      this.animFrame = Math.floor(this.runCycleTimer) % 2 === 0 ? 1 : 2;
    } else {
      this.animFrame = 0; // Idle
    }
  }

  triggerLandSquash(velocity: number): void {
    const intensity = Math.min(0.4, Math.abs(velocity) / 1000);
    this.scaleX = 1.0 + intensity;
    this.scaleY = 1.0 - intensity;
  }
}
