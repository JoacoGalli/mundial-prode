import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { updateSettings } from './settings';
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
  await setDoc(doc(championPicksCol, uid), { uid, team }, { merge: true });
}

export async function toggleChampionPicksLocked(locked: boolean) {
  await updateSettings({ championPicksLocked: locked });
}

/**
 * Admin: declare the official World Cup champion and lock further changes
 * to picks. Champion bonus points are computed on the fly wherever a
 * leaderboard is rendered, so no recalculation is needed here.
 */
export async function setChampion(team: string) {
  await updateSettings({ champion: team, championPicksLocked: true });
}
