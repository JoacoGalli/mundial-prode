import { useEffect, useState } from 'react';
import { subscribeToMatches } from '../services/matches';
import { subscribeToUserPredictions, savePrediction } from '../services/predictions';
import { useAuth } from '../contexts/AuthContext';
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Match, Prediction } from '../types';

export default function Matches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToMatches(setMatches);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserPredictions(user.uid, setPredictions);
    return () => unsubscribe();
  }, [user]);

  if (!matches) return <LoadingSpinner />;

  const predictionByMatch = new Map(predictions.map((p) => [p.matchId, p]));

  return (
    <div className="page">
      <h1 className="page-title">Partidos</h1>
      {matches.length === 0 && (
        <p className="muted">Todavía no hay partidos cargados. Pedile al admin que cargue el fixture.</p>
      )}
      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          prediction={predictionByMatch.get(match.id)}
          onSave={
            user
              ? (home, away) => savePrediction(user.uid, match.id, home, away)
              : undefined
          }
        />
      ))}
    </div>
  );
}
