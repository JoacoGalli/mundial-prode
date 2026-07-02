import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToMatches, setMatchResult, updateLiveScore, syncFixtureFromApi } from '../services/matches';
import { fetchEventStatus } from '../services/sportsApi';
import { isMatchLocked } from '../utils/format';
import type { Match } from '../types';

const RESULTS_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const FIXTURES_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * For any signed-in user: periodically (on load and every 30 seconds while
 * the app stays open) checks matches that have already kicked off but have
 * no official result yet, and looks them up on TheSportsDB by date + team
 * names. While the match is in progress (or once it's over but the score
 * isn't reliable — see below), it updates `liveScore`/`liveStatus` so
 * everyone can see the score and partial points. Once the match is over
 * *within regulation time* it sets the official result, which triggers point
 * recalculation for everyone — so this finishes automatically as soon as
 * anyone has the app open, not just an admin. Predictions only count the
 * 90-minute result, and TheSportsDB only reports the final score for matches
 * decided in extra time or penalties, so those are left for an admin to
 * enter the 90' score manually (see `AdminMatchRow`).
 * Admins additionally pull in any newly-published fixtures (knockout bracket)
 * every 5 minutes so they don't have to remember to do it manually.
 */
export function useAutoSyncResults() {
  const { user, isAdmin } = useAuth();
  const matchesRef = useRef<Match[]>([]);

  useEffect(() => {
    if (!user) return;

    const checkResults = async () => {
      for (const match of matchesRef.current) {
        if (match.result != null) continue;
        if (!match.apiTeamA || !match.apiTeamB) continue;
        if (!isMatchLocked(match)) continue;

        try {
          const dateISO = match.datetime.toDate().toISOString().slice(0, 10);
          const status = await fetchEventStatus(dateISO, match.apiTeamA, match.apiTeamB);
          if (!status) continue;

          if (status.finished && status.resultReliable) {
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

    const resultsInterval = setInterval(checkResults, RESULTS_INTERVAL_MS);

    let fixturesInterval: ReturnType<typeof setInterval> | undefined;
    if (isAdmin) {
      syncFixtureFromApi().catch(() => {});
      fixturesInterval = setInterval(() => {
        syncFixtureFromApi().catch(() => {});
      }, FIXTURES_INTERVAL_MS);
    }

    return () => {
      unsubscribe();
      clearInterval(resultsInterval);
      if (fixturesInterval) clearInterval(fixturesInterval);
    };
  }, [user, isAdmin]);
}
