import type { AppSettings, UserProfile } from '../types';

export interface RankedUser extends UserProfile {
  rank: number;
  prize: number;
}

export function calculateWinners(users: UserProfile[], settings: AppSettings): RankedUser[] {
  const sorted = [...users].sort((a, b) => b.totalPoints - a.totalPoints);
  return sorted.map((u, i) => {
    const pct = settings.distribution[i] ?? 0;
    const prize = Math.round(((settings.prizePool * pct) / 100) * 100) / 100;
    return { ...u, rank: i + 1, prize };
  });
}

export const DISTRIBUTION_PRESETS: { label: string; values: number[] }[] = [
  { label: '70% / 30% (2 puestos)', values: [70, 30] },
  { label: '50% / 30% / 20% (3 puestos)', values: [50, 30, 20] },
  { label: '60% / 25% / 15% (3 puestos)', values: [60, 25, 15] },
];
