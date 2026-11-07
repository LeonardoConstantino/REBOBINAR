import { Btn, InputFrame } from '../../core/types';

export class KeyboardSource {
  private pressedKeys = new Set<string>();

  constructor() {
    this.attach();
  }

  private attach(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', this.handleKeyDown, { capture: true, passive: false });
    window.addEventListener('keyup', this.handleKeyUp, { capture: true, passive: false });
    document.addEventListener('keydown', this.handleKeyDown, { capture: true, passive: false });
    document.addEventListener('keyup', this.handleKeyUp, { capture: true, passive: false });

    window.addEventListener('blur', this.handleBlur);
  }

  private handleBlur = (): void => {
    this.pressedKeys.clear();
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const code = (e.code || '').toLowerCase();
    const key = (e.key || '').toLowerCase();

    // Prevent default browser scroll on arrow keys and space
    if (
      code === 'space' ||
      key === ' ' ||
      code.startsWith('arrow') ||
      ['left', 'right', 'up', 'down'].includes(key)
    ) {
      e.preventDefault();
    }

    if (code) this.pressedKeys.add(code);
    if (key) this.pressedKeys.add(key);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    const code = (e.code || '').toLowerCase();
    const key = (e.key || '').toLowerCase();

    if (code) this.pressedKeys.delete(code);
    if (key) this.pressedKeys.delete(key);
  };

  poll(out: InputFrame): void {
    let axisX = 0;
    let buttons = 0;

    const has = (...keys: string[]): boolean =>
      keys.some((k) => this.pressedKeys.has(k.toLowerCase()));

    // Horizontal axis: A / D or Left / Right arrows
    if (has('keya', 'arrowleft', 'a', 'left')) {
      axisX -= 1;
    }
    if (has('keyd', 'arrowright', 'd', 'right')) {
      axisX += 1;
    }

    // Jump: Space, W, Up Arrow
    if (has('space', ' ', 'keyw', 'arrowup', 'w', 'up')) {
      buttons |= Btn.Jump;
    }

    // Dash: Shift or K
    if (has('shiftleft', 'shiftright', 'shift', 'keyk', 'k')) {
      buttons |= Btn.Dash;
    }

    // Item (Power-up): J or E
    if (has('keyj', 'j', 'keye', 'e')) {
      buttons |= Btn.Item;
    }

    // Retake: R
    if (has('keyr', 'r')) {
      buttons |= Btn.Retake;
    }

    // Pause: Escape or P
    if (has('escape', 'esc', 'keyp', 'p')) {
      buttons |= Btn.Pause;
    }

    out.axisX = Math.max(-1, Math.min(1, axisX));
    out.buttons |= buttons;
  }

  destroy(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.handleKeyDown, { capture: true });
    window.removeEventListener('keyup', this.handleKeyUp, { capture: true });
    document.removeEventListener('keydown', this.handleKeyDown, { capture: true });
    document.removeEventListener('keyup', this.handleKeyUp, { capture: true });
    window.removeEventListener('blur', this.handleBlur);
    this.pressedKeys.clear();
  }
}
