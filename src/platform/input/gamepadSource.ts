import { Btn, InputFrame } from '../../core/types';

export class GamepadSource {
  poll(out: InputFrame): void {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (!gamepads) return;

    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp || !gp.connected) continue;

      // Analog stick X or D-Pad
      let stickX = gp.axes[0] || 0;
      if (Math.abs(stickX) < 0.15) stickX = 0; // deadzone

      if (gp.buttons[14]?.pressed) stickX = -1; // D-pad left
      if (gp.buttons[15]?.pressed) stickX = 1; // D-pad right

      if (stickX !== 0) {
        out.axisX = Math.max(-1, Math.min(1, out.axisX + stickX));
      }

      // Buttons
      if (gp.buttons[0]?.pressed) out.buttons |= Btn.Jump; // A button
      if (gp.buttons[2]?.pressed) out.buttons |= Btn.Dash; // X button
      if (gp.buttons[3]?.pressed) out.buttons |= Btn.Item; // Y button
      if (gp.buttons[4]?.pressed || gp.buttons[6]?.pressed) out.buttons |= Btn.Retake; // LB / LT
      if (gp.buttons[9]?.pressed) out.buttons |= Btn.Pause; // Start

      break; // Primary gamepad
    }
  }
}
