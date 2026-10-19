// Procedural Web Audio Sound Generator for Wizard Chess
// Zero external asset downloads - operates cleanly offline and on mobile browsers

class ChessSoundSystem {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Lazy AudioContext initialization on first user interaction
    try {
      const stored = localStorage.getItem('wizard_chess_sound');
      if (stored !== null) {
        this.enabled = stored === 'true';
      }
    } catch {}
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enable: boolean) {
    this.enabled = enable;
    try {
      localStorage.setItem('wizard_chess_sound', String(enable));
    } catch {}
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  // Calm stone sliding swoosh for non-capture moves
  public playMove() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.16);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.20);
  }

  // Heavy stone placement tap/thud
  public playPlacement() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Stone shatter impact and debris crunch for captures
  public playCapture() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;

    // 1. Heavy low impact thud
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.22);
    oscGain.gain.setValueAtTime(0.25, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.26);

    // 2. White noise burst for stone shatter
    const bufferSize = ctx.sampleRate * 0.24;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(800, t);
    noiseFilter.Q.setValueAtTime(1.8, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.20, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);
  }

  // Harmonic cathedral chime for King in Check
  public playCheck() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    [440, 554.37, 659.25].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0.001, t + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.08, t + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.60);
    });
  }

  // Resonant minor Sanctum chord for Checkmate / Game End
  public playCheckmate() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const freqs = [146.83, 220, 261.63, 329.63, 440];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.10, t + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 1.45);
    });
  }

  // Gentle UI button click
  public playClick() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }
}

export const sound = new ChessSoundSystem();
