import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AppSettings } from '../types';

export async function updateSettings(data: Partial<AppSettings>) {
  await updateDoc(doc(db, 'config', 'settings'), data);
}
