import type { ChampionPick, Match, MatchResult, Prediction } from '../types';
import { calculatePoints } from './scoring';

export interface LeaderboardEntry {
  uid: string;
  name: string;
  photoURL: string;
  totalPoints: number;
  /** Points the user's predictions for currently in-progress matches would earn right now. Already included in `totalPoints`. */
  livePoints?: number;
}

export interface RankedUser extends LeaderboardEntry {
  rank: number;
  prize: number;
}

/** Bonus points a finalists pick is worth: `bonus` for each picked team that's an official finalist. */
export function getChampionPoints(
  pick: Pick<ChampionPick, 'teams'> | null | undefined,
  finalists: string[] | null,
  bonus: number
): number {
  if (finalists == null || !pick?.teams) return 0;
  const correct = pick.teams.filter((team) => finalists.includes(team)).length;
  return correct * bonus;
}

/**
 * For matches currently in progress (have a `liveScore` and no official
 * `result` yet), sums up the points each user's prediction would earn right
 * now if the match ended with that score.
 */
export function getLivePointsByUid(
  liveMatches: Pick<Match, 'id' | 'liveScore'>[],
  predictions: Prediction[]
): Record<string, number> {
  const liveScoreByMatchId = new Map<string, MatchResult>();
  for (const m of liveMatches) {
    if (m.liveScore != null) liveScoreByMatchId.set(m.id, m.liveScore);
  }

  const livePointsByUid: Record<string, number> = {};
  for (const p of predictions) {
    if (p.points != null) continue;
    const liveScore = liveScoreByMatchId.get(p.matchId);
    if (!liveScore) continue;
    livePointsByUid[p.uid] = (livePointsByUid[p.uid] ?? 0) + calculatePoints(p, liveScore);
  }
  return livePointsByUid;
}

/** Combines each user's prediction points with their (on-the-fly) finalists bonus and live partial points. */
export function buildLeaderboardEntries(
  users: { uid: string; name: string; photoURL: string; predictionPoints: number }[],
  picksByUid: Record<string, ChampionPick>,
  finalists: string[] | null,
  championBonus: number,
  livePointsByUid: Record<string, number> = {}
): LeaderboardEntry[] {
  return users.map((u) => {
    const livePoints = livePointsByUid[u.uid] ?? 0;
    return {
      uid: u.uid,
      name: u.name,
      photoURL: u.photoURL,
      totalPoints: u.predictionPoints + getChampionPoints(picksByUid[u.uid], finalists, championBonus) + livePoints,
      livePoints,
    };
  });
}

export function calculateWinners(
  entries: LeaderboardEntry[],
  prizes: { prizePool: number; distribution: number[] }
): RankedUser[] {
  const sorted = [...entries].sort((a, b) => b.totalPoints - a.totalPoints);
  return sorted.map((u, i) => {
    const pct = prizes.distribution[i] ?? 0;
    const prize = Math.round(((prizes.prizePool * pct) / 100) * 100) / 100;
    return { ...u, rank: i + 1, prize };
  });
}

export const DISTRIBUTION_PRESETS: { label: string; values: number[] }[] = [
  { label: '70% / 30% (2 puestos)', values: [70, 30] },
  { label: '50% / 30% / 20% (3 puestos)', values: [50, 30, 20] },
  { label: '60% / 25% / 15% (3 puestos)', values: [60, 25, 15] },
];
