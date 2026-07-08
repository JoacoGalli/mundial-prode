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
 * Round labels. Rounds 1-3 are the group stage matchdays. TheSportsDB used the
 * number of remaining teams in the tournament as the round number up through
 * Octavos de Final (32 = Round of 32, 16 = Round of 16), but broke that
 * pattern for Cuartos de Final — it published those under intRound "125"
 * instead of the expected "8". Since we can't predict whether Semifinales/
 * Final will keep using sequential IDs like this or revert to the old
 * pattern, `mapApiRound` falls back to the fixed FIFA 2026 knockout calendar
 * (see `KNOCKOUT_ROUND_DATE_RANGES`) whenever the intRound isn't recognized.
 */
const API_ROUND_MAP: Record<string, Round> = {
  '1': 'Fecha 1',
  '2': 'Fecha 2',
  '3': 'Fecha 3',
  '32': 'Dieciseisavos de Final',
  '16': 'Octavos de Final',
  '8': 'Cuartos de Final',
  '125': 'Cuartos de Final',
  '4': 'Semifinales',
};

/** Fixed FIFA World Cup 2026 knockout-stage windows (all dates UTC, inclusive). */
const KNOCKOUT_ROUND_DATE_RANGES: { round: Round; start: string; end: string }[] = [
  { round: 'Dieciseisavos de Final', start: '2026-06-28', end: '2026-07-03' },
  { round: 'Octavos de Final', start: '2026-07-04', end: '2026-07-08' },
  { round: 'Cuartos de Final', start: '2026-07-09', end: '2026-07-12' },
  { round: 'Semifinales', start: '2026-07-13', end: '2026-07-16' },
  { round: 'Final', start: '2026-07-17', end: '2026-07-20' },
];

function mapRoundByDate(dateISO: string): Round | null {
  const match = KNOCKOUT_ROUND_DATE_RANGES.find(
    ({ start, end }) => dateISO >= start && dateISO <= end
  );
  return match?.round ?? null;
}

export function mapApiRound(intRound: string, dateISO?: string): Round | null {
  return API_ROUND_MAP[intRound] ?? (dateISO ? mapRoundByDate(dateISO) : null);
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
