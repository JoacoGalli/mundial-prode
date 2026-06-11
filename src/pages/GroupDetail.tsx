import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, LogOut, Settings, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { leaveGroup, subscribeToGroup, subscribeToGroupMembers } from '../services/groups';
import { subscribeToLeaderboard } from '../services/users';
import { subscribeToAllChampionPicks } from '../services/championPicks';
import { useLivePoints } from '../hooks/useLivePoints';
import { buildLeaderboardEntries, calculateWinners } from '../utils/prizes';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import type { ChampionPick, Group, GroupMember, UserProfile } from '../types';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user, settings, isAdmin: isGlobalAdmin } = useAuth();
  const { livePointsByUid } = useLivePoints();
  const [group, setGroup] = useState<Group | null | undefined>(undefined);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [picks, setPicks] = useState<ChampionPick[]>([]);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = subscribeToGroup(groupId, setGroup);
    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = subscribeToGroupMembers(groupId, setMembers);
    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard(setUsers);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAllChampionPicks(setPicks);
    return () => unsubscribe();
  }, []);

  if (group === undefined || !settings) return <LoadingSpinner />;

  if (!group) {
    return (
      <div className="page">
        <h1 className="page-title">Grupo</h1>
        <p className="muted">Este grupo no existe o ya no está disponible.</p>
      </div>
    );
  }

  const approvedUids = new Set(members.filter((m) => m.status === 'approved').map((m) => m.uid));
  const groupUsers = users.filter((u) => approvedUids.has(u.uid));
  const picksByUid = Object.fromEntries(picks.map((p) => [p.uid, p]));
  const entries = buildLeaderboardEntries(groupUsers, picksByUid, settings.finalists, group.championBonus, livePointsByUid);
  const ranked = calculateWinners(entries, group);
  const hasPrizePool = group.prizePool > 0;
  const isMember = !!user && members.some((m) => m.uid === user.uid && m.status === 'approved');
  const canManage = (!!user && group.adminUIDs.includes(user.uid)) || isGlobalAdmin;
  const isOwner = !!user && group.ownerUid === user.uid;

  const handleLeave = async () => {
    if (!user) return;
    if (!confirm(`¿Salir del grupo "${group.name}"?`)) return;
    setLeaving(true);
    try {
      await leaveGroup(group.id, user.uid);
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="page">
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>{group.name}</h1>
        <div className="flex gap-sm">
          {canManage && (
            <Link className="btn btn-secondary" to={`/groups/${group.id}/admin`}>
              <Settings size={16} /> Administrar
            </Link>
          )}
          {!isOwner && isMember && (
            <button className="btn btn-secondary" onClick={handleLeave} disabled={leaving}>
              {leaving ? <Loader2 size={16} className="spin" /> : <LogOut size={16} />}
              Salir
            </button>
          )}
        </div>
      </div>

      {hasPrizePool && (
        <div className="card section">
          <div className="flex-between">
            <div>
              <div className="muted">Pozo total</div>
              <h2 style={{ fontSize: '2rem', color: 'var(--color-gold)' }}>
                {formatCurrency(group.prizePool, group.currency)}
              </h2>
            </div>
            <Trophy size={40} color="var(--color-gold)" />
          </div>
        </div>
      )}

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
                  <td>{u.prize > 0 ? formatCurrency(u.prize, group.currency) : '—'}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {ranked.length === 0 && <p className="muted center">Todavía no hay miembros aprobados en este grupo.</p>}
      </div>
    </div>
  );
}
