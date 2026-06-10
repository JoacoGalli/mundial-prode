import { useState } from 'react';
import { Loader2, Lock, Unlock } from 'lucide-react';
import type { Match } from '../../types';
import { formatDateTime } from '../../utils/format';
import { lockMatch, setMatchResult } from '../../services/matches';

export default function AdminMatchRow({ match }: { match: Match }) {
  const [home, setHome] = useState(match.result?.home ?? 0);
  const [away, setAway] = useState(match.result?.away ?? 0);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setMatchResult(match.id, { home, away });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLock = async () => {
    setToggling(true);
    try {
      await lockMatch(match.id, !match.locked);
    } finally {
      setToggling(false);
    }
  };

  return (
    <tr>
      <td>
        <strong>{match.teamA}</strong> vs <strong>{match.teamB}</strong>
        <div className="muted" style={{ fontSize: '0.75rem' }}>{match.stage}</div>
      </td>
      <td>{formatDateTime(match.datetime)}</td>
      <td>
        <div className="flex gap-sm" style={{ alignItems: 'center' }}>
          <input
            className="input score-input"
            type="number"
            min={0}
            value={home}
            onChange={(e) => setHome(Math.max(0, Number(e.target.value) || 0))}
          />
          <span className="muted">-</span>
          <input
            className="input score-input"
            type="number"
            min={0}
            value={away}
            onChange={(e) => setAway(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
      </td>
      <td>
        <button
          className="btn btn-secondary"
          onClick={handleToggleLock}
          disabled={toggling}
          title={match.locked ? 'Desbloquear' : 'Bloquear'}
        >
          {toggling ? <Loader2 size={16} className="spin" /> : match.locked ? <Lock size={16} /> : <Unlock size={16} />}
        </button>
      </td>
      <td>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="spin" /> : 'Guardar resultado'}
        </button>
      </td>
    </tr>
  );
}
