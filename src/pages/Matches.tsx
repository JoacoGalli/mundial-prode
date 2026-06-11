import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { subscribeToMatches } from '../services/matches';
import { subscribeToUserPredictions, savePredictions } from '../services/predictions';
import { subscribeToLeaderboard } from '../services/users';
import { subscribeToAllGroups, subscribeToGroupMembers, subscribeToMyMemberships } from '../services/groups';
import { useAuth } from '../contexts/AuthContext';
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { isMatchLocked } from '../utils/format';
import { ROUNDS, getDefaultRound } from '../utils/rounds';
import type { Group, GroupMember, Match, Prediction, Round, UserProfile } from '../types';

const GENERAL = 'general';

export default function Matches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { home: number; away: number }>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<string[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(GENERAL);
  const [hasDefaulted, setHasDefaulted] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToMatches(setMatches);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserPredictions(user.uid, setPredictions);
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard(setUsers);
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

  if (!matches) return <LoadingSpinner />;

  const selectedGroup = myGroups.find((g) => g.id === selectedGroupId) ?? null;
  const predictionByMatch = new Map(predictions.map((p) => [p.matchId, p]));
  const scopedUsers = selectedGroup
    ? users.filter((u) => groupMembers.some((m) => m.uid === u.uid && m.status === 'approved'))
    : users;
  const usersById = Object.fromEntries(scopedUsers.map((u) => [u.uid, u]));
  const round = selectedRound ?? getDefaultRound(matches);
  const matchesInRound = matches.filter((m) => m.round === round);
  const openMatches = matchesInRound.filter((m) => !isMatchLocked(m));

  const handleSaveAll = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await savePredictions(
        user.uid,
        openMatches.map((m) => {
          const draft = drafts[m.id];
          const prediction = predictionByMatch.get(m.id);
          return {
            matchId: m.id,
            home: draft?.home ?? prediction?.home ?? 0,
            away: draft?.away ?? prediction?.away ?? 0,
          };
        })
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Partidos</h1>

      <select
        className="input"
        value={round}
        onChange={(e) => setSelectedRound(e.target.value as Round)}
        style={{ marginBottom: myGroups.length > 0 ? '0.75rem' : '1rem', width: '100%' }}
      >
        {ROUNDS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      {myGroups.length > 0 && (
        <select
          className="input"
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          style={{ marginBottom: '1rem', width: '100%' }}
        >
          <option value={GENERAL}>Pronósticos: General</option>
          {myGroups.map((g) => (
            <option key={g.id} value={g.id}>
              Pronósticos: {g.name}
            </option>
          ))}
        </select>
      )}

      {matches.length === 0 && (
        <p className="muted">Todavía no hay partidos cargados. Pedile al admin que cargue el fixture.</p>
      )}

      {matches.length > 0 && matchesInRound.length === 0 && (
        <p className="muted">Todavía no hay partidos cargados para "{round}".</p>
      )}

      {matchesInRound.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          prediction={predictionByMatch.get(match.id)}
          usersById={usersById}
          onChange={
            user && !isMatchLocked(match)
              ? (home, away) => setDrafts((d) => ({ ...d, [match.id]: { home, away } }))
              : undefined
          }
        />
      ))}

      {user && openMatches.length > 0 && (
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '1rem' }}
          onClick={handleSaveAll}
          disabled={saving}
        >
          {saving ? <Loader2 size={16} className="spin" /> : saved ? <Check size={16} /> : null}
          {saved ? 'Pronósticos guardados' : 'Guardar pronósticos'}
        </button>
      )}
    </div>
  );
}
