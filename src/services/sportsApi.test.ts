import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchEventStatus } from './sportsApi';

const footballDataMatches = [
  {
    status: 'FINISHED',
    homeTeam: { name: 'Australia' },
    awayTeam: { name: 'Turkey' },
    score: { fullTime: { home: 2, away: 0 } },
  },
  {
    status: 'FINISHED',
    homeTeam: { name: 'United States' },
    awayTeam: { name: 'Paraguay' },
    score: { fullTime: { home: 4, away: 1 } },
  },
  {
    status: 'IN_PLAY',
    homeTeam: { name: 'Spain' },
    awayTeam: { name: 'Cape Verde Islands' },
    score: { fullTime: { home: 1, away: 0 } },
  },
  {
    status: 'TIMED',
    homeTeam: { name: 'Belgium' },
    awayTeam: { name: 'Egypt' },
    score: { fullTime: { home: null, away: null } },
  },
];

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.includes('thesportsdb')) {
        return { ok: true, json: async () => ({ events: [] }) };
      }
      if (url.includes('football-data')) {
        return { ok: true, json: async () => ({ matches: footballDataMatches }) };
      }
      throw new Error(`unexpected url: ${url}`);
    })
  );
});

describe('fetchEventStatus football-data.org fallback', () => {
  it('returns the finished result when TheSportsDB has no event for any candidate date', async () => {
    const status = await fetchEventStatus('2026-06-14', 'Australia', 'Turkey');
    expect(status).toEqual({ home: 2, away: 0, status: 'FINISHED', finished: true });
  });

  it('normalizes football-data.org team names that differ from TheSportsDB (e.g. "United States" -> "USA")', async () => {
    const status = await fetchEventStatus('2026-06-13', 'USA', 'Paraguay');
    expect(status).toEqual({ home: 4, away: 1, status: 'FINISHED', finished: true });
  });

  it('returns a live (unfinished) score for in-play matches, normalizing "Cape Verde Islands" -> "Cape Verde"', async () => {
    const status = await fetchEventStatus('2026-06-15', 'Spain', 'Cape Verde');
    expect(status).toEqual({ home: 1, away: 0, status: 'IN_PLAY', finished: false });
  });

  it('returns null for a match that has not kicked off yet', async () => {
    const status = await fetchEventStatus('2026-06-15', 'Belgium', 'Egypt');
    expect(status).toBeNull();
  });

  it('returns null when neither source has the match', async () => {
    const status = await fetchEventStatus('2026-06-20', 'France', 'Germany');
    expect(status).toBeNull();
  });
});
