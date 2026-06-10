import type { Match } from '../types';

/** All distinct team names that appear across the loaded fixture, sorted alphabetically. */
export function getAllTeams(matches: Match[]): string[] {
  const teams = new Set<string>();
  matches.forEach((m) => {
    teams.add(m.teamA);
    teams.add(m.teamB);
  });
  return [...teams].sort((a, b) => a.localeCompare(b, 'es'));
}
