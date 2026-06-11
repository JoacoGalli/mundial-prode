import { describe, expect, it } from 'vitest';
import { buildLeaderboardEntries, calculateWinners, getChampionPoints, getLivePointsByUid } from './prizes';
import type { Prediction } from '../types';

function makePrediction(overrides: Partial<Prediction> = {}): Prediction {
  return {
    id: 'pred-1',
    uid: 'a',
    matchId: 'm1',
    home: 0,
    away: 0,
    points: null,
    scoredAt: null,
    ...overrides,
  };
}

describe('getChampionPoints', () => {
  it('returns 0 when the finalists are not decided yet', () => {
    expect(getChampionPoints({ teams: ['Argentina', 'Brasil'] }, null, 25)).toBe(0);
  });

  it('returns 0 when the user made no pick', () => {
    expect(getChampionPoints(null, ['Argentina', 'Brasil'], 25)).toBe(0);
    expect(getChampionPoints(undefined, ['Argentina', 'Brasil'], 25)).toBe(0);
  });

  it('returns 0 when neither pick matches a finalist', () => {
    expect(getChampionPoints({ teams: ['Brasil', 'Francia'] }, ['Argentina', 'España'], 25)).toBe(0);
  });

  it('returns the bonus once when only one pick matches a finalist', () => {
    expect(getChampionPoints({ teams: ['Argentina', 'Brasil'] }, ['Argentina', 'España'], 25)).toBe(25);
  });

  it('returns the bonus twice when both picks match the finalists', () => {
    expect(getChampionPoints({ teams: ['Argentina', 'España'] }, ['Argentina', 'España'], 25)).toBe(50);
  });
});

describe('buildLeaderboardEntries', () => {
  const users = [
    { uid: 'a', name: 'Ana', photoURL: '', predictionPoints: 10 },
    { uid: 'b', name: 'Beto', photoURL: '', predictionPoints: 20 },
    { uid: 'c', name: 'Caro', photoURL: '', predictionPoints: 5 },
  ];

  it('adds the bonus per finalist correctly picked', () => {
    const picksByUid = {
      a: { uid: 'a', teams: ['Argentina', 'España'] },
      b: { uid: 'b', teams: ['Brasil', 'Francia'] },
    };
    const entries = buildLeaderboardEntries(users, picksByUid, ['Argentina', 'España'], 25);

    expect(entries.find((e) => e.uid === 'a')?.totalPoints).toBe(60);
    expect(entries.find((e) => e.uid === 'b')?.totalPoints).toBe(20);
    expect(entries.find((e) => e.uid === 'c')?.totalPoints).toBe(5);
  });

  it('does not add any bonus while the finalists are undecided', () => {
    const picksByUid = { a: { uid: 'a', teams: ['Argentina', 'España'] } };
    const entries = buildLeaderboardEntries(users, picksByUid, null, 25);
    expect(entries.find((e) => e.uid === 'a')?.totalPoints).toBe(10);
  });

  it('adds live points to the total and exposes them separately', () => {
    const livePointsByUid = { a: 12, b: 5 };
    const entries = buildLeaderboardEntries(users, {}, null, 25, livePointsByUid);

    expect(entries.find((e) => e.uid === 'a')).toMatchObject({ totalPoints: 22, livePoints: 12 });
    expect(entries.find((e) => e.uid === 'b')).toMatchObject({ totalPoints: 25, livePoints: 5 });
    expect(entries.find((e) => e.uid === 'c')).toMatchObject({ totalPoints: 5, livePoints: 0 });
  });
});

describe('getLivePointsByUid', () => {
  const liveMatches = [
    { id: 'm1', liveScore: { home: 2, away: 0 } },
    { id: 'm2', liveScore: { home: 1, away: 1 } },
    { id: 'm3', liveScore: null },
  ];

  it('sums live points per user for predictions on in-progress matches', () => {
    const predictions = [
      makePrediction({ uid: 'a', matchId: 'm1', home: 2, away: 0, points: null }), // exact -> 12
      makePrediction({ uid: 'a', matchId: 'm2', home: 1, away: 0, points: null }), // one score correct -> 2
      makePrediction({ uid: 'b', matchId: 'm1', home: 1, away: 0, points: null }), // correct winner + one score -> 7
    ];

    const result = getLivePointsByUid(liveMatches, predictions);

    expect(result.a).toBe(14);
    expect(result.b).toBe(7);
  });

  it('ignores predictions that already have final points', () => {
    const predictions = [makePrediction({ uid: 'a', matchId: 'm1', home: 2, away: 0, points: 12 })];
    expect(getLivePointsByUid(liveMatches, predictions)).toEqual({});
  });

  it('ignores predictions for matches without a live score', () => {
    const predictions = [makePrediction({ uid: 'a', matchId: 'm3', home: 1, away: 1, points: null })];
    expect(getLivePointsByUid(liveMatches, predictions)).toEqual({});
  });
});

describe('calculateWinners', () => {
  it('ranks users by total points, highest first', () => {
    const entries = [
      { uid: 'a', name: 'Ana', photoURL: '', totalPoints: 10 },
      { uid: 'b', name: 'Beto', photoURL: '', totalPoints: 30 },
      { uid: 'c', name: 'Caro', photoURL: '', totalPoints: 20 },
    ];
    const ranked = calculateWinners(entries, { prizePool: 1000, distribution: [70, 30] });

    expect(ranked.map((r) => r.uid)).toEqual(['b', 'c', 'a']);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('distributes the prize pool according to the distribution percentages', () => {
    const entries = [
      { uid: 'a', name: 'Ana', photoURL: '', totalPoints: 10 },
      { uid: 'b', name: 'Beto', photoURL: '', totalPoints: 30 },
      { uid: 'c', name: 'Caro', photoURL: '', totalPoints: 20 },
    ];
    const ranked = calculateWinners(entries, { prizePool: 1000, distribution: [70, 30] });

    expect(ranked.find((r) => r.uid === 'b')?.prize).toBe(700);
    expect(ranked.find((r) => r.uid === 'c')?.prize).toBe(300);
    expect(ranked.find((r) => r.uid === 'a')?.prize).toBe(0);
  });

  it('returns an empty list when there are no entries', () => {
    expect(calculateWinners([], { prizePool: 1000, distribution: [70, 30] })).toEqual([]);
  });

  it('rounds prizes to two decimal places', () => {
    const entries = [
      { uid: 'a', name: 'Ana', photoURL: '', totalPoints: 10 },
      { uid: 'b', name: 'Beto', photoURL: '', totalPoints: 5 },
      { uid: 'c', name: 'Caro', photoURL: '', totalPoints: 1 },
    ];
    const ranked = calculateWinners(entries, { prizePool: 100, distribution: [50, 30, 20] });

    expect(ranked.find((r) => r.uid === 'a')?.prize).toBe(50);
    expect(ranked.find((r) => r.uid === 'b')?.prize).toBe(30);
    expect(ranked.find((r) => r.uid === 'c')?.prize).toBe(20);
  });
});
