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
import { fetchSeasonEvents } from './sportsApi';

const matchesCol = collection(db, 'matches');

export function subscribeToMatches(callback: (matches: Match[]) => void) {
  const q = query(matchesCol, orderBy('datetime', 'asc'));
  return onSnapshot(q, (snap) => {
    const matches = snap.docs.map((d) => {
      const data = d.data() as Omit<Match, 'id'>;
      return { id: d.id, ...data, round: data.round ?? 'Fecha 1' } as Match;
    });
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

/**
 * Pull the latest World Cup 2026 schedule from TheSportsDB and add any
 * matches that aren't in Firestore yet (matched by externalId) — e.g. once
 * matchday 2/3 or the knockout bracket gets published. Returns how many
 * matches were added.
 */
export async function syncFixtureFromApi(): Promise<number> {
  const [fixtures, existingSnap] = await Promise.all([
    fetchSeasonEvents(),
    getDocs(matchesCol),
  ]);

  const existingExternalIds = new Set(
    existingSnap.docs.map((d) => (d.data() as Match).externalId).filter(Boolean)
  );

  const newFixtures = fixtures.filter((f) => !existingExternalIds.has(f.externalId));
  if (newFixtures.length === 0) return 0;

  const now = Date.now();
  const batch = writeBatch(db);
  newFixtures.forEach((f) => {
    const datetime = Timestamp.fromDate(new Date(f.datetime));
    const ref = doc(matchesCol);
    batch.set(ref, {
      teamA: f.teamA,
      teamB: f.teamB,
      datetime,
      stage: f.stage,
      round: f.round,
      result: null,
      locked: datetime.toMillis() < now,
      externalId: f.externalId,
    });
  });
  await batch.commit();

  return newFixtures.length;
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
      round: m.round,
      result: null,
      locked: datetime.toMillis() < now,
      externalId: m.externalId,
    });
  });
  await batch.commit();
}
