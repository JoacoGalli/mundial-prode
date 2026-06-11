import { describe, expect, it } from 'vitest';
import { calculatePoints } from './scoring';

describe('calculatePoints', () => {
  it('awards 12 points for an exact score', () => {
    expect(calculatePoints({ home: 2, away: 1 }, { home: 2, away: 1 })).toBe(12);
  });

  it('awards 12 points for an exact scoreless draw', () => {
    expect(calculatePoints({ home: 0, away: 0 }, { home: 0, away: 0 })).toBe(12);
  });

  it('awards 7 points for the correct winner plus one exact score (general result)', () => {
    // Real result 3-1: predicted winner correct (home) and home score exact (3)
    expect(calculatePoints({ home: 3, away: 2 }, { home: 3, away: 1 })).toBe(7);
  });

  it('awards 5 points for only the correct winner (partial result)', () => {
    // Real result 2-1: predicted home wins 3-0, no score matches
    expect(calculatePoints({ home: 3, away: 0 }, { home: 2, away: 1 })).toBe(5);
  });

  it('awards 5 points for correctly predicting a draw without the exact score', () => {
    expect(calculatePoints({ home: 1, away: 1 }, { home: 2, away: 2 })).toBe(5);
  });

  it('awards 2 points when only one team\'s score matches and the winner is wrong', () => {
    // Real result 2-1 (home wins): predicted 0-1 (away wins), away score matches
    expect(calculatePoints({ home: 0, away: 1 }, { home: 2, away: 1 })).toBe(2);
  });

  it('awards 0 points when nothing matches', () => {
    expect(calculatePoints({ home: 0, away: 0 }, { home: 1, away: 2 })).toBe(0);
  });

  it('awards 0 points when the winner is wrong and no individual score matches', () => {
    expect(calculatePoints({ home: 3, away: 1 }, { home: 1, away: 2 })).toBe(0);
  });

  it('awards 7 points when the winner and the away score both match', () => {
    // Real result 1-3 (away wins): predicted 0-3, winner correct and away score exact
    expect(calculatePoints({ home: 0, away: 3 }, { home: 1, away: 3 })).toBe(7);
  });
});
