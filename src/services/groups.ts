import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Group, GroupMember, UserProfile } from '../types';

const groupsCol = collection(db, 'groups');

// Avoid visually ambiguous characters (0/O, 1/I, etc.)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateInviteCode(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
}

function toGroup(snap: { id: string; data: () => unknown }): Group {
  return { id: snap.id, ...(snap.data() as Omit<Group, 'id'>) };
}

/** Creates a group owned/administered by `uid`, who also becomes its first approved member. */
export async function createGroup(
  uid: string,
  profile: Pick<UserProfile, 'name' | 'photoURL'>,
  name: string
): Promise<string> {
  const groupRef = doc(groupsCol);
  await setDoc(groupRef, {
    name,
    ownerUid: uid,
    adminUIDs: [uid],
    inviteCode: generateInviteCode(),
    prizePool: 0,
    currency: 'ARS',
    distribution: [70, 30],
    championBonus: 25,
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, 'groups', groupRef.id, 'members', uid), {
    uid,
    name: profile.name,
    photoURL: profile.photoURL,
    status: 'approved',
    joinedAt: serverTimestamp(),
  });
  return groupRef.id;
}

/** Every group that exists, e.g. for the global admin's "all groups" view. */
export function subscribeToAllGroups(callback: (groups: Group[]) => void) {
  return onSnapshot(
    groupsCol,
    (snap) => {
      callback(snap.docs.map(toGroup));
    },
    (error) => {
      console.error('subscribeToAllGroups error:', error);
      callback([]);
    }
  );
}

export function subscribeToGroup(groupId: string, callback: (group: Group | null) => void) {
  return onSnapshot(
    doc(db, 'groups', groupId),
    (snap) => {
      callback(snap.exists() ? toGroup(snap) : null);
    },
    (error) => {
      console.error(`subscribeToGroup(${groupId}) error:`, error);
      callback(null);
    }
  );
}

/** All members (pending + approved) of a group, e.g. for the group admin panel. */
export function subscribeToGroupMembers(groupId: string, callback: (members: GroupMember[]) => void) {
  return onSnapshot(
    collection(db, 'groups', groupId, 'members'),
    (snap) => {
      callback(snap.docs.map((d) => d.data() as GroupMember));
    },
    (error) => {
      console.error(`subscribeToGroupMembers(${groupId}) error:`, error);
      callback([]);
    }
  );
}

/** Every group membership (pending or approved) belonging to `uid`. */
export function subscribeToMyMemberships(
  uid: string,
  callback: (rows: { groupId: string; status: GroupMember['status'] }[]) => void
) {
  const q = query(collectionGroup(db, 'members'), where('uid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => ({
          groupId: d.ref.parent.parent!.id,
          status: (d.data() as GroupMember).status,
        }))
      );
    },
    (error) => {
      console.error('subscribeToMyMemberships error:', error);
      callback([]);
    }
  );
}

export async function findGroupByInviteCode(code: string): Promise<Group | null> {
  const q = query(groupsCol, where('inviteCode', '==', code), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return toGroup(snap.docs[0]);
}

/**
 * Joins `uid` to `groupId` as an approved member, proving authorization by
 * presenting the group's current invite code (Firestore rules check it
 * matches `groups/{groupId}.inviteCode`). Having the code or link IS the
 * authorization, so this requires no admin approval.
 */
export async function joinGroupWithCode(
  groupId: string,
  inviteCode: string,
  uid: string,
  profile: Pick<UserProfile, 'name' | 'photoURL'>
) {
  await setDoc(
    doc(db, 'groups', groupId, 'members', uid),
    {
      uid,
      name: profile.name,
      photoURL: profile.photoURL,
      status: 'approved',
      inviteCode,
      joinedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/** Admin-only: adds any user as an approved member of a group, no invite code needed. */
export async function addMemberToGroup(
  groupId: string,
  profile: Pick<UserProfile, 'uid' | 'name' | 'photoURL'>
) {
  await setDoc(doc(db, 'groups', groupId, 'members', profile.uid), {
    uid: profile.uid,
    name: profile.name,
    photoURL: profile.photoURL,
    status: 'approved',
    joinedAt: serverTimestamp(),
  });
}

export async function removeMember(groupId: string, uid: string) {
  await deleteDoc(doc(db, 'groups', groupId, 'members', uid));
}

/** Admin-only: permanently deletes a group and all of its membership docs. */
export async function deleteGroup(groupId: string) {
  const membersSnap = await getDocs(collection(db, 'groups', groupId, 'members'));

  for (let i = 0; i < membersSnap.docs.length; i += 500) {
    const batch = writeBatch(db);
    membersSnap.docs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  await deleteDoc(doc(db, 'groups', groupId));
}

export async function leaveGroup(groupId: string, uid: string) {
  await deleteDoc(doc(db, 'groups', groupId, 'members', uid));
}

export async function updateGroupSettings(
  groupId: string,
  data: Partial<Pick<Group, 'name' | 'prizePool' | 'currency' | 'distribution' | 'championBonus'>>
) {
  await updateDoc(doc(db, 'groups', groupId), data);
}

export async function regenerateInviteCode(groupId: string): Promise<string> {
  const inviteCode = generateInviteCode();
  await updateDoc(doc(db, 'groups', groupId), { inviteCode });
  return inviteCode;
}
