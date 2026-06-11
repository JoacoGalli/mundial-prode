import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
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

export async function savePrediction(
  uid: string,
  matchId: string,
  home: number,
  away: number
) {
  const ref = doc(db, 'predictions', `${uid}_${matchId}`);
  await setDoc(
    ref,
    {
      uid,
      matchId,
      home,
      away,
      points: null,
      scoredAt: null,
    },
    { merge: true }
  );
}
