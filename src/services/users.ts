import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile } from '../types';

export function subscribeToLeaderboard(callback: (users: UserProfile[]) => void) {
  const q = query(collection(db, 'users'), orderBy('totalPoints', 'desc'));
  return onSnapshot(q, (snap) => {
    const users = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<UserProfile, 'uid'>) }));
    callback(users);
  });
}
