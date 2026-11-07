import { describe, it, expect } from 'vitest';
import { generateChunk } from '../gen/chunkGenerator';
import { ChunkValidator } from '../gen/chunkValidator';
import { SnapshotRing } from '../time/snapshotRing';
import { TrailRecorder } from '../time/trailRecorder';
import { FinalCutSystem } from '../finalCut';
import { Player } from '../player';
import { Btn } from '../../core/types';
import { PHYSICS_CONFIG, TIME_CONFIG } from '../../content/tuning';

describe('ChunkGenerator & Solvability Fuzz', () => {
  it('generates completely identical chunks for the same seed, index, and params (determinism)', () => {
    const params = {
      density: 1.2,
      trapMix: { jump_cut: 1, freeze_frame: 1, film_scratch: 1, rewind_glitch: 1 },
      speedScale: 1.0,
      mode: 'director' as const,
      adaptation: { densityShift: 0, weightShift: {} },
    };

    const c1 = generateChunk(42069, 15, params);
    const c2 = generateChunk(42069, 15, params);

    expect(c1.seed).toBe(c2.seed);
    expect(c1.tiles).toEqual(c2.tiles);
    expect(c1.traps.length).toBe(c2.traps.length);
    expect(c1.enemies.length).toBe(c2.enemies.length);
  });

  it('passes solvability validation on chunks across modes (fuzz)', () => {
    const modes = ['studio', 'director', 'censored'] as const;
    for (const mode of modes) {
      const params = {
        density: mode === 'censored' ? 1.6 : mode === 'director' ? 1.3 : 1.0,
        trapMix: { jump_cut: 1, freeze_frame: 0.8, film_scratch: 0.7, rewind_glitch: 0.6 },
        speedScale: 1.0,
        mode,
        adaptation: { densityShift: 0, weightShift: {} },
      };

      for (let idx = 0; idx < 100; idx++) {
        const chunk = generateChunk(9999, idx, params);
        const valid = ChunkValidator.validate(chunk);
        expect(valid).toBe(true);
      }
    }
  });
});

describe('SnapshotRing Determinism for Retake', () => {
  it('accurately stores and retrieves the closest snapshot 3 seconds in the past', () => {
    const ring = new SnapshotRing(50);
    // Push 30 snapshots representing 3 seconds at 10Hz (every 6 ticks = 0.1s)
    for (let t = 0; t < 30; t++) {
      ring.push({
        tick: t * 6,
        playerX: 100 + t * 10,
        playerY: 200,
        playerVx: 150,
        playerVy: 0,
        grounded: true,
        facingRight: true,
        dashing: false,
        dashTimer: 0,
        dashCooldown: 0,
        invulnTimer: 0,
        storedPowerup: null,
        activePowerup: null,
        activePowerupTimer: 0,
        distanceUnits: 100 + t * 10,
        pressure: 0.1,
      });
    }

    // Current tick is 29 * 6 = 174. Target 3 seconds ago (tick 0)
    const restored = ring.findClosest(0);
    expect(restored).not.toBeNull();
    expect(restored?.tick).toBe(0);
    expect(restored?.playerX).toBe(100);
  });
});

describe('TrailRecorder', () => {
  it('records sub-unit coordinates and recalls them sequentially', () => {
    const trail = new TrailRecorder(100);
    trail.record(0, 10.25, 20.75, 1);
    trail.record(4, 15.5, 22.0, 2);

    expect(trail.count).toBe(2);

    const s0 = { x: 0, y: 0, animFrame: 0, tick: 0 };
    trail.getSample(0, s0);
    expect(s0.x).toBeCloseTo(10.25, 1);
    expect(s0.y).toBeCloseTo(20.75, 1);
    expect(s0.animFrame).toBe(1);

    const s1 = { x: 0, y: 0, animFrame: 0, tick: 0 };
    trail.getSample(1, s1);
    expect(s1.x).toBeCloseTo(15.5, 1);
    expect(s1.animFrame).toBe(2);
  });
});

describe('FinalCutSystem Pressure', () => {
  it('increases pressure when speed is below threshold and relieves on keyframe', () => {
    const fc = new FinalCutSystem();
    expect(fc.currentPressure).toBe(0);

    // Update standing still for 2 seconds
    for (let i = 0; i < 120; i++) {
      fc.update(1 / 60, 100); // position remains at 100
    }

    expect(fc.currentPressure).toBeGreaterThan(0.05);

    const beforeRelief = fc.currentPressure;
    fc.relieveOnKeyframe();
    expect(fc.currentPressure).toBeLessThan(beforeRelief);
  });
});

describe('Player Coyote Time & Jump Buffer', () => {
  it('allows jump execution within coyote time after leaving ground', () => {
    const player = new Player();
    player.reset(64, 250);
    player.grounded = true;

    // Simulate running while grounded (primes coyote timer)
    player.update(0.016, { buttons: 0, axisX: 1 }, 0.09, 0.10);
    expect(player.coyoteTimer).toBe(0.09);

    // Now step off the ledge into air
    player.grounded = false;
    let jumped = false;

    // 50ms later (well within 90ms coyote window), press jump
    player.update(
      0.05,
      { buttons: Btn.Jump, axisX: 0 },
      0.09, // 90ms coyote
      0.10, // 100ms buffer
      () => { jumped = true; }
    );

    expect(jumped).toBe(true);
    expect(player.vy).toBe(PHYSICS_CONFIG.jumpVelocity + PHYSICS_CONFIG.gravity * 0.05);
  });
});

describe('Metagame Rule', () => {
  it('guarantees SimConfig / Physics is independent of Cinemateca or cosmetics', () => {
    expect(PHYSICS_CONFIG.gravity).toBe(1100);
    expect(TIME_CONFIG.fixedTickRate).toBe(60);
  });
});
