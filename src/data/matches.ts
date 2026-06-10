export interface SeedMatch {
  teamA: string;
  teamB: string;
  /** ISO 8601 datetime string (local time of the host stadium, stored as UTC) */
  datetime: string;
  stage: string;
}

/**
 * Placeholder group-stage fixtures for the FIFA World Cup 2026 (USA/Canada/Mexico).
 * Dates/teams are illustrative placeholders for seeding the prediction game.
 */
export const seedMatches: SeedMatch[] = [
  {
    teamA: 'México',
    teamB: 'Polonia',
    datetime: '2026-06-11T19:00:00-06:00',
    stage: 'Grupo A',
  },
  {
    teamA: 'Estados Unidos',
    teamB: 'Gales',
    datetime: '2026-06-12T16:00:00-04:00',
    stage: 'Grupo B',
  },
  {
    teamA: 'Argentina',
    teamB: 'Arabia Saudita',
    datetime: '2026-06-12T13:00:00-04:00',
    stage: 'Grupo C',
  },
  {
    teamA: 'Canadá',
    teamB: 'Bélgica',
    datetime: '2026-06-13T18:00:00-04:00',
    stage: 'Grupo D',
  },
  {
    teamA: 'Brasil',
    teamB: 'Serbia',
    datetime: '2026-06-13T21:00:00-04:00',
    stage: 'Grupo E',
  },
  {
    teamA: 'Francia',
    teamB: 'Australia',
    datetime: '2026-06-14T15:00:00-04:00',
    stage: 'Grupo F',
  },
  {
    teamA: 'España',
    teamB: 'Costa Rica',
    datetime: '2026-06-14T18:00:00-04:00',
    stage: 'Grupo G',
  },
  {
    teamA: 'Alemania',
    teamB: 'Japón',
    datetime: '2026-06-15T12:00:00-04:00',
    stage: 'Grupo H',
  },
  {
    teamA: 'Portugal',
    teamB: 'Ghana',
    datetime: '2026-06-15T15:00:00-04:00',
    stage: 'Grupo I',
  },
  {
    teamA: 'Inglaterra',
    teamB: 'Irán',
    datetime: '2026-06-16T13:00:00-04:00',
    stage: 'Grupo J',
  },
  {
    teamA: 'Países Bajos',
    teamB: 'Senegal',
    datetime: '2026-06-16T16:00:00-04:00',
    stage: 'Grupo K',
  },
  {
    teamA: 'Croacia',
    teamB: 'Marruecos',
    datetime: '2026-06-17T12:00:00-04:00',
    stage: 'Grupo L',
  },
];
