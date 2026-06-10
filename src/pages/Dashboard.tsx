import { useEffect, useState } from 'react';
import { subscribeToLeaderboard } from '../services/users';
import { subscribeToAllChampionPicks } from '../services/championPicks';
import { useAuth } from '../contexts/AuthContext';
import { buildLeaderboardEntries, calculateWinners } from '../utils/prizes';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import type { ChampionPick, UserProfile } from '../types';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Dashboard() {
  const { user, settings } = useAuth();
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [picks, setPicks] = useState<ChampionPick[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard(setUsers);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAllChampionPicks(setPicks);
    return () => unsubscribe();
  }, []);

  if (!users || !settings) return <LoadingSpinner />;

  const picksByUid = Object.fromEntries(picks.map((p) => [p.uid, p]));
  const entries = buildLeaderboardEntries(users, picksByUid, settings.champion, settings.championBonus);
  const ranked = calculateWinners(entries, settings);
  const hasPrizePool = settings.prizePool > 0;

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
            {ranked.map((u) => (
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
                  <td>{u.prize > 0 ? formatCurrency(u.prize, settings.currency) : '—'}</td>
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
