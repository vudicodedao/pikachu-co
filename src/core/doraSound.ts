// Retro Web Audio synthesizer for DoraJump (Doraemon Vertical Jump)
class DoraSoundEngine {
  private ctx: AudioContext | null = null;
  public sfxEnabled: boolean = true;
  public bgmEnabled: boolean = true;
  public bgmVolume: number = 0.35;

  private bgmIntervalId: number | null = null;
  private bgmStep: number = 0;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Tiếng nhún nhảy bình thường (Boing)
  playJump() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Tiếng lò xo / Bánh đà nảy siêu cao
  playSpring() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.22);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Tiếng lụm Bánh rán Dorayaki (Chime may mắn)
  playDorayaki() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const startTime = this.ctx!.currentTime + idx * 0.05;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.12);
    });
  }

  // Tiếng Chong chóng tre siêu tốc (Rocket Copter Whoosh)
  playBoost() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.45);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Tiếng Cánh cửa thần kỳ (Warp Portal)
  playDoorWarp() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const freqs = [392, 587.33, 783.99, 1174.66];
    freqs.forEach((freq, idx) => {
      const t = this.ctx!.currentTime + idx * 0.07;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  // Tiếng Đèn pin thu nhỏ (Laser Zap)
  playSmallLight() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.18);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Tiếng Rơi xuống vực (Fall down)
  playFall() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.5);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  // Nhạc nền BGM vui tươi phong cách hoạt hình Doraemon
  startBgm() {
    if (this.bgmIntervalId !== null) return;
    this.initCtx();

    // Giai điệu Doraemon vui nhộn (C - D - E - G - A)
    const melody = [
      523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 523.25, 0,
      523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 0,
      880.0, 783.99, 659.25, 587.33, 523.25, 659.25, 587.33, 0,
      523.25, 587.33, 523.25, 392.0, 440.0, 493.88, 523.25, 0,
    ];

    this.bgmStep = 0;
    this.bgmIntervalId = window.setInterval(() => {
      if (!this.bgmEnabled || !this.ctx || this.ctx.state === 'suspended') return;

      const freq = melody[this.bgmStep];
      this.bgmStep = (this.bgmStep + 1) % melody.length;

      if (freq > 0) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(this.bgmVolume * 0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.19);
      }
    }, 210);
  }

  stopBgm() {
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }

  setBgmEnabled(val: boolean) {
    this.bgmEnabled = val;
    if (!val) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
  }

  setBgmVolume(vol: number) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
  }
}

export const doraSound = new DoraSoundEngine();
