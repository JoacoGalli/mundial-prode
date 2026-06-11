import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { ROUNDS, getDefaultRound, mapApiRound } from './rounds';
import type { Match, Round } from '../types';

function makeMatch(round: Round, result: { home: number; away: number } | null = null): Match {
  return {
    id: `${round}-${Math.random()}`,
    teamA: 'Equipo A',
    teamB: 'Equipo B',
    datetime: Timestamp.now(),
    stage: 'Grupos',
    round,
    result,
    locked: result != null,
  };
}

describe('mapApiRound', () => {
  it('maps known TheSportsDB round numbers to our round labels', () => {
    expect(mapApiRound('1')).toBe('Fecha 1');
    expect(mapApiRound('3')).toBe('Fecha 3');
    expect(mapApiRound('8')).toBe('Final');
  });

  it('returns null for unknown round numbers', () => {
    expect(mapApiRound('99')).toBeNull();
  });
});

describe('getDefaultRound', () => {
  it('returns the first round when there are no matches', () => {
    expect(getDefaultRound([])).toBe(ROUNDS[0]);
  });

  it('returns the earliest round that still has a match without a result', () => {
    const matches = [
      makeMatch('Fecha 1', { home: 1, away: 0 }),
      makeMatch('Fecha 1', { home: 2, away: 2 }),
      makeMatch('Fecha 2', null),
      makeMatch('Fecha 3', null),
    ];
    expect(getDefaultRound(matches)).toBe('Fecha 2');
  });

  it('returns the last round with matches once everything is finished', () => {
    const matches = [
      makeMatch('Fecha 1', { home: 1, away: 0 }),
      makeMatch('Fecha 2', { home: 0, away: 0 }),
    ];
    expect(getDefaultRound(matches)).toBe('Fecha 2');
  });

  it('skips rounds with no matches at all', () => {
    const matches = [makeMatch('Octavos de Final', null)];
    expect(getDefaultRound(matches)).toBe('Octavos de Final');
  });
});
