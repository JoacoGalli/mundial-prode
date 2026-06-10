import { useState } from 'react';
import { Loader2, Lock, Trophy, Unlock } from 'lucide-react';
import { setChampion, toggleChampionPicksLocked } from '../../services/championPicks';
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
  const [champion, setChampionTeam] = useState(settings.champion ?? '');
  const [confirming, setConfirming] = useState(false);

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

  const handleConfirmChampion = async () => {
    if (!champion) return;
    if (
      !confirm(
        `¿Confirmar a ${champion} como campeón del Mundial? Esto suma ${bonus} pts a quienes lo hayan pronosticado y cierra los pronósticos de campeón.`
      )
    )
      return;
    setConfirming(true);
    try {
      await setChampion(champion, bonus);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="card section">
      <h3 className="muted" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
        <Trophy size={18} color="var(--color-gold)" /> Campeón del Mundial
      </h3>

      <div className="flex gap-md" style={{ flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'flex-end' }}>
        <div>
          <label className="muted" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
            Puntos de bonus por acertar
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
            Pronósticos de campeón
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

      {settings.champion ? (
        <p>
          🏆 Campeón confirmado: <strong>{settings.champion}</strong>
        </p>
      ) : (
        <>
          <label className="muted" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            Confirmar campeón real (recalcula puntos y cierra los pronósticos)
          </label>
          <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
            <select
              className="input"
              value={champion}
              onChange={(e) => setChampionTeam(e.target.value)}
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
            <button className="btn btn-primary" onClick={handleConfirmChampion} disabled={!champion || confirming}>
              {confirming ? <Loader2 size={16} className="spin" /> : 'Confirmar Campeón'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
