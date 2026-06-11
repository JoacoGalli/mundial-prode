import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Lock, Unlock, Users } from 'lucide-react';
import type { Match, Prediction, UserProfile } from '../types';
import ScoreSpinner from './ScoreSpinner';
import { formatDateTime, formatLiveStatus, isMatchLocked } from '../utils/format';
import { subscribeToMatchPredictions } from '../services/predictions';
import { calculatePoints } from '../utils/scoring';

interface MatchCardProps {
  match: Match;
  prediction?: Prediction;
  onChange?: (home: number, away: number) => void;
  usersById?: Record<string, UserProfile>;
}

export default function MatchCard({ match, prediction, onChange, usersById }: MatchCardProps) {
  const [home, setHome] = useState(prediction?.home ?? 0);
  const [away, setAway] = useState(prediction?.away ?? 0);
  const [showPredictions, setShowPredictions] = useState(false);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);

  const locked = isMatchLocked(match);
  const hasResult = match.result != null;
  const isLive = !hasResult && match.liveScore != null;

  useEffect(() => {
    if (!showPredictions) return;
    const unsubscribe = subscribeToMatchPredictions(match.id, setAllPredictions);
    return () => unsubscribe();
  }, [showPredictions, match.id]);

  const handleHomeChange = (value: number) => {
    setHome(value);
    onChange?.(value, away);
  };

  const handleAwayChange = (value: number) => {
    setAway(value);
    onChange?.(home, value);
  };

  return (
    <div className="ticket">
      <div className="ticket-body">
        <div className="ticket-header">
          <span className="ticket-stage">{match.stage}</span>
          <span>{formatDateTime(match.datetime)}</span>
        </div>

        <div className="ticket-teams">
          <span className="ticket-team">{match.teamA}</span>
          <span className="ticket-vs">
            {hasResult
              ? `${match.result!.home} - ${match.result!.away}`
              : isLive
                ? `${match.liveScore!.home} - ${match.liveScore!.away}`
                : 'vs'}
          </span>
          <span className="ticket-team">{match.teamB}</span>
        </div>

        {isLive && (
          <div className="center" style={{ marginTop: '0.25rem' }}>
            <span className="badge badge-live">🔴 EN VIVO · {formatLiveStatus(match.liveStatus)}</span>
          </div>
        )}

        <hr className="ticket-divider" />

        <div className="ticket-footer">
          <div className="flex gap-sm" style={{ alignItems: 'center' }}>
            <ScoreSpinner value={home} onChange={handleHomeChange} disabled={locked} label={`Goles ${match.teamA}`} />
            <span className="muted">-</span>
            <ScoreSpinner value={away} onChange={handleAwayChange} disabled={locked} label={`Goles ${match.teamB}`} />
          </div>

          <div className="ticket-footer-meta">
            {prediction?.points != null && (
              <span className="badge badge-points">+{prediction.points} pts</span>
            )}
            {prediction && prediction.points == null && isLive && (
              <span className="badge badge-points" style={{ opacity: 0.7 }}>
                +{calculatePoints(prediction, match.liveScore!)} pts (parcial)
              </span>
            )}
            {locked ? (
              <span className="badge badge-locked">
                <Lock size={12} /> Cerrado
              </span>
            ) : (
              <span className="badge badge-open">
                <Unlock size={12} /> Abierto
              </span>
            )}
          </div>
        </div>

        {locked && (
          <>
            <button
              className="btn btn-secondary"
              style={{ marginTop: '0.75rem', width: '100%' }}
              onClick={() => setShowPredictions((v) => !v)}
            >
              <Users size={16} />
              {showPredictions ? 'Ocultar pronósticos de los demás' : 'Ver pronósticos de los demás'}
              {showPredictions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showPredictions && (
              <div style={{ marginTop: '0.75rem' }}>
                {(() => {
                  const visiblePredictions = allPredictions.filter((p) => !usersById || p.uid in usersById);
                  if (visiblePredictions.length === 0) {
                    return <p className="muted" style={{ margin: 0 }}>Todavía nadie cargó un pronóstico para este partido.</p>;
                  }
                  return visiblePredictions
                    .slice()
                    .sort((a, b) => (usersById?.[a.uid]?.name ?? a.uid).localeCompare(usersById?.[b.uid]?.name ?? b.uid))
                    .map((p) => {
                      const u = usersById?.[p.uid];
                      return (
                        <div key={p.uid} className="flex-between" style={{ padding: '0.25rem 0' }}>
                          <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                            {u?.photoURL && (
                              <img src={u.photoURL} alt={u.name} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                            )}
                            <span>{u?.name ?? 'Jugador'}</span>
                          </div>
                          <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                            <span>{p.home} - {p.away}</span>
                            {p.points != null && <span className="badge badge-points">+{p.points} pts</span>}
                            {p.points == null && isLive && (
                              <span className="badge badge-points" style={{ opacity: 0.7 }}>
                                +{calculatePoints(p, match.liveScore!)} pts (parcial)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
