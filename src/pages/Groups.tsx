import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Plus, Settings, Trash2, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  createGroup,
  deleteGroup,
  findGroupByInviteCode,
  joinGroupWithCode,
  subscribeToAllGroups,
  subscribeToGroup,
  subscribeToMyMemberships,
} from '../services/groups';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Group, GroupMember } from '../types';

type Membership = { groupId: string; status: GroupMember['status'] };

export default function Groups() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState<Membership[] | null>(null);
  const [groupsById, setGroupsById] = useState<Record<string, Group>>({});
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToMyMemberships(user.uid, setMemberships);
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = subscribeToAllGroups(setAllGroups);
    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (!memberships) return;
    const unsubscribers = memberships.map((m) =>
      subscribeToGroup(m.groupId, (g) => {
        setGroupsById((prev) => {
          if (!g) {
            const next = { ...prev };
            delete next[m.groupId];
            return next;
          }
          return { ...prev, [m.groupId]: g };
        });
      })
    );
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [memberships]);

  if (!memberships) return <LoadingSpinner />;

  const approved = memberships
    .filter((m) => m.status === 'approved')
    .map((m) => groupsById[m.groupId])
    .filter((g): g is Group => g != null);

  const extractCode = (input: string): string => {
    const trimmed = input.trim();
    const idx = trimmed.lastIndexOf('/');
    return (idx >= 0 ? trimmed.slice(idx + 1) : trimmed).toUpperCase();
  };

  const handleCreate = async () => {
    if (!user || !profile || !name.trim()) return;
    setCreating(true);
    try {
      const id = await createGroup(user.uid, profile, name.trim());
      setName('');
      navigate(`/groups/${id}`);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !profile || !code.trim()) return;
    setJoining(true);
    setJoinMessage(null);
    try {
      const inviteCode = extractCode(code);
      const group = await findGroupByInviteCode(inviteCode);
      if (!group) {
        setJoinMessage('No se encontró ningún grupo con ese código.');
        return;
      }
      const existing = memberships.find((m) => m.groupId === group.id);
      if (existing?.status === 'approved') {
        navigate(`/groups/${group.id}`);
        return;
      }
      await joinGroupWithCode(group.id, group.inviteCode, user.uid, profile);
      setCode('');
      navigate(`/groups/${group.id}`);
    } finally {
      setJoining(false);
    }
  };

  const handleDeleteGroup = async (group: Group) => {
    if (!confirm(`¿Eliminar el grupo "${group.name}" para siempre? Esta acción no se puede deshacer.`)) return;
    setDeletingId(group.id);
    try {
      await deleteGroup(group.id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Grupos</h1>

      <div className="card section">
        <h3 className="muted" style={{ marginBottom: '0.75rem' }}>Mis grupos</h3>
        {approved.length === 0 && <p className="muted">Todavía no formás parte de ningún grupo.</p>}
        {approved.map((g) => (
          <Link
            key={g.id}
            to={`/groups/${g.id}`}
            className="card"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--color-white)' }}
          >
            <span>{g.name}</span>
            <Users size={18} className="muted" />
          </Link>
        ))}
      </div>

      {isAdmin && (
        <div className="card section">
          <h3 className="muted" style={{ marginBottom: '0.75rem' }}>Todos los grupos (admin)</h3>
          {allGroups.length === 0 && <p className="muted">Todavía no hay grupos creados.</p>}
          {allGroups.map((g) => (
            <div key={g.id} className="flex-between" style={{ marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span>{g.name}</span>
              <div className="flex gap-sm">
                <Link className="btn btn-secondary" to={`/groups/${g.id}/admin`}>
                  <Settings size={16} /> Administrar
                </Link>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteGroup(g)}
                  disabled={deletingId === g.id}
                  title="Eliminar grupo"
                >
                  {deletingId === g.id ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card section">
        <h3 className="muted" style={{ marginBottom: '0.75rem' }}>Crear un grupo nuevo</h3>
        <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Nombre del grupo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ flex: '1 1 200px' }}
          />
          <button className="btn btn-primary" onClick={handleCreate} disabled={!name.trim() || creating}>
            {creating ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
            Crear grupo
          </button>
        </div>
      </div>

      <div className="card section">
        <h3 className="muted" style={{ marginBottom: '0.75rem' }}>Unirme a un grupo</h3>
        <p className="muted" style={{ fontSize: '0.85rem', marginTop: 0 }}>
          Pegá el código o el link de invitación que te compartió el dueño del grupo. Te unís al
          instante, sin esperar aprobación.
        </p>
        <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Código o link de invitación"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ flex: '1 1 200px' }}
          />
          <button className="btn btn-secondary" onClick={handleJoin} disabled={!code.trim() || joining}>
            {joining ? <Loader2 size={16} className="spin" /> : 'Unirme'}
          </button>
        </div>
        {joinMessage && <p className="muted" style={{ marginTop: '0.75rem', marginBottom: 0 }}>{joinMessage}</p>}
      </div>
    </div>
  );
}
