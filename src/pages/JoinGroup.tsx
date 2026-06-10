import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { findGroupByInviteCode, requestToJoinGroup, subscribeToMyMemberships } from '../services/groups';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Group, GroupMember } from '../types';

export default function JoinGroup() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user, profile } = useAuth();
  const [group, setGroup] = useState<Group | null | undefined>(undefined);
  const [memberships, setMemberships] = useState<{ groupId: string; status: GroupMember['status'] }[] | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (!inviteCode) return;
    findGroupByInviteCode(inviteCode.toUpperCase()).then(setGroup);
  }, [inviteCode]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToMyMemberships(user.uid, setMemberships);
    return () => unsubscribe();
  }, [user]);

  if (group === undefined || !memberships) return <LoadingSpinner />;

  if (!group) {
    return (
      <div className="page">
        <h1 className="page-title">Unirse a un grupo</h1>
        <p className="muted">Ese link de invitación no es válido o el grupo ya no existe.</p>
      </div>
    );
  }

  const membership = memberships.find((m) => m.groupId === group.id);
  if (membership?.status === 'approved') return <Navigate to={`/groups/${group.id}`} replace />;

  const handleJoin = async () => {
    if (!user || !profile) return;
    setRequesting(true);
    try {
      await requestToJoinGroup(group.id, user.uid, profile);
      setRequested(true);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Unirse a un grupo</h1>
      <div className="card">
        <h3 style={{ marginBottom: '0.75rem' }}>{group.name}</h3>
        {membership?.status === 'pending' || requested ? (
          <p className="muted" style={{ marginBottom: 0 }}>
            Tu solicitud está pendiente de aprobación de un admin del grupo.
          </p>
        ) : (
          <>
            <p className="muted">
              Te invitaron a unirte a este grupo. Un admin del grupo tiene que aprobar tu solicitud.
            </p>
            <button className="btn btn-primary" onClick={handleJoin} disabled={requesting}>
              {requesting ? <Loader2 size={16} className="spin" /> : 'Solicitar unirme'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
