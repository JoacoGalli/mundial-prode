import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { calculatePoints } from '../utils/scoring';
import type { Match, MatchResult } from '../types';
import { seedMatches } from '../data/matches';

const matchesCol = collection(db, 'matches');

export function subscribeToMatches(callback: (matches: Match[]) => void) {
  const q = query(matchesCol, orderBy('datetime', 'asc'));
  return onSnapshot(q, (snap) => {
    const matches = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Match, 'id'>) }));
    callback(matches);
  });
}

/**
 * Set the official result for a match, lock it, and recalculate points
 * for every prediction submitted for that match.
 */
export async function setMatchResult(matchId: string, result: MatchResult) {
  const matchRef = doc(db, 'matches', matchId);
  await updateDoc(matchRef, { result, locked: true });

  // Recalculate points for all predictions on this match
  const predsQuery = query(collection(db, 'predictions'), where('matchId', '==', matchId));
  const predsSnap = await getDocs(predsQuery);

  const batch = writeBatch(db);
  const affectedUIDs = new Set<string>();

  predsSnap.docs.forEach((predDoc) => {
    const pred = predDoc.data() as { uid: string; home: number; away: number };
    const points = calculatePoints({ home: pred.home, away: pred.away }, result);
    batch.update(predDoc.ref, { points, scoredAt: Timestamp.now() });
    affectedUIDs.add(pred.uid);
  });

  await batch.commit();

  // Recompute total points for every affected user
  await Promise.all([...affectedUIDs].map((uid) => recalculateUserTotalPoints(uid)));
}

export async function recalculateUserTotalPoints(uid: string) {
  const predsQuery = query(collection(db, 'predictions'), where('uid', '==', uid));
  const predsSnap = await getDocs(predsQuery);
  const total = predsSnap.docs.reduce((sum, d) => {
    const points = (d.data().points as number | null) ?? 0;
    return sum + points;
  }, 0);
  await updateDoc(doc(db, 'users', uid), { totalPoints: total });
}

export async function lockMatch(matchId: string, locked: boolean) {
  await updateDoc(doc(db, 'matches', matchId), { locked });
}

/** Push the World Cup 2026 group-stage fixtures into Firestore (admin only). */
export async function seedMatchesToFirestore() {
  const now = Date.now();
  const batch = writeBatch(db);
  seedMatches.forEach((m) => {
    const datetime = Timestamp.fromDate(new Date(m.datetime));
    const ref = doc(matchesCol);
    batch.set(ref, {
      teamA: m.teamA,
      teamB: m.teamB,
      datetime,
      stage: m.stage,
      result: null,
      locked: datetime.toMillis() < now,
      externalId: m.externalId,
    });
  });
  await batch.commit();
}
