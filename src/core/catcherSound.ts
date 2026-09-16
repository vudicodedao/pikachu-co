// Hệ thống âm thanh & Nhạc nền độc lập cho game Phuong Catcher (Siêu nhân hứng bạn gái)
class CatcherSoundEngine {
  private ctx: AudioContext | null = null;
  public sfxEnabled: boolean = true;
  private bgmAudio: HTMLAudioElement | null = null;
  public bgmEnabled: boolean = true;
  public bgmVolume: number = 0.45;

  constructor() {
    try {
      this.bgmAudio = new Audio('./bgm.mp3');
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = this.bgmVolume;
    } catch {
      this.bgmAudio = null;
    }
  }

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

  startBgm() {
    if (!this.bgmAudio || !this.bgmEnabled) return;
    this.bgmAudio.volume = this.bgmVolume;
    this.bgmAudio.play().catch(() => {});
  }

  stopBgm() {
    if (!this.bgmAudio) return;
    this.bgmAudio.pause();
    this.bgmAudio.currentTime = 0;
  }

  setBgmEnabled(enabled: boolean) {
    this.bgmEnabled = enabled;
    if (enabled) {
      this.startBgm();
    } else {
      if (this.bgmAudio) {
        this.bgmAudio.pause();
      }
    }
  }

  setBgmVolume(volume: number) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.bgmVolume;
    }
  }

  // Âm thanh hứng được ảnh bạn gái (Ding vui tươi)
  playCatch(comboMultiplier = 1) {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Tần số tăng nhẹ theo combo để kích thích thính giác
    const baseFreq = Math.min(1200, 523.25 + (comboMultiplier - 1) * 35); // C5 upwards
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Âm thanh hứng Trái Tim Vàng (Hợp âm ngọt ngào)
  playHeart() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const freqs = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const startTime = this.ctx.currentTime + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.22);
    });
  }

  // Âm thanh ăn Nam Châm Tình Yêu (Hiệu ứng từ trường vút lên)
  playPowerup() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.28);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Âm thanh va phải tia sét / chướng ngại vật (Sốc điện / va đập)
  playHit() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Âm thanh Thăng hạng / Wave tiếp theo
  playLevelUp() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const startTime = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.28, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  // Âm thanh Thua cuộc (Game Over)
  playGameOver() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [440, 392, 349.23, 293.66]; // A4, G4, F4, D4
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const startTime = this.ctx.currentTime + idx * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }
}

export const catcherSound = new CatcherSoundEngine();
