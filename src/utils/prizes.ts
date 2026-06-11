import type { ChampionPick } from '../types';

export interface LeaderboardEntry {
  uid: string;
  name: string;
  photoURL: string;
  totalPoints: number;
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

/** Combines each user's prediction points with their (on-the-fly) finalists bonus. */
export function buildLeaderboardEntries(
  users: { uid: string; name: string; photoURL: string; predictionPoints: number }[],
  picksByUid: Record<string, ChampionPick>,
  finalists: string[] | null,
  championBonus: number
): LeaderboardEntry[] {
  return users.map((u) => ({
    uid: u.uid,
    name: u.name,
    photoURL: u.photoURL,
    totalPoints: u.predictionPoints + getChampionPoints(picksByUid[u.uid], finalists, championBonus),
  }));
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
