import { useState } from 'react';
import { Loader2, Lock, Trophy, Unlock } from 'lucide-react';
import { setFinalists, toggleChampionPicksLocked } from '../../services/championPicks';
import { updateSettings } from '../../services/settings';
import type { AppSettings } from '../../types';

interface ChampionSettingsProps {
  teams: string[];
  settings: AppSettings;
}

export default function ChampionSettings({ teams, settings }: ChampionSettingsProps) {
  const [bonus, setBonus] = useState(settings.championBonus);
  const [savingBonus, setSavingBonus] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [finalist1, setFinalist1] = useState(settings.finalists?.[0] ?? '');
  const [finalist2, setFinalist2] = useState(settings.finalists?.[1] ?? '');
  const [confirming, setConfirming] = useState(false);

  const canConfirm = !!finalist1 && !!finalist2 && finalist1 !== finalist2;

  const handleSaveBonus = async () => {
    setSavingBonus(true);
    try {
      await updateSettings({ championBonus: bonus });
    } finally {
      setSavingBonus(false);
    }
  };

  const handleToggleLock = async () => {
    setToggling(true);
    try {
      await toggleChampionPicksLocked(!settings.championPicksLocked);
    } finally {
      setToggling(false);
    }
  };

  const handleConfirmFinalists = async () => {
    if (!canConfirm) return;
    if (
      !confirm(
        `¿Confirmar a ${finalist1} y ${finalist2} como finalistas del Mundial? Esto suma ${bonus} pts por cada finalista acertado y cierra los pronósticos.`
      )
    )
      return;
    setConfirming(true);
    try {
      await setFinalists([finalist1, finalist2]);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="card section">
      <h3 className="muted" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
        <Trophy size={18} color="var(--color-gold)" /> Finalistas del Mundial
      </h3>

      <div className="flex gap-md" style={{ flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'flex-end' }}>
        <div>
          <label className="muted" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
            Puntos de bonus por cada finalista acertado
          </label>
          <div className="flex gap-sm">
            <input
              className="input"
              type="number"
              min={0}
              value={bonus}
              onChange={(e) => setBonus(Math.max(0, Number(e.target.value) || 0))}
              style={{ width: '6rem' }}
            />
            <button className="btn btn-secondary" onClick={handleSaveBonus} disabled={savingBonus}>
              {savingBonus ? <Loader2 size={16} className="spin" /> : 'Guardar'}
            </button>
          </div>
        </div>

        <div>
          <label className="muted" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
            Pronósticos de finalistas
          </label>
          <button className="btn btn-secondary" onClick={handleToggleLock} disabled={toggling}>
            {toggling ? (
              <Loader2 size={16} className="spin" />
            ) : settings.championPicksLocked ? (
              <Lock size={16} />
            ) : (
              <Unlock size={16} />
            )}
            {settings.championPicksLocked ? 'Cerrados' : 'Abiertos'}
          </button>
        </div>
      </div>

      {settings.finalists ? (
        <p>
          🏆 Finalistas confirmados: <strong>{settings.finalists[0]}</strong> y{' '}
          <strong>{settings.finalists[1]}</strong>
        </p>
      ) : (
        <>
          <label className="muted" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            Confirmar los dos finalistas reales (recalcula puntos y cierra los pronósticos)
          </label>
          <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
            <select
              className="input"
              value={finalist1}
              onChange={(e) => setFinalist1(e.target.value)}
              style={{ minWidth: '12rem' }}
            >
              <option value="" disabled>
                Finalista 1
              </option>
              {teams.map((t) => (
                <option key={t} value={t} disabled={t === finalist2}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={finalist2}
              onChange={(e) => setFinalist2(e.target.value)}
              style={{ minWidth: '12rem' }}
            >
              <option value="" disabled>
                Finalista 2
              </option>
              {teams.map((t) => (
                <option key={t} value={t} disabled={t === finalist1}>
                  {t}
                </option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={handleConfirmFinalists} disabled={!canConfirm || confirming}>
              {confirming ? <Loader2 size={16} className="spin" /> : 'Confirmar Finalistas'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
