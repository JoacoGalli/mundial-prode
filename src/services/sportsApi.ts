import type { MatchResult } from '../types';

const THESPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

interface TheSportsDbEvent {
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string;
}

/**
 * Look up the official result of a match on TheSportsDB by its event ID.
 * Returns null if the match hasn't finished yet (or has no score reported).
 */
export async function fetchEventResult(externalId: string): Promise<MatchResult | null> {
  const res = await fetch(`${THESPORTSDB_BASE}/lookupevent.php?id=${externalId}`);
  if (!res.ok) return null;

  const data = await res.json();
  const event = data?.events?.[0] as TheSportsDbEvent | undefined;
  if (!event) return null;

  if (event.intHomeScore == null || event.intAwayScore == null) return null;

  return {
    home: parseInt(event.intHomeScore, 10),
    away: parseInt(event.intAwayScore, 10),
  };
}
