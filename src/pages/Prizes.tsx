import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToLeaderboard } from '../services/users';
import { calculateWinners } from '../utils/prizes';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import type { UserProfile } from '../types';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Prizes() {
  const { settings } = useAuth();
  const [users, setUsers] = useState<UserProfile[] | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard(setUsers);
    return () => unsubscribe();
  }, []);

  if (!users || !settings) return <LoadingSpinner />;

  const ranked = calculateWinners(users, settings);

  return (
    <div className="page">
      <h1 className="page-title">Premios</h1>

      <div className="card section">
        <div className="flex-between">
          <div>
            <div className="muted">Pozo total</div>
            <h2 style={{ fontSize: '2rem', color: 'var(--color-gold)' }}>
              {formatCurrency(settings.prizePool, settings.currency)}
            </h2>
          </div>
          <Trophy size={40} color="var(--color-gold)" />
        </div>
      </div>

      <div className="card section">
        <h3 className="muted" style={{ marginBottom: '0.75rem' }}>Distribución</h3>
        <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
          {settings.distribution.map((pct, i) => (
            <div key={i} className="card" style={{ flex: '1 1 100px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem' }}>{MEDALS[i] ?? `${i + 1}°`}</div>
              <div className="page-title" style={{ fontSize: '1.5rem', margin: '0.25rem 0' }}>{pct}%</div>
              <div className="muted" style={{ fontSize: '0.85rem' }}>
                {formatCurrency((settings.prizePool * pct) / 100, settings.currency)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="muted" style={{ marginBottom: '0.75rem' }}>Pago estimado por posición actual</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Jugador</th>
              <th>Puntos</th>
              <th>Premio estimado</th>
            </tr>
          </thead>
          <tbody>
            {ranked.slice(0, settings.distribution.length).map((u) => (
              <tr key={u.uid}>
                <td>{MEDALS[u.rank - 1] ?? u.rank}</td>
                <td>{u.name}</td>
                <td>{u.totalPoints}</td>
                <td>{formatCurrency(u.prize, settings.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {ranked.length === 0 && <p className="muted center">Todavía no hay jugadores.</p>}
      </div>
    </div>
  );
}
