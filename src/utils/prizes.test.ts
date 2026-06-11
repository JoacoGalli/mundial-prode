import { describe, expect, it } from 'vitest';
import { buildLeaderboardEntries, calculateWinners, getChampionPoints } from './prizes';

describe('getChampionPoints', () => {
  it('returns 0 when there is no official champion yet', () => {
    expect(getChampionPoints({ team: 'Argentina' }, null, 25)).toBe(0);
  });

  it('returns 0 when the user made no pick', () => {
    expect(getChampionPoints(null, 'Argentina', 25)).toBe(0);
    expect(getChampionPoints(undefined, 'Argentina', 25)).toBe(0);
  });

  it('returns 0 when the pick does not match the champion', () => {
    expect(getChampionPoints({ team: 'Brasil' }, 'Argentina', 25)).toBe(0);
  });

  it('returns the bonus when the pick matches the champion', () => {
    expect(getChampionPoints({ team: 'Argentina' }, 'Argentina', 25)).toBe(25);
  });
});

describe('buildLeaderboardEntries', () => {
  const users = [
    { uid: 'a', name: 'Ana', photoURL: '', predictionPoints: 10 },
    { uid: 'b', name: 'Beto', photoURL: '', predictionPoints: 20 },
    { uid: 'c', name: 'Caro', photoURL: '', predictionPoints: 5 },
  ];

  it('adds the champion bonus only to users who picked the right champion', () => {
    const picksByUid = {
      a: { uid: 'a', team: 'Argentina' },
      b: { uid: 'b', team: 'Brasil' },
    };
    const entries = buildLeaderboardEntries(users, picksByUid, 'Argentina', 25);

    expect(entries.find((e) => e.uid === 'a')?.totalPoints).toBe(35);
    expect(entries.find((e) => e.uid === 'b')?.totalPoints).toBe(20);
    expect(entries.find((e) => e.uid === 'c')?.totalPoints).toBe(5);
  });

  it('does not add any bonus while the champion is undecided', () => {
    const picksByUid = { a: { uid: 'a', team: 'Argentina' } };
    const entries = buildLeaderboardEntries(users, picksByUid, null, 25);
    expect(entries.find((e) => e.uid === 'a')?.totalPoints).toBe(10);
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
