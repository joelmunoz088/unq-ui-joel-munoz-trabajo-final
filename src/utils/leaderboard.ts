export interface LeaderboardEntry {
  id: string;
  score: number;
  wordsCount: number;
  date: string;
}

const STORAGE_KEY = 'palabras_encadenadas_top10';

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveScoreToLeaderboard(
  score: number,
  wordsCount: number
): LeaderboardEntry[] {
  if (score <= 0) return getLeaderboard();

  const current = getLeaderboard();
  const now = new Date();
  const formattedDate = now.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const newEntry: LeaderboardEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    score,
    wordsCount,
    date: formattedDate,
  };

  const updated = [...current, newEntry]
    .sort((a, b) => b.score - a.score || b.wordsCount - a.wordsCount)
    .slice(0, 10);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignorar errores de cuota de almacenamiento
  }

  return updated;
}