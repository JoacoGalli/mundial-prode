import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { updateSettings } from './settings';
import { recalculateUserTotalPoints } from './matches';
import type { ChampionPick } from '../types';

const championPicksCol = collection(db, 'championPicks');

export function subscribeToChampionPick(
  uid: string,
  callback: (pick: ChampionPick | null) => void
) {
  return onSnapshot(doc(championPicksCol, uid), (snap) => {
    callback(snap.exists() ? (snap.data() as ChampionPick) : null);
  });
}

export function subscribeToAllChampionPicks(callback: (picks: ChampionPick[]) => void) {
  return onSnapshot(championPicksCol, (snap) => {
    callback(snap.docs.map((d) => d.data() as ChampionPick));
  });
}

export async function saveChampionPick(uid: string, team: string) {
  await setDoc(doc(championPicksCol, uid), { uid, team, points: null }, { merge: true });
}

export async function toggleChampionPicksLocked(locked: boolean) {
  await updateSettings({ championPicksLocked: locked });
}

/**
 * Admin: declare the official World Cup champion. Awards `championBonus`
 * points to every user whose pick matches, recalculates everyone's
 * totalPoints, and locks further changes to picks.
 */
export async function setChampion(team: string, championBonus: number) {
  await updateSettings({ champion: team, championPicksLocked: true });

  const picksSnap = await getDocs(championPicksCol);
  const batch = writeBatch(db);
  picksSnap.docs.forEach((d) => {
    const pick = d.data() as ChampionPick;
    const points = pick.team === team ? championBonus : 0;
    batch.update(d.ref, { points });
  });
  await batch.commit();

  await Promise.all(picksSnap.docs.map((d) => recalculateUserTotalPoints(d.id)));
}
