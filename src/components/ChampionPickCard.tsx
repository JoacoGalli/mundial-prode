import { useEffect, useState } from 'react';
import { Loader2, Lock, Trophy } from 'lucide-react';
import type { AppSettings, ChampionPick } from '../types';
import { getChampionPoints } from '../utils/prizes';

interface ChampionPickCardProps {
  teams: string[];
  pick: ChampionPick | null;
  settings: AppSettings;
  onSave: (teams: string[]) => Promise<void>;
}

export default function ChampionPickCard({ teams, pick, settings, onSave }: ChampionPickCardProps) {
  const [team1, setTeam1] = useState(pick?.teams?.[0] ?? '');
  const [team2, setTeam2] = useState(pick?.teams?.[1] ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTeam1(pick?.teams?.[0] ?? '');
    setTeam2(pick?.teams?.[1] ?? '');
  }, [pick]);

  const locked = settings.championPicksLocked;
  const finalistsDecided = settings.finalists != null;
  const canSave = !!team1 && !!team2 && team1 !== team2;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave([team1, team2]);
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
          <Trophy size={18} color="var(--color-gold)" /> Finalistas del Mundial
        </h3>
        {locked && (
          <span className="badge badge-locked">
            <Lock size={12} /> {finalistsDecided ? 'Definido' : 'Cerrado'}
          </span>
        )}
      </div>

      {finalistsDecided ? (
        <p style={{ margin: 0 }}>
          🏆 Finalistas: <strong>{settings.finalists![0]}</strong> y <strong>{settings.finalists![1]}</strong>
          {pick?.teams && pick.teams.length > 0 && (
            <>
              {' '}— Tu pronóstico: <strong>{pick.teams.join(' y ')}</strong>{' '}
              <span className="badge badge-points">
                +{getChampionPoints(pick, settings.finalists, settings.championBonus)} pts
              </span>
            </>
          )}
        </p>
      ) : (
        <>
          <p className="muted" style={{ fontSize: '0.85rem', marginTop: 0 }}>
            Elegí qué dos selecciones creés que van a llegar a la final. Por cada una que
            aciertes sumás <strong>{settings.championBonus} puntos</strong> extra a la tabla
            (hasta {settings.championBonus * 2} si acertás las dos).
          </p>
          <div className="flex gap-sm" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="input"
              value={team1}
              onChange={(e) => setTeam1(e.target.value)}
              disabled={locked}
              style={{ minWidth: '12rem' }}
            >
              <option value="" disabled>
                Finalista 1
              </option>
              {teams.map((t) => (
                <option key={t} value={t} disabled={t === team2}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={team2}
              onChange={(e) => setTeam2(e.target.value)}
              disabled={locked}
              style={{ minWidth: '12rem' }}
            >
              <option value="" disabled>
                Finalista 2
              </option>
              {teams.map((t) => (
                <option key={t} value={t} disabled={t === team1}>
                  {t}
                </option>
              ))}
            </select>
            {!locked && (
              <button className="btn btn-primary" onClick={handleSave} disabled={!canSave || saving}>
                {saving ? <Loader2 size={16} className="spin" /> : saved ? 'Guardado ✓' : 'Guardar'}
              </button>
            )}
          </div>
          {locked && pick?.teams && pick.teams.length > 0 && (
            <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 0 }}>
              Tu pronóstico: <strong>{pick.teams.join(' y ')}</strong>
            </p>
          )}
        </>
      )}
    </div>
  );
}
