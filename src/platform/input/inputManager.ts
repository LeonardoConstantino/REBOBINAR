import { InputFrame } from '../../core/types';
import { KeyboardSource } from './keyboardSource';
import { GamepadSource } from './gamepadSource';
import { touchPadSource, TouchPadSource } from './touchPadSource';

export class InputManager {
  private keyboard = new KeyboardSource();
  private gamepad = new GamepadSource();
  touch = touchPadSource;

  private currentFrame: InputFrame = { buttons: 0, axisX: 0 };

  poll(): InputFrame {
    this.currentFrame.buttons = 0;
    this.currentFrame.axisX = 0;

    this.keyboard.poll(this.currentFrame);
    this.gamepad.poll(this.currentFrame);
    this.touch.poll(this.currentFrame);

    return this.currentFrame;
  }

  destroy(): void {
    this.keyboard.destroy();
  }
}

export const inputManager = new InputManager();
