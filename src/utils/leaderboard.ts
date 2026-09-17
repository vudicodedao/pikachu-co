import { LeaderboardEntry } from '../types/game';

export const PIKACHU_LEADERBOARD_KEY = 'pikachu_couple_leaderboard';
export const MEMORY_LEADERBOARD_KEY = 'memory_couple_leaderboard';
export const CATCHER_LEADERBOARD_KEY = 'catcher_couple_leaderboard';
export const DORAJUMP_LEADERBOARD_KEY = 'dorajump_couple_leaderboard';

const MAX_LEADERBOARD_ENTRIES = 20;

export function getLeaderboard(storageKey = PIKACHU_LEADERBOARD_KEY): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const list = JSON.parse(raw) as LeaderboardEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveLeaderboardEntry(
  entry: Omit<LeaderboardEntry, 'id' | 'date'>,
  storageKey = PIKACHU_LEADERBOARD_KEY
): LeaderboardEntry[] {
  try {
    const current = getLeaderboard(storageKey);
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const updated = [...current, newEntry]
      .sort((a, b) => b.score - a.score || b.stageReached - a.stageReached)
      .slice(0, MAX_LEADERBOARD_ENTRIES);

    localStorage.setItem(storageKey, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearLeaderboard(storageKey = PIKACHU_LEADERBOARD_KEY): void {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}
