import { useEffect, useState } from 'react';
import { subscribeToLeaderboard } from '../services/users';
import { useAuth } from '../contexts/AuthContext';
import { calculateWinners } from '../utils/prizes';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import type { UserProfile } from '../types';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Dashboard() {
  const { user, settings } = useAuth();
  const [users, setUsers] = useState<UserProfile[] | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard(setUsers);
    return () => unsubscribe();
  }, []);

  if (!users) return <LoadingSpinner />;

  const ranked = settings ? calculateWinners(users, settings) : null;
  const hasPrizePool = settings && settings.prizePool > 0;

  return (
    <div className="page">
      <h1 className="page-title">Tabla de Posiciones</h1>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Jugador</th>
              <th>Puntos</th>
              {hasPrizePool && <th>Premio</th>}
            </tr>
          </thead>
          <tbody>
            {(ranked ?? users.map((u, i) => ({ ...u, rank: i + 1, prize: 0 }))).map((u) => (
              <tr key={u.uid} className={u.uid === user?.uid ? 'me' : ''}>
                <td>{MEDALS[u.rank - 1] ?? u.rank}</td>
                <td>
                  <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                    {u.photoURL && (
                      <img
                        src={u.photoURL}
                        alt={u.name}
                        style={{ width: 28, height: 28, borderRadius: '50%' }}
                      />
                    )}
                    <span>{u.name}</span>
                  </div>
                </td>
                <td>{u.totalPoints}</td>
                {hasPrizePool && (
                  <td>{u.prize > 0 ? formatCurrency(u.prize, settings!.currency) : '—'}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="muted center">Todavía no hay jugadores registrados.</p>}
      </div>
    </div>
  );
}
