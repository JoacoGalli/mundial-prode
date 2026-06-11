import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { getAllTeams } from './teams';
import type { Match } from '../types';

function makeMatch(teamA: string, teamB: string): Match {
  return {
    id: `${teamA}-${teamB}`,
    teamA,
    teamB,
    datetime: Timestamp.now(),
    stage: 'Grupos',
    round: 'Fecha 1',
    result: null,
    locked: false,
  };
}

describe('getAllTeams', () => {
  it('returns an empty list for no matches', () => {
    expect(getAllTeams([])).toEqual([]);
  });

  it('deduplicates teams that appear in multiple matches', () => {
    const matches = [makeMatch('Argentina', 'Brasil'), makeMatch('Argentina', 'Croacia')];
    expect(getAllTeams(matches)).toEqual(['Argentina', 'Brasil', 'Croacia']);
  });

  it('sorts teams alphabetically using Spanish collation', () => {
    const matches = [makeMatch('Uruguay', 'Ñañez'), makeMatch('Alemania', 'Brasil')];
    expect(getAllTeams(matches)).toEqual(['Alemania', 'Brasil', 'Ñañez', 'Uruguay']);
  });
});
