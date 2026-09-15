import { LeaderboardEntry } from '../types/game';

const LEADERBOARD_STORAGE_KEY = 'pikachu_couple_leaderboard';
const MAX_LEADERBOARD_ENTRIES = 20;

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as LeaderboardEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveLeaderboardEntry(entry: Omit<LeaderboardEntry, 'id' | 'date'>): LeaderboardEntry[] {
  try {
    const current = getLeaderboard();
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

    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearLeaderboard(): void {
  try {
    localStorage.removeItem(LEADERBOARD_STORAGE_KEY);
  } catch {
    // ignore
  }
}
