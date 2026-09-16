// Hệ thống âm thanh & Nhạc nền độc lập cho game Phuong Memory (Lật bài)
class MemorySoundEngine {
  private ctx: AudioContext | null = null;
  public sfxEnabled: boolean = true;
  private bgmAudio: HTMLAudioElement | null = null;
  public bgmEnabled: boolean = true;
  public bgmVolume: number = 0.5;

  constructor() {
    // Khởi tạo audio element cho nhạc nền
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

  // Quản lý nhạc nền BGM
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

  // SFX: Tiếng lật lá bài
  playFlip() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.05);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // SFX: Tiếng ghép đúng 1 cặp (Chime)
  playMatch() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + idx * 0.04;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.15);
    });
  }

  // SFX: Tiếng lật sai
  playMismatch() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // SFX: Tiếng hoàn thành màn (Stage Clear)
  playStageClear() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.25);
    });
  }

  // SFX: Hết giờ Game Over
  playGameOver() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [440, 415.3, 392, 349.23];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + idx * 0.12;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.2);
    });
  }
}

export const memorySound = new MemorySoundEngine();
