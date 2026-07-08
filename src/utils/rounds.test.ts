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
    expect(mapApiRound('8')).toBe('Cuartos de Final');
  });

  it('maps the "125" round number TheSportsDB actually used for Cuartos de Final', () => {
    expect(mapApiRound('125')).toBe('Cuartos de Final');
  });

  it('returns null for unknown round numbers with no date to fall back on', () => {
    expect(mapApiRound('99')).toBeNull();
  });

  it('falls back to the fixed knockout calendar for unrecognized round numbers', () => {
    expect(mapApiRound('999', '2026-07-10')).toBe('Cuartos de Final');
    expect(mapApiRound('999', '2026-07-05')).toBe('Octavos de Final');
    expect(mapApiRound('999', '2026-07-14')).toBe('Semifinales');
    expect(mapApiRound('999', '2026-07-19')).toBe('Final');
  });

  it('returns null when the date falls outside every known knockout window', () => {
    expect(mapApiRound('999', '2026-06-01')).toBeNull();
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
