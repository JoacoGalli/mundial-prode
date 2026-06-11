import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Lock, Unlock, Check, Users } from 'lucide-react';
import type { Match, Prediction, UserProfile } from '../types';
import ScoreSpinner from './ScoreSpinner';
import { formatDateTime, isMatchLocked } from '../utils/format';
import { subscribeToMatchPredictions } from '../services/predictions';

interface MatchCardProps {
  match: Match;
  prediction?: Prediction;
  onSave?: (home: number, away: number) => Promise<void>;
  usersById?: Record<string, UserProfile>;
}

export default function MatchCard({ match, prediction, onSave, usersById }: MatchCardProps) {
  const [home, setHome] = useState(prediction?.home ?? 0);
  const [away, setAway] = useState(prediction?.away ?? 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);

  const locked = isMatchLocked(match);
  const hasResult = match.result != null;

  useEffect(() => {
    if (!showPredictions) return;
    const unsubscribe = subscribeToMatchPredictions(match.id, setAllPredictions);
    return () => unsubscribe();
  }, [showPredictions, match.id]);

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(home, away);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
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
            {hasResult ? `${match.result!.home} - ${match.result!.away}` : 'vs'}
          </span>
          <span className="ticket-team">{match.teamB}</span>
        </div>

        <hr className="ticket-divider" />

        <div className="ticket-footer">
          <div className="flex gap-sm" style={{ alignItems: 'center' }}>
            <ScoreSpinner value={home} onChange={setHome} disabled={locked} label={`Goles ${match.teamA}`} />
            <span className="muted">-</span>
            <ScoreSpinner value={away} onChange={setAway} disabled={locked} label={`Goles ${match.teamB}`} />
          </div>

          <div className="ticket-footer-meta">
            {prediction?.points != null && (
              <span className="badge badge-points">+{prediction.points} pts</span>
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
            {!locked && onSave && (
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saved ? <Check size={16} /> : 'Guardar'}
              </button>
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
                {allPredictions.length === 0 && (
                  <p className="muted" style={{ margin: 0 }}>Todavía nadie cargó un pronóstico para este partido.</p>
                )}
                {allPredictions
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
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
