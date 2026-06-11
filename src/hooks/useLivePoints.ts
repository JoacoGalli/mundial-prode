import { useEffect, useMemo, useState } from 'react';
import { subscribeToMatches } from '../services/matches';
import { subscribeToPredictionsForMatches } from '../services/predictions';
import { getLivePointsByUid } from '../utils/prizes';
import type { Match, Prediction } from '../types';

/**
 * Tracks matches currently in progress (have a live score but no official
 * result yet) and, for each user, how many points their predictions for
 * those matches would earn right now — so leaderboards can show a live,
 * recalculating total.
 */
export function useLivePoints() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [livePredictions, setLivePredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToMatches(setMatches);
    return () => unsubscribe();
  }, []);

  const liveMatches = useMemo(
    () => matches.filter((m) => m.result == null && m.liveScore != null),
    [matches]
  );
  const liveMatchIdsKey = liveMatches.map((m) => m.id).join(',');

  useEffect(() => {
    const ids = liveMatchIdsKey ? liveMatchIdsKey.split(',') : [];
    const unsubscribe = subscribeToPredictionsForMatches(ids, setLivePredictions);
    return () => unsubscribe();
  }, [liveMatchIdsKey]);

  const livePointsByUid = useMemo(
    () => getLivePointsByUid(liveMatches, livePredictions),
    [liveMatches, livePredictions]
  );

  return { liveMatches, livePointsByUid };
}
