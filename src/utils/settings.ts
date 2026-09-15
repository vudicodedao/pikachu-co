import { GameSettings } from '../types/game';

const SETTINGS_STORAGE_KEY = 'pikachu_couple_settings';

export const DEFAULT_SETTINGS: GameSettings = {
  stageTimeSeconds: 600, // 10 phút mặc định
  hintsCount: 10,        // min 5, max 20
  shufflesCount: 10,     // min 5, max 20
  bgmVolume: 0.5,
  bgmEnabled: true,
  sfxEnabled: true,
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      stageTimeSeconds: Math.max(60, Number(parsed.stageTimeSeconds) || 600),
      hintsCount: Math.max(5, Math.min(20, Number(parsed.hintsCount) || 10)),
      shufflesCount: Math.max(5, Math.min(20, Number(parsed.shufflesCount) || 10)),
      bgmVolume: typeof parsed.bgmVolume === 'number' ? Math.max(0, Math.min(1, parsed.bgmVolume)) : 0.5,
      bgmEnabled: typeof parsed.bgmEnabled === 'boolean' ? parsed.bgmEnabled : true,
      sfxEnabled: typeof parsed.sfxEnabled === 'boolean' ? parsed.sfxEnabled : true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    const safeSettings: GameSettings = {
      ...settings,
      hintsCount: Math.max(5, Math.min(20, settings.hintsCount)),
      shufflesCount: Math.max(5, Math.min(20, settings.shufflesCount)),
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(safeSettings));
  } catch {
    // ignore
  }
}
