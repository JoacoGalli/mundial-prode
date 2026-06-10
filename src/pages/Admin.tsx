import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw, Trophy, Upload } from 'lucide-react';
import {
  subscribeToMatches,
  seedMatchesToFirestore,
  syncFixtureFromApi,
  replaceFixtureWithFullGroupStage,
} from '../services/matches';
import { subscribeToLeaderboard } from '../services/users';
import { subscribeToAllChampionPicks } from '../services/championPicks';
import { updateSettings } from '../services/settings';
import { useAuth } from '../contexts/AuthContext';
import { buildLeaderboardEntries, calculateWinners } from '../utils/prizes';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminMatchRow from '../components/admin/AdminMatchRow';
import PrizeSettings from '../components/admin/PrizeSettings';
import ChampionSettings from '../components/admin/ChampionSettings';
import { getAllTeams } from '../utils/teams';
import type { ChampionPick, Match, UserProfile } from '../types';
import type { RankedUser } from '../utils/prizes';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Admin() {
  const { settings } = useAuth();
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [picks, setPicks] = useState<ChampionPick[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [winners, setWinners] = useState<RankedUser[] | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMatches(setMatches);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard(setUsers);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAllChampionPicks(setPicks);
    return () => unsubscribe();
  }, []);

  if (!matches || !settings) return <LoadingSpinner />;

  const handleSeed = async () => {
    if (!confirm('¿Cargar el fixture completo del Mundial 2026 (Fecha 1, 2 y 3 de la fase de grupos)? Esto agregará 72 partidos nuevos.')) return;
    setSeeding(true);
    try {
      await seedMatchesToFirestore();
    } finally {
      setSeeding(false);
    }
  };

  const handleReplace = async () => {
    if (
      !confirm(
        '¿Reemplazar el fixture actual por el fixture completo del Mundial 2026 (Fecha 1, 2 y 3, 72 partidos)?\n\n' +
          'Esto BORRA todos los partidos y pronósticos cargados hasta ahora y no se puede deshacer.'
      )
    )
      return;
    setReplacing(true);
    try {
      await replaceFixtureWithFullGroupStage();
    } finally {
      setReplacing(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const added = await syncFixtureFromApi();
      setSyncMessage(
        added === 0
          ? 'No hay partidos nuevos: TheSportsDB todavía no publicó más fechas.'
          : `Se agregaron ${added} partido(s) nuevo(s) desde TheSportsDB.`
      );
    } catch {
      setSyncMessage('No se pudo conectar con TheSportsDB. Probá de nuevo más tarde.');
    } finally {
      setSyncing(false);
    }
  };

  const handleCalculateWinners = () => {
    const picksByUid = Object.fromEntries(picks.map((p) => [p.uid, p]));
    const entries = buildLeaderboardEntries(users, picksByUid, settings.champion, settings.championBonus);
    setWinners(calculateWinners(entries, settings));
  };

  return (
    <div className="page">
      <h1 className="page-title">Panel de Administración</h1>

      <div className="card section">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 className="muted">Fixture</h3>
            <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
              Cargá el fixture completo del Mundial 2026 (Fecha 1, 2 y 3 de la fase de grupos,
              72 partidos) si todavía no hay partidos. Cuando se publiquen las llaves de
              eliminación directa, usá "Actualizar fixture desde API" para sumarlas sin
              perder los pronósticos ya cargados.
            </p>
          </div>
          <div className="flex gap-sm">
            <button className="btn btn-secondary" onClick={handleSeed} disabled={seeding}>
              {seeding ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
              Cargar fixture del Mundial 2026
            </button>
            <button className="btn btn-secondary" onClick={handleSync} disabled={syncing}>
              {syncing ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
              Actualizar fixture desde API
            </button>
          </div>
        </div>
        {syncMessage && (
          <p className="muted" style={{ marginTop: '0.75rem', marginBottom: 0, fontSize: '0.85rem' }}>
            {syncMessage}
          </p>
        )}

        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px dashed rgba(255, 255, 255, 0.12)' }}>
          <div>
            <h3 className="muted">Reemplazar fixture completo</h3>
            <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
              Si ya cargaste un fixture viejo o incompleto (por ejemplo, sólo la Fecha 1), usá
              esto para borrar todos los partidos y pronósticos actuales y cargar de nuevo el
              fixture completo (Fecha 1, 2 y 3, 72 partidos). Esta acción no se puede deshacer.
            </p>
          </div>
          <button className="btn btn-danger" onClick={handleReplace} disabled={replacing}>
            {replacing ? <Loader2 size={16} className="spin" /> : <AlertTriangle size={16} />}
            Reemplazar fixture completo
          </button>
        </div>
      </div>

      <div className="card section" style={{ overflowX: 'auto' }}>
        <h3 className="muted" style={{ marginBottom: '0.75rem' }}>Partidos</h3>
        {matches.length === 0 ? (
          <p className="muted">Todavía no hay partidos cargados.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Partido</th>
                <th>Fecha</th>
                <th>Resultado</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <AdminMatchRow key={m.id} match={m} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <PrizeSettings
        prizePool={settings.prizePool}
        currency={settings.currency}
        distribution={settings.distribution}
        onSave={updateSettings}
      />

      <ChampionSettings teams={getAllTeams(matches)} settings={settings} />

      <div className="card section">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <h3 className="muted">Calcular ganadores</h3>
          <button className="btn btn-primary" onClick={handleCalculateWinners}>
            <Trophy size={16} /> Calcular Ganadores
          </button>
        </div>

        {winners && (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Jugador</th>
                <th>Puntos</th>
                <th>Premio</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((w) => (
                <tr key={w.uid} className={w.prize > 0 ? 'me' : ''}>
                  <td>{MEDALS[w.rank - 1] ?? w.rank}</td>
                  <td>{w.name}</td>
                  <td>{w.totalPoints}</td>
                  <td>{w.prize > 0 ? formatCurrency(w.prize, settings.currency) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {winners && winners.length === 0 && <p className="muted">Todavía no hay jugadores.</p>}
      </div>
    </div>
  );
}
