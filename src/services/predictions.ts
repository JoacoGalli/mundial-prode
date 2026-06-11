import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Prediction } from '../types';

export function subscribeToUserPredictions(
  uid: string,
  callback: (predictions: Prediction[]) => void
) {
  const q = query(collection(db, 'predictions'), where('uid', '==', uid));
  return onSnapshot(q, (snap) => {
    const predictions = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Prediction, 'id'>),
    }));
    callback(predictions);
  });
}

/** Every prediction submitted for a given match, e.g. to show what others picked once it locks. */
export function subscribeToMatchPredictions(
  matchId: string,
  callback: (predictions: Prediction[]) => void
) {
  const q = query(collection(db, 'predictions'), where('matchId', '==', matchId));
  return onSnapshot(q, (snap) => {
    const predictions = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Prediction, 'id'>),
    }));
    callback(predictions);
  });
}

/** Every prediction for any of the given matches, e.g. to compute live partial points. */
export function subscribeToPredictionsForMatches(
  matchIds: string[],
  callback: (predictions: Prediction[]) => void
) {
  if (matchIds.length === 0) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, 'predictions'), where('matchId', 'in', matchIds));
  return onSnapshot(q, (snap) => {
    const predictions = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Prediction, 'id'>),
    }));
    callback(predictions);
  });
}

/** Saves several predictions for `uid` in a single batch, e.g. "save all" for a round. */
export async function savePredictions(
  uid: string,
  items: { matchId: string; home: number; away: number }[]
) {
  const batch = writeBatch(db);
  for (const { matchId, home, away } of items) {
    const ref = doc(db, 'predictions', `${uid}_${matchId}`);
    batch.set(ref, { uid, matchId, home, away, points: null, scoredAt: null }, { merge: true });
  }
  await batch.commit();
}
