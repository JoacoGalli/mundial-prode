import { useEffect, useState } from 'react';
import { Loader2, Lock, Trophy } from 'lucide-react';
import type { AppSettings, ChampionPick } from '../types';
import { getChampionPoints } from '../utils/prizes';

interface ChampionPickCardProps {
  teams: string[];
  pick: ChampionPick | null;
  settings: AppSettings;
  onSave: (team: string) => Promise<void>;
}

export default function ChampionPickCard({ teams, pick, settings, onSave }: ChampionPickCardProps) {
  const [team, setTeam] = useState(pick?.team ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTeam(pick?.team ?? '');
  }, [pick]);

  const locked = settings.championPicksLocked;
  const championDecided = settings.champion != null;

  const handleSave = async () => {
    if (!team) return;
    setSaving(true);
    try {
      await onSave(team);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card section">
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <h3 className="muted" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
          <Trophy size={18} color="var(--color-gold)" /> Campeón del Mundial
        </h3>
        {locked && (
          <span className="badge badge-locked">
            <Lock size={12} /> {championDecided ? 'Definido' : 'Cerrado'}
          </span>
        )}
      </div>

      {championDecided ? (
        <p style={{ margin: 0 }}>
          🏆 Campeón: <strong>{settings.champion}</strong>
          {pick?.team && (
            <>
              {' '}— Tu pronóstico: <strong>{pick.team}</strong>{' '}
              <span className="badge badge-points">
                +{getChampionPoints(pick, settings.champion, settings.championBonus)} pts
              </span>
            </>
          )}
        </p>
      ) : (
        <>
          <p className="muted" style={{ fontSize: '0.85rem', marginTop: 0 }}>
            Elegí qué selección crees que va a salir campeona. Si acertás, sumás{' '}
            <strong>{settings.championBonus} puntos</strong> extra a la tabla.
          </p>
          <div className="flex gap-sm" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="input"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              disabled={locked}
              style={{ minWidth: '12rem' }}
            >
              <option value="" disabled>
                Elegí un equipo
              </option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {!locked && (
              <button className="btn btn-primary" onClick={handleSave} disabled={!team || saving}>
                {saving ? <Loader2 size={16} className="spin" /> : saved ? 'Guardado ✓' : 'Guardar'}
              </button>
            )}
          </div>
          {locked && pick?.team && (
            <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 0 }}>
              Tu pronóstico: <strong>{pick.team}</strong>
            </p>
          )}
        </>
      )}
    </div>
  );
}
