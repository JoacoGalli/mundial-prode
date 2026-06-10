import { useState } from 'react';
import { Lock, Unlock, Check } from 'lucide-react';
import type { Match, Prediction } from '../types';
import ScoreSpinner from './ScoreSpinner';
import { formatDateTime, isMatchLocked } from '../utils/format';

interface MatchCardProps {
  match: Match;
  prediction?: Prediction;
  onSave?: (home: number, away: number) => Promise<void>;
}

export default function MatchCard({ match, prediction, onSave }: MatchCardProps) {
  const [home, setHome] = useState(prediction?.home ?? 0);
  const [away, setAway] = useState(prediction?.away ?? 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const locked = isMatchLocked(match);
  const hasResult = match.result != null;

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
      </div>
    </div>
  );
}
