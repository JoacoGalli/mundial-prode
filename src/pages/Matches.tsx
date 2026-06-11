import { useEffect, useState } from 'react';
import { subscribeToMatches } from '../services/matches';
import { subscribeToUserPredictions, savePrediction } from '../services/predictions';
import { subscribeToLeaderboard } from '../services/users';
import { useAuth } from '../contexts/AuthContext';
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { ROUNDS, getDefaultRound } from '../utils/rounds';
import type { Match, Prediction, Round, UserProfile } from '../types';

export default function Matches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMatches(setMatches);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserPredictions(user.uid, setPredictions);
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard(setUsers);
    return () => unsubscribe();
  }, []);

  if (!matches) return <LoadingSpinner />;

  const predictionByMatch = new Map(predictions.map((p) => [p.matchId, p]));
  const usersById = Object.fromEntries(users.map((u) => [u.uid, u]));
  const round = selectedRound ?? getDefaultRound(matches);
  const matchesInRound = matches.filter((m) => m.round === round);

  return (
    <div className="page">
      <h1 className="page-title">Partidos</h1>

      <select
        className="input"
        value={round}
        onChange={(e) => setSelectedRound(e.target.value as Round)}
        style={{ marginBottom: '1rem', width: '100%' }}
      >
        {ROUNDS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      {matches.length === 0 && (
        <p className="muted">Todavía no hay partidos cargados. Pedile al admin que cargue el fixture.</p>
      )}

      {matches.length > 0 && matchesInRound.length === 0 && (
        <p className="muted">Todavía no hay partidos cargados para "{round}".</p>
      )}

      {matchesInRound.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          prediction={predictionByMatch.get(match.id)}
          usersById={usersById}
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
