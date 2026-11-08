import { eventBus } from '../../core/eventbus';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private projectorOsc: OscillatorNode | null = null;
  private projectorGain: GainNode | null = null;
  private projectorFilter: BiquadFilterNode | null = null;
  private projectorInterval: number | null = null;
  private currentPressure: number = 0;
  private isSilenceActive: boolean = false;

  init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.startProjectorAmbient();
      this.bindEvents();
    } catch {
      // Audio not supported or blocked
    }
  }

  setVolume(vol: number): void {
    if (!this.masterGain || !this.ctx) return;
    this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
  }

  setMute(mute: boolean): void {
    this.isMuted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(mute ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  private startProjectorAmbient(): void {
    if (!this.ctx || !this.masterGain) return;

    // Projector rhythmic shutter click loop
    let clickTime = 0;
    const playClick = () => {
      if (!this.ctx || !this.masterGain || this.isMuted || this.isSilenceActive) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Faster projector cadence with pressure (from 160ms down to 70ms)
      const baseFreq = 120 + this.currentPressure * 160;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.03);

      const clickVolume = 0.08 + this.currentPressure * 0.08;
      gain.gain.setValueAtTime(clickVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    };

    const scheduleLoop = () => {
      playClick();
      const intervalMs = Math.max(65, 150 - this.currentPressure * 85);
      this.projectorInterval = window.setTimeout(scheduleLoop, intervalMs);
    };

    scheduleLoop();
  }

  private bindEvents(): void {
    eventBus.on('player:jump', () => this.playJump());
    eventBus.on('player:dash', () => this.playDash());
    eventBus.on('player:land', () => this.playLand());
    eventBus.on('player:stomp', () => this.playFilmGateSnap());
    eventBus.on('player:died', () => this.playDeath());
    eventBus.on('player:retake', () => this.playRetake());
    eventBus.on('rewind:started', () => this.playRewindWhoosh());
    eventBus.on('keyframe:crossed', () => this.playKeyframeBell());
    eventBus.on('powerup:collected', () => this.playPowerup());
    eventBus.on('pressure:updated', ({ pressure }) => {
      this.currentPressure = pressure;
    });
    eventBus.on('record:broken', () => this.triggerRecordSilence());
  }

  private triggerRecordSilence(): void {
    // GDD 15.3: Brief silence upon breaking personal record
    this.isSilenceActive = true;
    setTimeout(() => {
      this.isSilenceActive = false;
    }, 600);
  }

  private playJump(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  private playDash(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(500, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  private playLand(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  private playDeath(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    // Clapper snap + low pitch drop
    const snap = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();

    snap.type = 'square';
    snap.frequency.setValueAtTime(800, this.ctx.currentTime);
    snap.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.25);

    snapGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    snapGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    snap.connect(snapGain);
    snapGain.connect(this.masterGain);

    snap.start();
    snap.stop(this.ctx.currentTime + 0.26);
  }

  private playRetake(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.21);
  }

  private playRewindWhoosh(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(750, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.46);
  }

  private playKeyframeBell(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5 chime
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.65);
  }

  private playPowerup(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.17);
  }

  // --- Title Screen "A ÚLTIMA SESSÃO" Sound Effects ---

  playSwitchClick(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.045);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playFilmGateSnap(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playFilmGlitchCut(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  playTitleReadyChime(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5 warm chime
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.36);
  }

  playStartButtonPress(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    // Firm clapper clap + low motor surge
    const clap = this.ctx.createOscillator();
    const clapGain = this.ctx.createGain();

    clap.type = 'square';
    clap.frequency.setValueAtTime(950, this.ctx.currentTime);
    clap.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.12);

    clapGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    clapGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

    clap.connect(clapGain);
    clapGain.connect(this.masterGain);

    clap.start();
    clap.stop(this.ctx.currentTime + 0.15);
  }
}

export const audioEngine = new AudioEngine();
