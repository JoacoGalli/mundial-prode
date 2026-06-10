import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToMatches, setMatchResult, syncFixtureFromApi } from '../services/matches';
import { fetchResultByDateAndTeams } from '../services/sportsApi';
import { isMatchLocked } from '../utils/format';
import type { Match } from '../types';

const SYNC_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * For admins: periodically (on load and every 2 hours while the app stays
 * open) checks matches that have already kicked off but have no official
 * result yet, looks them up on TheSportsDB by date + team names, and applies
 * the result automatically (which triggers point recalculation for
 * everyone). It also pulls in any newly-published fixtures (knockout
 * bracket) so the admin doesn't have to remember to do it manually.
 */
export function useAutoSyncResults() {
  const { isAdmin } = useAuth();
  const matchesRef = useRef<Match[]>([]);
  const found = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAdmin) return;

    const checkResults = async () => {
      for (const match of matchesRef.current) {
        if (match.result != null) continue;
        if (!match.apiTeamA || !match.apiTeamB) continue;
        if (!isMatchLocked(match)) continue;
        if (found.current.has(match.id)) continue;

        try {
          const dateISO = match.datetime.toDate().toISOString().slice(0, 10);
          const result = await fetchResultByDateAndTeams(dateISO, match.apiTeamA, match.apiTeamB);
          if (result) {
            found.current.add(match.id);
            await setMatchResult(match.id, result);
          }
        } catch {
          // try again next cycle
        }
      }
    };

    const unsubscribe = subscribeToMatches((matches) => {
      matchesRef.current = matches;
      checkResults();
    });

    syncFixtureFromApi().catch(() => {});

    const interval = setInterval(() => {
      checkResults();
      syncFixtureFromApi().catch(() => {});
    }, SYNC_INTERVAL_MS);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isAdmin]);
}
