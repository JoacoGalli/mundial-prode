import { useEffect, useState } from 'react';
import { subscribeToUserPredictions } from '../services/predictions';
import { subscribeToChampionPick, saveChampionPick } from '../services/championPicks';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ChampionPickCard from '../components/ChampionPickCard';
import { useLivePoints } from '../hooks/useLivePoints';
import { useMatchesWithLiveScores } from '../hooks/useMatchesWithLiveScores';
import { formatDateTime, formatLiveStatus } from '../utils/format';
import { calculatePoints } from '../utils/scoring';
import { getAllTeams } from '../utils/teams';
import type { ChampionPick, Prediction } from '../types';

export default function MyPredictions() {
  const { user, profile, settings } = useAuth();
  const { livePointsByUid } = useLivePoints();
  const { matches, loading } = useMatchesWithLiveScores();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [championPick, setChampionPick] = useState<ChampionPick | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserPredictions(user.uid, setPredictions);
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToChampionPick(user.uid, setChampionPick);
    return () => unsubscribe();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  const predictionByMatch = new Map(predictions.map((p) => [p.matchId, p]));
  const matchesWithPredictions = matches.filter((m) => predictionByMatch.has(m.id));
  const teams = getAllTeams(matches);
  const livePoints = user ? livePointsByUid[user.uid] ?? 0 : 0;

  return (
    <div className="page">
      <h1 className="page-title">Mis Pronósticos</h1>

      <div className="card section">
        <div className="flex-between">
          <span>Puntos totales</span>
          <span className="badge badge-points" style={{ fontSize: '1rem' }}>
            {profile?.predictionPoints ?? 0} pts
          </span>
        </div>
        {livePoints > 0 && (
          <div className="flex-between" style={{ marginTop: '0.5rem' }}>
            <span>En vivo ahora</span>
            <span className="badge badge-live" style={{ fontSize: '1rem' }}>
              +{livePoints} pts
            </span>
          </div>
        )}
      </div>

      {settings && teams.length > 0 && user && (
        <ChampionPickCard
          teams={teams}
          pick={championPick}
          settings={settings}
          onSave={(teams) => saveChampionPick(user.uid, teams)}
        />
      )}

      {matchesWithPredictions.length === 0 && (
        <p className="muted">Todavía no hiciste ningún pronóstico. ¡Andá a la sección Partidos!</p>
      )}

      {matchesWithPredictions.length > 0 && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Partido</th>
                <th>Fecha</th>
                <th>Mi pronóstico</th>
                <th>Resultado</th>
                <th>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {matchesWithPredictions.map((match) => {
                const pred = predictionByMatch.get(match.id)!;
                return (
                  <tr key={match.id}>
                    <td>
                      {match.teamA} vs {match.teamB}
                      <div className="muted" style={{ fontSize: '0.75rem' }}>{match.stage}</div>
                    </td>
                    <td>{formatDateTime(match.datetime)}</td>
                    <td>
                      {pred.home} - {pred.away}
                    </td>
                    <td>
                      {match.result ? (
                        `${match.result.home} - ${match.result.away}`
                      ) : match.liveScore ? (
                        <span className="badge badge-live">
                          🔴 {match.liveScore.home} - {match.liveScore.away} · {formatLiveStatus(match.liveStatus)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {pred.points != null ? (
                        <span className="badge badge-points">{pred.points} pts</span>
                      ) : match.liveScore ? (
                        <span className="badge badge-points" style={{ opacity: 0.7 }}>
                          +{calculatePoints(pred, match.liveScore)} pts (parcial)
                        </span>
                      ) : (
                        <span className="muted">Pendiente</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
