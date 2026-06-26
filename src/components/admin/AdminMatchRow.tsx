import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Lock, Unlock, X } from 'lucide-react';
import type { Match } from '../../types';
import { formatDateTime } from '../../utils/format';
import { lockMatch, setMatchResult } from '../../services/matches';

export default function AdminMatchRow({ match }: { match: Match }) {
  const [home, setHome] = useState(match.result?.home ?? 0);
  const [away, setAway] = useState(match.result?.away ?? 0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
  const [toggling, setToggling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync inputs when result changes externally (e.g. auto-sync sets an official result).
  useEffect(() => {
    if (match.result != null) {
      setHome(match.result.home);
      setAway(match.result.away);
    }
  }, [match.result?.home, match.result?.away]);

  const handleSave = async () => {
    setSaveStatus('saving');
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      await setMatchResult(match.id, { home, away });
      setSaveStatus('ok');
    } catch (err) {
      console.error('Error guardando resultado:', err);
      setSaveStatus('error');
    } finally {
      timerRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
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
        <button
          className={`btn ${saveStatus === 'error' ? 'btn-danger' : 'btn-primary'}`}
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' && <Loader2 size={16} className="spin" />}
          {saveStatus === 'ok' && <Check size={16} />}
          {saveStatus === 'error' && <X size={16} />}
          {saveStatus === 'saving' ? 'Guardando…' : saveStatus === 'ok' ? 'Guardado' : saveStatus === 'error' ? 'Error al guardar' : 'Guardar resultado'}
        </button>
      </td>
    </tr>
  );
}
