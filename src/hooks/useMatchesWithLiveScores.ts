import { useEffect, useMemo, useRef, useState } from 'react';
import { subscribeToMatches } from '../services/matches';
import { fetchEventStatus } from '../services/sportsApi';
import { isMatchLocked } from '../utils/format';
import type { Match, MatchResult } from '../types';

const POLL_INTERVAL_MS = 30 * 1000;

interface LiveOverlay {
  liveScore: MatchResult;
  liveStatus: string;
}

/**
 * Subscribes to matches and, for any match that's locked but has no official
 * result yet, polls TheSportsDB directly from the browser every 30 seconds
 * for the live score. This way every signed-in user sees near-live scores
 * and partial points, regardless of whether an admin has the app open.
 */
export function useMatchesWithLiveScores(): { matches: Match[]; loading: boolean } {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const matchesRef = useRef<Match[]>([]);
  matchesRef.current = matches ?? [];
  const [overlay, setOverlay] = useState<Record<string, LiveOverlay>>({});

  useEffect(() => {
    const unsubscribe = subscribeToMatches(setMatches);
    return () => unsubscribe();
  }, []);

  const pendingKey = matchesRef.current
    .filter((m) => m.result == null && m.apiTeamA && m.apiTeamB && isMatchLocked(m))
    .map((m) => m.id)
    .join(',');

  useEffect(() => {
    if (!pendingKey) return;
    const ids = new Set(pendingKey.split(','));
    let cancelled = false;

    const poll = async () => {
      const pending = matchesRef.current.filter((m) => ids.has(m.id));
      const results = await Promise.all(
        pending.map(async (m) => {
          try {
            const dateISO = m.datetime.toDate().toISOString().slice(0, 10);
            const status = await fetchEventStatus(dateISO, m.apiTeamA!, m.apiTeamB!);
            return [m.id, status] as const;
          } catch {
            return [m.id, null] as const;
          }
        })
      );
      if (cancelled) return;
      setOverlay((prev) => {
        const next = { ...prev };
        for (const [id, status] of results) {
          if (status) next[id] = { liveScore: { home: status.home, away: status.away }, liveStatus: status.status };
        }
        return next;
      });
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pendingKey]);

  const merged = useMemo(
    () =>
      (matches ?? []).map((m) => {
        const live = overlay[m.id];
        if (m.result != null || !live) return m;
        return { ...m, liveScore: live.liveScore, liveStatus: live.liveStatus };
      }),
    [matches, overlay]
  );

  return { matches: merged, loading: matches === null };
}
