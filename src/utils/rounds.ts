import type { Match, Round } from '../types';

/** All rounds of the tournament, in chronological order. */
export const ROUNDS: Round[] = [
  'Fecha 1',
  'Fecha 2',
  'Fecha 3',
  'Dieciseisavos de Final',
  'Octavos de Final',
  'Cuartos de Final',
  'Semifinales',
  'Final',
];

/**
 * Maps TheSportsDB's `intRound` for league id 4429 (FIFA World Cup) to our
 * Round labels. Rounds 1-3 are the group stage matchdays. TheSportsDB uses the
 * number of remaining teams in the tournament as the round number for the
 * knockout stage (confirmed: 32 = Round of 32 / Dieciseisavos de Final).
 * The Final round number is TBD and will be added once TheSportsDB publishes it.
 */
const API_ROUND_MAP: Record<string, Round> = {
  '1': 'Fecha 1',
  '2': 'Fecha 2',
  '3': 'Fecha 3',
  '32': 'Dieciseisavos de Final',
  '16': 'Octavos de Final',
  '8': 'Cuartos de Final',
  '4': 'Semifinales',
};

export function mapApiRound(intRound: string): Round | null {
  return API_ROUND_MAP[intRound] ?? null;
}

/**
 * Picks which round should be selected by default: the earliest round that
 * still has a match without an official result, or the last round that has
 * any matches at all if everything is finished.
 */
export function getDefaultRound(matches: Match[]): Round {
  const roundsWithMatches = ROUNDS.filter((r) => matches.some((m) => m.round === r));
  if (roundsWithMatches.length === 0) return ROUNDS[0];

  for (const round of roundsWithMatches) {
    if (matches.some((m) => m.round === round && m.result == null)) return round;
  }

  return roundsWithMatches[roundsWithMatches.length - 1];
}
