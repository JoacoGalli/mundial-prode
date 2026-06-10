import type { Round } from '../types';

export interface SeedMatch {
  teamA: string;
  teamB: string;
  /** ISO 8601 datetime string (UTC) */
  datetime: string;
  stage: string;
  round: Round;
  /** TheSportsDB event ID (idEvent), used to auto-sync the official result */
  externalId: string;
}

/**
 * Real fixtures for the FIFA World Cup 2026 group stage, matchday 1
 * (source: TheSportsDB, league id 4429, season 2026).
 */
export const seedMatches: SeedMatch[] = [
  {
    teamA: 'México',
    teamB: 'Sudáfrica',
    datetime: '2026-06-11T19:00:00Z',
    stage: 'Grupo A',
    round: 'Fecha 1',
    externalId: '2391728',
  },
  {
    teamA: 'Corea del Sur',
    teamB: 'República Checa',
    datetime: '2026-06-12T02:00:00Z',
    stage: 'Grupo A',
    round: 'Fecha 1',
    externalId: '2461103',
  },
  {
    teamA: 'Canadá',
    teamB: 'Bosnia y Herzegovina',
    datetime: '2026-06-12T19:00:00Z',
    stage: 'Grupo B',
    round: 'Fecha 1',
    externalId: '2461104',
  },
  {
    teamA: 'Estados Unidos',
    teamB: 'Paraguay',
    datetime: '2026-06-13T01:00:00Z',
    stage: 'Grupo D',
    round: 'Fecha 1',
    externalId: '2391729',
  },
  {
    teamA: 'Catar',
    teamB: 'Suiza',
    datetime: '2026-06-13T19:00:00Z',
    stage: 'Grupo B',
    round: 'Fecha 1',
    externalId: '2391732',
  },
  {
    teamA: 'Brasil',
    teamB: 'Marruecos',
    datetime: '2026-06-13T22:00:00Z',
    stage: 'Grupo C',
    round: 'Fecha 1',
    externalId: '2391730',
  },
  {
    teamA: 'Haití',
    teamB: 'Escocia',
    datetime: '2026-06-14T01:00:00Z',
    stage: 'Grupo C',
    round: 'Fecha 1',
    externalId: '2391731',
  },
  {
    teamA: 'Australia',
    teamB: 'Turquía',
    datetime: '2026-06-14T04:00:00Z',
    stage: 'Grupo D',
    round: 'Fecha 1',
    externalId: '2461105',
  },
  {
    teamA: 'Alemania',
    teamB: 'Curazao',
    datetime: '2026-06-14T17:00:00Z',
    stage: 'Grupo E',
    round: 'Fecha 1',
    externalId: '2391733',
  },
  {
    teamA: 'Países Bajos',
    teamB: 'Japón',
    datetime: '2026-06-14T20:00:00Z',
    stage: 'Grupo F',
    round: 'Fecha 1',
    externalId: '2391735',
  },
  {
    teamA: 'Costa de Marfil',
    teamB: 'Ecuador',
    datetime: '2026-06-14T23:00:00Z',
    stage: 'Grupo E',
    round: 'Fecha 1',
    externalId: '2391734',
  },
  {
    teamA: 'Suecia',
    teamB: 'Túnez',
    datetime: '2026-06-15T02:00:00Z',
    stage: 'Grupo F',
    round: 'Fecha 1',
    externalId: '2461106',
  },
  {
    teamA: 'España',
    teamB: 'Cabo Verde',
    datetime: '2026-06-15T16:00:00Z',
    stage: 'Grupo H',
    round: 'Fecha 1',
    externalId: '2391739',
  },
  {
    teamA: 'Bélgica',
    teamB: 'Egipto',
    datetime: '2026-06-15T19:00:00Z',
    stage: 'Grupo G',
    round: 'Fecha 1',
    externalId: '2391736',
  },
  {
    teamA: 'Arabia Saudita',
    teamB: 'Uruguay',
    datetime: '2026-06-15T22:00:00Z',
    stage: 'Grupo H',
    round: 'Fecha 1',
    externalId: '2391738',
  },
];
