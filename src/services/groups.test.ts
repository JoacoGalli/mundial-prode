import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockBatchDelete = vi.fn();
const mockBatchCommit = vi.fn().mockResolvedValue(undefined);

vi.mock('../lib/firebase', () => ({ db: {} }));

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    collection: vi.fn((...args: unknown[]) => ({ type: 'collection', args })),
    collectionGroup: vi.fn((...args: unknown[]) => ({ type: 'collectionGroup', args })),
    doc: vi.fn((...args: unknown[]) => ({ type: 'doc', args, id: 'mock-id' })),
    query: vi.fn((...args: unknown[]) => ({ type: 'query', args })),
    where: vi.fn((...args: unknown[]) => ({ type: 'where', args })),
    limit: vi.fn((...args: unknown[]) => ({ type: 'limit', args })),
    onSnapshot: vi.fn(),
    setDoc: mockSetDoc,
    updateDoc: mockUpdateDoc,
    deleteDoc: mockDeleteDoc,
    getDocs: mockGetDocs,
    writeBatch: vi.fn(() => ({ delete: mockBatchDelete, commit: mockBatchCommit })),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  };
});

const {
  generateInviteCode,
  createGroup,
  joinGroupWithCode,
  addMemberToGroup,
  deleteGroup,
  findGroupByInviteCode,
} = await import('./groups');

const profile = { uid: 'user-1', name: 'Ana', photoURL: 'https://example.com/ana.png' };

beforeEach(() => {
  vi.clearAllMocks();
  mockBatchCommit.mockResolvedValue(undefined);
});

describe('generateInviteCode', () => {
  it('defaults to a 6 character code', () => {
    expect(generateInviteCode()).toHaveLength(6);
  });

  it('respects a custom length', () => {
    expect(generateInviteCode(10)).toHaveLength(10);
  });

  it('only uses visually unambiguous uppercase letters and digits', () => {
    const code = generateInviteCode(200);
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
  });
});

describe('createGroup', () => {
  it('creates the group as approved with the creator as sole owner/admin', async () => {
    await createGroup('user-1', profile, 'Mi Grupo');

    expect(mockSetDoc).toHaveBeenCalledTimes(2);

    const [, groupData] = mockSetDoc.mock.calls[0];
    expect(groupData).toMatchObject({
      name: 'Mi Grupo',
      ownerUid: 'user-1',
      adminUIDs: ['user-1'],
    });
    expect(typeof groupData.inviteCode).toBe('string');

    const [, memberData] = mockSetDoc.mock.calls[1];
    expect(memberData).toMatchObject({
      uid: 'user-1',
      name: 'Ana',
      status: 'approved',
    });
  });
});

describe('joinGroupWithCode', () => {
  it('writes an approved membership with the invite code used to join', async () => {
    await joinGroupWithCode('group-1', 'ABC123', 'user-1', profile);

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [, data, options] = mockSetDoc.mock.calls[0];
    expect(data).toMatchObject({
      uid: 'user-1',
      status: 'approved',
      inviteCode: 'ABC123',
    });
    expect(options).toEqual({ merge: true });
  });
});

describe('addMemberToGroup', () => {
  it('adds the user as an approved member without requiring an invite code', async () => {
    await addMemberToGroup('group-1', profile);

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [, data] = mockSetDoc.mock.calls[0];
    expect(data).toMatchObject({
      uid: 'user-1',
      name: 'Ana',
      status: 'approved',
    });
  });
});

describe('deleteGroup', () => {
  it('deletes every member doc and then the group itself', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{ ref: 'member-1' }, { ref: 'member-2' }],
    });

    await deleteGroup('group-1');

    expect(mockBatchDelete).toHaveBeenCalledTimes(2);
    expect(mockBatchDelete).toHaveBeenCalledWith('member-1');
    expect(mockBatchDelete).toHaveBeenCalledWith('member-2');
    expect(mockBatchCommit).toHaveBeenCalled();
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });

  it('still deletes the group when it has no members', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await deleteGroup('group-1');

    expect(mockBatchDelete).not.toHaveBeenCalled();
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });
});

describe('findGroupByInviteCode', () => {
  it('returns null when no group matches the code', async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    expect(await findGroupByInviteCode('NOPE')).toBeNull();
  });

  it('returns the matching group', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: 'group-1', data: () => ({ name: 'Mi Grupo', inviteCode: 'ABC123' }) }],
    });
    const group = await findGroupByInviteCode('ABC123');
    expect(group).toMatchObject({ id: 'group-1', name: 'Mi Grupo', inviteCode: 'ABC123' });
  });
});
