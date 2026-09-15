// Quản lý nhạc nền Background Music
class BGMController {
  private audio: HTMLAudioElement | null = null;
  private isInitialized = false;
  public enabled = true;
  public volume = 0.5;

  private init() {
    if (this.isInitialized && this.audio) return;
    const baseUrl = import.meta.env.BASE_URL || './';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    this.audio = new Audio(`${cleanBase}bgm.mp3`);
    this.audio.loop = true;
    this.audio.volume = this.volume;
    this.isInitialized = true;
  }

  public play() {
    if (!this.enabled) return;
    this.init();
    if (!this.audio) return;
    this.audio.volume = this.volume;
    this.audio.play().catch(() => {
      // Trình duyệt có thể chặn autoplay khi chưa có tương tác
      const unlockAudio = () => {
        if (this.enabled && this.audio) {
          this.audio.play().catch(() => {});
        }
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('click', unlockAudio);
      window.addEventListener('keydown', unlockAudio);
    });
  }

  public pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  public setEnabled(enable: boolean) {
    this.enabled = enable;
    if (enable) {
      this.play();
    } else {
      this.pause();
    }
  }
}

export const bgm = new BGMController();
