import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Check, Copy, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  regenerateInviteCode,
  removeMember,
  subscribeToGroup,
  subscribeToGroupMembers,
  updateGroupSettings,
} from '../services/groups';
import PrizeSettings from '../components/admin/PrizeSettings';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Group, GroupMember } from '../types';

export default function GroupAdmin() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null | undefined>(undefined);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [bonus, setBonus] = useState(0);
  const [savingBonus, setSavingBonus] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = subscribeToGroup(groupId, (g) => {
      setGroup(g);
      if (g) {
        setName(g.name);
        setBonus(g.championBonus);
      }
    });
    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = subscribeToGroupMembers(groupId, setMembers);
    return () => unsubscribe();
  }, [groupId]);

  if (group === undefined) return <LoadingSpinner />;
  if (!group || !groupId) return <Navigate to="/groups" replace />;
  if (!user || !group.adminUIDs.includes(user.uid)) return <Navigate to={`/groups/${groupId}`} replace />;

  const approved = members.filter((m) => m.status === 'approved');
  const inviteLink = `${window.location.origin}${import.meta.env.BASE_URL}#/join/${group.inviteCode}`;

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setSavingName(true);
    try {
      await updateGroupSettings(group.id, { name: name.trim() });
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveBonus = async () => {
    setSavingBonus(true);
    try {
      await updateGroupSettings(group.id, { championBonus: bonus });
    } finally {
      setSavingBonus(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(group.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  const handleRegenerate = async () => {
    if (!confirm('¿Generar un nuevo código de invitación? El link anterior dejará de funcionar.')) return;
    setRegenerating(true);
    try {
      await regenerateInviteCode(group.id);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Administrar grupo</h1>
      <Link to={`/groups/${group.id}`} className="muted">← Volver a {group.name}</Link>

      <div className="card section" style={{ marginTop: '1rem' }}>
        <h3 className="muted" style={{ marginBottom: '0.75rem' }}>Nombre del grupo</h3>
        <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ flex: '1 1 200px' }}
          />
          <button className="btn btn-primary" onClick={handleSaveName} disabled={!name.trim() || savingName}>
            {savingName ? <Loader2 size={16} className="spin" /> : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="card section">
        <h3 className="muted" style={{ marginBottom: '0.75rem' }}>Invitar gente</h3>
        <p className="muted" style={{ fontSize: '0.85rem', marginTop: 0 }}>
          Cualquiera con el link o el código se une al grupo al instante, sin que tengas que
          aprobar nada.
        </p>
        <div className="flex gap-sm" style={{ flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' }}>
          <input className="input" value={inviteLink} readOnly style={{ flex: '1 1 240px' }} />
          <button className="btn btn-secondary" onClick={handleCopyLink}>
            {copiedLink ? <Check size={16} /> : <Copy size={16} />}
            {copiedLink ? 'Copiado' : 'Copiar link'}
          </button>
        </div>
        <div className="flex gap-sm" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input"
            value={group.inviteCode}
            readOnly
            style={{ flex: '1 1 120px', fontFamily: 'monospace', letterSpacing: '0.1em' }}
          />
          <button className="btn btn-secondary" onClick={handleCopyCode}>
            {copiedCode ? <Check size={16} /> : <Copy size={16} />}
            {copiedCode ? 'Copiado' : 'Copiar código'}
          </button>
          <button className="btn btn-secondary" onClick={handleRegenerate} disabled={regenerating}>
            {regenerating ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
            Regenerar código
          </button>
        </div>
      </div>

      <PrizeSettings
        prizePool={group.prizePool}
        currency={group.currency}
        distribution={group.distribution}
        onSave={(data) => updateGroupSettings(group.id, data)}
      />

      <div className="card section">
        <h3 className="muted" style={{ marginBottom: '0.75rem' }}>Bonus por acertar el campeón</h3>
        <p className="muted" style={{ fontSize: '0.85rem', marginTop: 0 }}>
          Puntos extra que suman, en la tabla de este grupo, los miembros cuyo pronóstico de
          campeón coincida con el campeón real del Mundial.
        </p>
        <div className="flex gap-sm">
          <input
            className="input"
            type="number"
            min={0}
            value={bonus}
            onChange={(e) => setBonus(Math.max(0, Number(e.target.value) || 0))}
            style={{ width: '6rem' }}
          />
          <button className="btn btn-secondary" onClick={handleSaveBonus} disabled={savingBonus}>
            {savingBonus ? <Loader2 size={16} className="spin" /> : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="card section">
        <h3 className="muted" style={{ marginBottom: '0.75rem' }}>Miembros</h3>
        {approved.map((m) => (
          <div key={m.uid} className="flex-between" style={{ marginBottom: '0.5rem' }}>
            <div className="flex gap-sm" style={{ alignItems: 'center' }}>
              {m.photoURL && (
                <img src={m.photoURL} alt={m.name} style={{ width: 28, height: 28, borderRadius: '50%' }} />
              )}
              <span>{m.name}</span>
              {m.uid === group.ownerUid && <span className="badge badge-points">Dueño</span>}
            </div>
            {m.uid !== group.ownerUid && (
              <button className="btn btn-secondary" onClick={() => removeMember(group.id, m.uid)} title="Quitar">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
