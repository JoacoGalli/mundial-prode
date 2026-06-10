import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToMatches, setMatchResult } from '../services/matches';
import { fetchEventResult } from '../services/sportsApi';
import { isMatchLocked } from '../utils/format';

/**
 * For admins: whenever the app loads, check matches that have already
 * kicked off but have no official result yet, look them up on
 * TheSportsDB, and apply the result automatically (which triggers
 * point recalculation for everyone).
 */
export function useAutoSyncResults() {
  const { isAdmin } = useAuth();
  const checked = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = subscribeToMatches(async (matches) => {
      for (const match of matches) {
        if (match.result != null) continue;
        if (!match.externalId) continue;
        if (!isMatchLocked(match)) continue;
        if (checked.current.has(match.id)) continue;

        checked.current.add(match.id);

        try {
          const result = await fetchEventResult(match.externalId);
          if (result) {
            await setMatchResult(match.id, result);
          }
        } catch {
          checked.current.delete(match.id);
        }
      }
    });

    return () => unsubscribe();
  }, [isAdmin]);
}
