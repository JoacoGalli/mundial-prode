import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToMatches, setMatchResult, updateLiveScore, syncFixtureFromApi } from '../services/matches';
import { fetchEventStatus } from '../services/sportsApi';
import { isMatchLocked } from '../utils/format';
import type { Match } from '../types';

const RESULTS_INTERVAL_MS = 30 * 1000; // 30 seconds
const FIXTURES_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * For admins: periodically (on load and every 30 seconds while the app stays
 * open) checks matches that have already kicked off but have no official
 * result yet, and looks them up on TheSportsDB by date + team names. While
 * the match is in progress, it updates `liveScore`/`liveStatus` so everyone
 * can see the live score and partial points. Once the match is fully over
 * (including extra time / penalties), it sets the official result, which
 * triggers point recalculation for everyone. It also pulls in any
 * newly-published fixtures (knockout bracket) every 5 minutes so the admin
 * doesn't have to remember to do it manually.
 */
export function useAutoSyncResults() {
  const { isAdmin } = useAuth();
  const matchesRef = useRef<Match[]>([]);

  useEffect(() => {
    if (!isAdmin) return;

    const checkResults = async () => {
      for (const match of matchesRef.current) {
        if (match.result != null) continue;
        if (!match.apiTeamA || !match.apiTeamB) continue;
        if (!isMatchLocked(match)) continue;

        try {
          const dateISO = match.datetime.toDate().toISOString().slice(0, 10);
          const status = await fetchEventStatus(dateISO, match.apiTeamA, match.apiTeamB);
          if (!status) continue;

          if (status.finished) {
            await setMatchResult(match.id, { home: status.home, away: status.away });
          } else if (
            match.liveScore?.home !== status.home ||
            match.liveScore?.away !== status.away ||
            match.liveStatus !== status.status
          ) {
            await updateLiveScore(match.id, { home: status.home, away: status.away }, status.status);
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

    const resultsInterval = setInterval(checkResults, RESULTS_INTERVAL_MS);
    const fixturesInterval = setInterval(() => {
      syncFixtureFromApi().catch(() => {});
    }, FIXTURES_INTERVAL_MS);

    return () => {
      unsubscribe();
      clearInterval(resultsInterval);
      clearInterval(fixturesInterval);
    };
  }, [isAdmin]);
}
