import { AnimState, Drawable, DrawableProvider } from './drawable';

class PlayerDrawable implements Drawable {
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, state: AnimState = {}): void {
    const scaleX = state.scaleX ?? 1.0;
    const scaleY = state.scaleY ?? 1.0;
    const facingRight = state.facingRight ?? true;
    const isInvuln = state.isInvulnerable ?? false;
    const isDashing = state.isDashing ?? false;
    const frame = state.frame ?? 0;

    if (isInvuln && Math.floor(Date.now() / 60) % 2 === 0) {
      return; // Flash effect during invulnerability
    }

    ctx.save();
    ctx.translate(x + 7, y + 22); // Pivot at bottom center
    ctx.scale((facingRight ? 1 : -1) * scaleX, scaleY);

    // Ghost dash trail if dashing
    if (isDashing) {
      ctx.fillStyle = 'rgba(66, 191, 194, 0.4)';
      ctx.fillRect(-12, -24, 18, 22);
    }

    // Body: Dark studio coat / silhouette (#17191D with #E8DFC9 accents)
    ctx.fillStyle = '#17191D';
    ctx.strokeStyle = '#E8DFC9';
    ctx.lineWidth = 1.5;

    // Torso / coat
    ctx.beginPath();
    ctx.roundRect(-6, -20, 12, 14, [3, 3, 1, 1]);
    ctx.fill();
    ctx.stroke();

    // Viewfinder / director headband on head
    ctx.fillStyle = '#D69A45'; // Amber
    ctx.fillRect(-5, -23, 10, 3);

    // Head
    ctx.fillStyle = '#E8DFC9'; // Ivory
    ctx.beginPath();
    ctx.arc(0, -18, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Eye / glasses (viewfinder lens)
    ctx.fillStyle = '#17191D';
    ctx.fillRect(facingRight ? 1 : -3, -19, 2.5, 2.5);

    // Scarf / Film strip tail flapping behind
    ctx.fillStyle = '#D94B43'; // Red of REC
    const scarfOffset = frame === 1 ? -2 : frame === 2 ? 2 : 0;
    ctx.beginPath();
    ctx.moveTo(-4, -16);
    ctx.lineTo(-11, -14 + scarfOffset);
    ctx.lineTo(-10, -11 + scarfOffset);
    ctx.lineTo(-4, -13);
    ctx.closePath();
    ctx.fill();

    // Legs: animated run cycle
    ctx.strokeStyle = '#E8DFC9';
    ctx.lineWidth = 2;
    if (frame === 1) {
      // Leg 1 forward, Leg 2 back
      ctx.beginPath();
      ctx.moveTo(-2, -6);
      ctx.lineTo(4, 0);
      ctx.moveTo(2, -6);
      ctx.lineTo(-4, -2);
      ctx.stroke();
    } else if (frame === 2) {
      // Leg 2 forward, Leg 1 back
      ctx.beginPath();
      ctx.moveTo(-2, -6);
      ctx.lineTo(-5, -1);
      ctx.moveTo(2, -6);
      ctx.lineTo(4, -1);
      ctx.stroke();
    } else if (frame === 3 || frame === 4) {
      // Jump / Fall tuck
      ctx.beginPath();
      ctx.moveTo(-3, -6);
      ctx.lineTo(-1, -1);
      ctx.moveTo(3, -6);
      ctx.lineTo(3, -2);
      ctx.stroke();
    } else {
      // Idle standing
      ctx.beginPath();
      ctx.moveTo(-3, -6);
      ctx.lineTo(-3, 0);
      ctx.moveTo(3, -6);
      ctx.lineTo(3, 0);
      ctx.stroke();
    }

    ctx.restore();
  }
}

class RebelExtraDrawable implements Drawable {
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, state: AnimState = {}): void {
    const facingRight = state.facingRight ?? true;
    ctx.save();
    ctx.translate(x + 8, y + 22);
    ctx.scale(facingRight ? 1 : -1, 1);

    // Striped costume (unruly extra)
    ctx.fillStyle = '#D94B43';
    ctx.fillRect(-7, -20, 14, 14);
    ctx.fillStyle = '#E8DFC9';
    ctx.fillRect(-7, -17, 14, 3);
    ctx.fillRect(-7, -11, 14, 3);

    // Head with rebellious sunglasses
    ctx.fillStyle = '#E8DFC9';
    ctx.beginPath();
    ctx.arc(0, -18, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#17191D';
    ctx.fillRect(0, -19, 5, 2.5); // Shades

    // Holding small clapperboard
    ctx.fillStyle = '#17191D';
    ctx.fillRect(5, -15, 8, 6);
    ctx.fillStyle = '#D69A45';
    ctx.fillRect(5, -17, 8, 2);

    ctx.restore();
  }
}

