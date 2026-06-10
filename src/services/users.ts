import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile } from '../types';

export function subscribeToLeaderboard(callback: (users: UserProfile[]) => void) {
  return onSnapshot(collection(db, 'users'), (snap) => {
    const users = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<UserProfile, 'uid'>) }));
    callback(users);
  });
}
