import { useEffect, useState } from 'react';
import { Loader2, Trophy, Upload } from 'lucide-react';
import { subscribeToMatches, seedMatchesToFirestore } from '../services/matches';
import { subscribeToLeaderboard } from '../services/users';
import { useAuth } from '../contexts/AuthContext';
import { calculateWinners } from '../utils/prizes';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminMatchRow from '../components/admin/AdminMatchRow';
import PrizeSettings from '../components/admin/PrizeSettings';
import type { Match, UserProfile } from '../types';
import type { RankedUser } from '../utils/prizes';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Admin() {
  const { settings } = useAuth();
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [winners, setWinners] = useState<RankedUser[] | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMatches(setMatches);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard(setUsers);
    return () => unsubscribe();
  }, []);

  if (!matches || !settings) return <LoadingSpinner />;

  const handleSeed = async () => {
    if (!confirm('¿Cargar el fixture de ejemplo del Mundial 2026? Esto agregará 12 partidos nuevos.')) return;
    setSeeding(true);
    try {
      await seedMatchesToFirestore();
    } finally {
      setSeeding(false);
    }
  };

  const handleCalculateWinners = () => {
    setWinners(calculateWinners(users, settings));
  };

  return (
    <div className="page">
      <h1 className="page-title">Panel de Administración</h1>

      <div className="card section">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 className="muted">Fixture</h3>
            <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
              Cargá el fixture de ejemplo del Mundial 2026 si todavía no hay partidos.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={handleSeed} disabled={seeding}>
            {seeding ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
            Cargar partidos de ejemplo
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

      <PrizeSettings settings={settings} />

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