class GhostDoubleDrawable implements Drawable {
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, state: AnimState = {}): void {
    ctx.save();
    ctx.translate(x + 7, y + 22);

    // Chromatic double-exposure silhouette
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = '#42BFC2'; // Cyan ghost
    ctx.fillRect(-7, -21, 12, 19);

    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#8068B8'; // Violet offset
    ctx.fillRect(-4, -19, 12, 19);

    ctx.globalAlpha = 1.0;
    ctx.restore();
  }
}

class ClapperDeathMarkDrawable implements Drawable {
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, state: AnimState = {}): void {
    const count = state.count ?? 1;
    // Log2 scaling as required by GDD Section 7.2
    const scale = Math.min(1.6, 0.9 + Math.log2(count) * 0.15);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Clapperboard body
    ctx.fillStyle = '#17191D';
    ctx.strokeStyle = '#D69A45';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-12, -18, 24, 18);
    ctx.strokeRect(-12, -18, 24, 18);

    // Top striped clapper stick (slightly cracked open)
    ctx.save();
    ctx.rotate(-0.15);
    ctx.fillStyle = '#E8DFC9';
    ctx.fillRect(-12, -23, 24, 5);
    ctx.fillStyle = '#17191D';
    ctx.fillRect(-9, -23, 4, 5);
    ctx.fillRect(-1, -23, 4, 5);
    ctx.fillRect(7, -23, 4, 5);
    ctx.restore();

    // Crack line down the board
    ctx.strokeStyle = '#D94B43';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-2, -9);
    ctx.lineTo(3, -4);
    ctx.lineTo(1, 0);
    ctx.stroke();

    // Text: "TOMADA ×N"
    ctx.fillStyle = '#E8DFC9';
    ctx.font = 'bold 7px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`×${count}`, 0, -5);

    ctx.restore();
  }
}

class KeyframeGateDrawable implements Drawable {
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, state: AnimState = {}): void {
    const text = state.text || 'CENA';

    ctx.save();
    ctx.translate(x, y);

    // Archway posts with film sprockets
    ctx.fillStyle = '#2A2E35';
    ctx.fillRect(-8, -120, 16, 120);

    // Film perforations down the post
    ctx.fillStyle = '#17191D';
    for (let py = -115; py < 0; py += 12) {
      ctx.fillRect(-5, py, 10, 6);
    }

    // Overhead Banner with glowing red REC lamp
    ctx.fillStyle = '#17191D';
    ctx.strokeStyle = '#D69A45';
    ctx.lineWidth = 2;
    ctx.fillRect(-45, -145, 90, 26);
    ctx.strokeRect(-45, -145, 90, 26);

    // Blinking red REC dot
    const isBlink = Math.floor(Date.now() / 400) % 2 === 0;
    ctx.fillStyle = isBlink ? '#D94B43' : '#682220';
    ctx.beginPath();
    ctx.arc(-32, -132, 4, 0, Math.PI * 2);
    ctx.fill();

    // Text
    ctx.fillStyle = '#E8DFC9';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, 8, -128);

    ctx.restore();
  }
}

export class ProceduralProvider implements DrawableProvider {
  private player = new PlayerDrawable();
  private rebel = new RebelExtraDrawable();
  private ghost = new GhostDoubleDrawable();
  private clapper = new ClapperDeathMarkDrawable();
  private keyframe = new KeyframeGateDrawable();

  get(kind: string): Drawable {
    switch (kind) {
      case 'player':
        return this.player;
      case 'rebel_extra':
        return this.rebel;
      case 'ghost_double':
        return this.ghost;
      case 'clapper':
      case 'take_mark':
        return this.clapper;
      case 'keyframe':
        return this.keyframe;
      default:
        return this.player;
    }
  }
}
