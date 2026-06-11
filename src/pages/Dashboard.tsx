import { useEffect, useState } from 'react';
import { subscribeToLeaderboard } from '../services/users';
import { subscribeToAllChampionPicks } from '../services/championPicks';
import { subscribeToAllGroups, subscribeToGroupMembers, subscribeToMyMemberships } from '../services/groups';
import { useAuth } from '../contexts/AuthContext';
import { useLivePoints } from '../hooks/useLivePoints';
import { buildLeaderboardEntries, calculateWinners } from '../utils/prizes';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import type { ChampionPick, Group, GroupMember, UserProfile } from '../types';

const MEDALS = ['🥇', '🥈', '🥉'];
const GENERAL = 'general';

export default function Dashboard() {
  const { user, settings } = useAuth();
  const { livePointsByUid } = useLivePoints();
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [picks, setPicks] = useState<ChampionPick[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<string[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(GENERAL);
  const [hasDefaulted, setHasDefaulted] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard(setUsers);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAllChampionPicks(setPicks);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAllGroups(setAllGroups);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToMyMemberships(user.uid, (rows) => {
      setMyGroupIds(rows.filter((r) => r.status === 'approved').map((r) => r.groupId));
    });
    return () => unsubscribe();
  }, [user]);

  const myGroups = allGroups.filter((g) => myGroupIds.includes(g.id));

  // Default to the user's first group as soon as it's known, but only once,
  // so it doesn't override a selection the user already made.
  useEffect(() => {
    if (!hasDefaulted && myGroups.length > 0) {
      setSelectedGroupId(myGroups[0].id);
      setHasDefaulted(true);
    }
  }, [myGroups, hasDefaulted]);

  useEffect(() => {
    if (selectedGroupId === GENERAL) {
      setGroupMembers([]);
      return;
    }
    const unsubscribe = subscribeToGroupMembers(selectedGroupId, setGroupMembers);
    return () => unsubscribe();
  }, [selectedGroupId]);

  if (!users || !settings) return <LoadingSpinner />;

  const selectedGroup = myGroups.find((g) => g.id === selectedGroupId) ?? null;
  const picksByUid = Object.fromEntries(picks.map((p) => [p.uid, p]));

  const scopedUsers = selectedGroup
    ? users.filter((u) =>
        groupMembers.some((m) => m.uid === u.uid && m.status === 'approved')
      )
    : users;

  const prizeConfig = selectedGroup ?? settings;
  const entries = buildLeaderboardEntries(scopedUsers, picksByUid, settings.finalists, prizeConfig.championBonus, livePointsByUid);
  const ranked = calculateWinners(entries, prizeConfig);
  const hasPrizePool = prizeConfig.prizePool > 0;

  return (
    <div className="page">
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Tabla de Posiciones</h1>
        {myGroups.length > 0 && (
          <select
            className="input"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value={GENERAL}>General</option>
            {myGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        )}
      </div>

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
                <td>
                  {u.totalPoints}
                  {!!u.livePoints && u.livePoints > 0 && (
                    <span className="badge badge-live" style={{ marginLeft: '0.4rem' }}>
                      +{u.livePoints} en vivo
                    </span>
                  )}
                </td>
                {hasPrizePool && (
                  <td>{u.prize > 0 ? formatCurrency(u.prize, prizeConfig.currency) : '—'}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {ranked.length === 0 && (
          <p className="muted center">
            {selectedGroup ? 'Todavía no hay miembros aprobados en este grupo.' : 'Todavía no hay jugadores registrados.'}
          </p>
        )}
      </div>
    </div>
  );
}
