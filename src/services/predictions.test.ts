import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSetDoc = vi.fn();
const mockOnSnapshot = vi.fn();
const mockWhere = vi.fn((...args: unknown[]) => ({ type: 'where', args }));
const mockDoc = vi.fn((...args: unknown[]) => ({ type: 'doc', args }));

vi.mock('../lib/firebase', () => ({ db: {} }));

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    collection: vi.fn((...args: unknown[]) => ({ type: 'collection', args })),
    doc: mockDoc,
    query: vi.fn((...args: unknown[]) => ({ type: 'query', args })),
    where: mockWhere,
    onSnapshot: mockOnSnapshot,
    setDoc: mockSetDoc,
  };
});

const { savePrediction, subscribeToUserPredictions, subscribeToMatchPredictions } = await import(
  './predictions'
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('savePrediction', () => {
  it('writes the prediction with null points/scoredAt to be filled in once the match ends', async () => {
    await savePrediction('user-1', 'match-1', 2, 1);

    expect(mockDoc).toHaveBeenCalledWith({}, 'predictions', 'user-1_match-1');
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [, data, options] = mockSetDoc.mock.calls[0];
    expect(data).toEqual({
      uid: 'user-1',
      matchId: 'match-1',
      home: 2,
      away: 1,
      points: null,
      scoredAt: null,
    });
    expect(options).toEqual({ merge: true });
  });
});

describe('subscribeToUserPredictions', () => {
  it('queries predictions by uid and maps the results', () => {
    const callback = vi.fn();
    mockOnSnapshot.mockImplementation((_q, onNext) => {
      onNext({
        docs: [{ id: 'user-1_match-1', data: () => ({ uid: 'user-1', matchId: 'match-1', home: 1, away: 0, points: null, scoredAt: null }) }],
      });
      return () => {};
    });

    subscribeToUserPredictions('user-1', callback);

    expect(mockWhere).toHaveBeenCalledWith('uid', '==', 'user-1');
    expect(callback).toHaveBeenCalledWith([
      { id: 'user-1_match-1', uid: 'user-1', matchId: 'match-1', home: 1, away: 0, points: null, scoredAt: null },
    ]);
  });
});

describe('subscribeToMatchPredictions', () => {
  it('queries predictions by matchId and maps the results', () => {
    const callback = vi.fn();
    mockOnSnapshot.mockImplementation((_q, onNext) => {
      onNext({
        docs: [
          { id: 'user-1_match-1', data: () => ({ uid: 'user-1', matchId: 'match-1', home: 1, away: 0, points: 7, scoredAt: null }) },
          { id: 'user-2_match-1', data: () => ({ uid: 'user-2', matchId: 'match-1', home: 0, away: 0, points: 0, scoredAt: null }) },
        ],
      });
      return () => {};
    });

    subscribeToMatchPredictions('match-1', callback);

    expect(mockWhere).toHaveBeenCalledWith('matchId', '==', 'match-1');
    expect(callback).toHaveBeenCalledWith([
      { id: 'user-1_match-1', uid: 'user-1', matchId: 'match-1', home: 1, away: 0, points: 7, scoredAt: null },
      { id: 'user-2_match-1', uid: 'user-2', matchId: 'match-1', home: 0, away: 0, points: 0, scoredAt: null },
    ]);
  });
});
