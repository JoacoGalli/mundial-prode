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
  const predictionPoints = predsSnap.docs.reduce((sum, d) => {
    const points = (d.data().points as number | null) ?? 0;
    return sum + points;
  }, 0);

  await updateDoc(doc(db, 'users', uid), { predictionPoints });
}

export async function lockMatch(matchId: string, locked: boolean) {
  await updateDoc(doc(db, 'matches', matchId), { locked });
}

/** Builds a key that identifies a fixture regardless of home/away order. */
function fixtureKey(apiTeamA: string, apiTeamB: string, round: string): string {
  return `${round}:${[apiTeamA, apiTeamB].sort().join('|')}`;
}

/**
 * Pull the latest World Cup 2026 schedule from TheSportsDB and add any
 * matches that aren't in Firestore yet (matched by team pair + round) — e.g.
 * once the knockout bracket gets published. Returns how many matches were
 * added.
 */
export async function syncFixtureFromApi(): Promise<number> {
  const [fixtures, existingSnap] = await Promise.all([
    fetchSeasonEvents(),
    getDocs(matchesCol),
  ]);

  const existingKeys = new Set(
    existingSnap.docs
      .map((d) => {
        const data = d.data() as Match;
        if (!data.apiTeamA || !data.apiTeamB) return null;
        return fixtureKey(data.apiTeamA, data.apiTeamB, data.round);
      })
      .filter((k): k is string => k !== null)
  );

  const newFixtures = fixtures.filter(
    (f) => !existingKeys.has(fixtureKey(f.apiTeamA, f.apiTeamB, f.round))
  );
  if (newFixtures.length === 0) return 0;

  const now = Date.now();
  const batch = writeBatch(db);
  newFixtures.forEach((f) => {
    const datetime = Timestamp.fromDate(new Date(f.datetime));
    const ref = doc(matchesCol);
    batch.set(ref, {
      teamA: f.teamA,
      teamB: f.teamB,
      apiTeamA: f.apiTeamA,
      apiTeamB: f.apiTeamB,
      datetime,
      stage: f.stage,
      round: f.round,
      result: null,
      locked: datetime.toMillis() < now,
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
      apiTeamA: m.apiTeamA,
      apiTeamB: m.apiTeamB,
      datetime,
      stage: m.stage,
      round: m.round,
      result: null,
      locked: datetime.toMillis() < now,
    });
  });
  await batch.commit();
}

/**
 * Delete every match and prediction, then reseed the full 72-match group
 * stage fixture (Fecha 1-3, groups A-L). Destructive — admin only, used to
 * upgrade an old/partial fixture to the full schedule.
 */
export async function replaceFixtureWithFullGroupStage() {
  const [matchesSnap, predsSnap, usersSnap] = await Promise.all([
    getDocs(matchesCol),
    getDocs(collection(db, 'predictions')),
    getDocs(collection(db, 'users')),
  ]);

  const docsToDelete = [...matchesSnap.docs, ...predsSnap.docs];
  for (let i = 0; i < docsToDelete.length; i += 500) {
    const batch = writeBatch(db);
    docsToDelete.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  await seedMatchesToFirestore();

  await Promise.all(usersSnap.docs.map((d) => recalculateUserTotalPoints(d.id)));
}
