import type { MatchResult, Round } from '../types';
import { mapApiRound } from '../utils/rounds';

const THESPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';
const WORLD_CUP_LEAGUE_ID = '4429';
const WORLD_CUP_SEASON = '2026';

interface TheSportsDbEvent {
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strTimestamp: string;
  intRound: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string;
}

/** English -> Spanish translations for national team names. */
const TEAM_NAME_ES: Record<string, string> = {
  Mexico: 'México',
  'South Africa': 'Sudáfrica',
  'South Korea': 'Corea del Sur',
  'Czech Republic': 'República Checa',
  Canada: 'Canadá',
  'Bosnia-Herzegovina': 'Bosnia y Herzegovina',
  'Bosnia and Herzegovina': 'Bosnia y Herzegovina',
  USA: 'Estados Unidos',
  'United States': 'Estados Unidos',
  Paraguay: 'Paraguay',
  Qatar: 'Catar',
  Switzerland: 'Suiza',
  Brazil: 'Brasil',
  Morocco: 'Marruecos',
  Haiti: 'Haití',
  Scotland: 'Escocia',
  Australia: 'Australia',
  Turkey: 'Turquía',
  Germany: 'Alemania',
  Curacao: 'Curazao',
  Curaçao: 'Curazao',
  Netherlands: 'Países Bajos',
  Japan: 'Japón',
  'Ivory Coast': 'Costa de Marfil',
  "Cote d'Ivoire": 'Costa de Marfil',
  "Côte d'Ivoire": 'Costa de Marfil',
  Sweden: 'Suecia',
  Tunisia: 'Túnez',
  Spain: 'España',
  'Cape Verde': 'Cabo Verde',
  Belgium: 'Bélgica',
  Egypt: 'Egipto',
  'Saudi Arabia': 'Arabia Saudita',
  Uruguay: 'Uruguay',
  Argentina: 'Argentina',
  France: 'Francia',
  England: 'Inglaterra',
  Italy: 'Italia',
  Portugal: 'Portugal',
  Croatia: 'Croacia',
  Poland: 'Polonia',
  Senegal: 'Senegal',
  Ghana: 'Ghana',
  Nigeria: 'Nigeria',
  Cameroon: 'Camerún',
  Algeria: 'Argelia',
  Iran: 'Irán',
  Jordan: 'Jordania',
  Uzbekistan: 'Uzbekistán',
  'New Zealand': 'Nueva Zelanda',
  Panama: 'Panamá',
  'Costa Rica': 'Costa Rica',
  Honduras: 'Honduras',
  Jamaica: 'Jamaica',
  Colombia: 'Colombia',
  Chile: 'Chile',
  Peru: 'Perú',
  Venezuela: 'Venezuela',
  Bolivia: 'Bolivia',
  Norway: 'Noruega',
  Austria: 'Austria',
  Slovakia: 'Eslovaquia',
  Slovenia: 'Eslovenia',
  Ukraine: 'Ucrania',
  Wales: 'Gales',
  'Republic of Ireland': 'Irlanda',
  Ireland: 'Irlanda',
  Greece: 'Grecia',
  Romania: 'Rumania',
  Serbia: 'Serbia',
  Denmark: 'Dinamarca',
  Finland: 'Finlandia',
  Iceland: 'Islandia',
  China: 'China',
  India: 'India',
  'New Caledonia': 'Nueva Caledonia',
  Curacaco: 'Curazao',
  'DR Congo': 'RD Congo',
  Tanzania: 'Tanzania',
};

/** English team name -> Group letter, derived from the seeded matchday-1 fixture. */
const TEAM_GROUP_EN: Record<string, string> = {
  Mexico: 'A',
  'South Africa': 'A',
  'South Korea': 'A',
  'Czech Republic': 'A',
  Canada: 'B',
  'Bosnia-Herzegovina': 'B',
  Qatar: 'B',
  Switzerland: 'B',
  Brazil: 'C',
  Morocco: 'C',
  Haiti: 'C',
  Scotland: 'C',
  USA: 'D',
  'United States': 'D',
  Paraguay: 'D',
  Australia: 'D',
  Turkey: 'D',
  Germany: 'E',
  Curacao: 'E',
  'Ivory Coast': 'E',
  Ecuador: 'E',
  Netherlands: 'F',
  Japan: 'F',
  Sweden: 'F',
  Tunisia: 'F',
  Belgium: 'G',
  Egypt: 'G',
  Spain: 'H',
  'Cape Verde': 'H',
  'Saudi Arabia': 'H',
  Uruguay: 'H',
};

export function translateTeamName(name: string): string {
  return TEAM_NAME_ES[name] ?? name;
}

/**
 * Look up the official result of a match on TheSportsDB by its event ID.
 * Returns null if the match hasn't finished yet (or has no score reported).
 */
export async function fetchEventResult(externalId: string): Promise<MatchResult | null> {
  const res = await fetch(`${THESPORTSDB_BASE}/lookupevent.php?id=${externalId}`);
  if (!res.ok) return null;

  const data = await res.json();
  const event = data?.events?.[0] as TheSportsDbEvent | undefined;
  if (!event) return null;

  if (event.intHomeScore == null || event.intAwayScore == null) return null;

  return {
    home: parseInt(event.intHomeScore, 10),
    away: parseInt(event.intAwayScore, 10),
  };
}

export interface FixtureEvent {
  externalId: string;
  teamA: string;
  teamB: string;
  /** ISO 8601 datetime string (UTC) */
  datetime: string;
  stage: string;
  round: Round;
}

/**
 * Fetch the full World Cup 2026 schedule from TheSportsDB and map each event
 * to our internal shape (Spanish team names, our Round labels, and a "Grupo X"
 * stage label when the group is known from the seeded matchday-1 fixture).
 * Events whose round TheSportsDB hasn't published yet (e.g. unannounced
 * knockout fixtures) are skipped.
 */
export async function fetchSeasonEvents(): Promise<FixtureEvent[]> {
  const res = await fetch(
    `${THESPORTSDB_BASE}/eventsseason.php?id=${WORLD_CUP_LEAGUE_ID}&s=${WORLD_CUP_SEASON}`
  );
  if (!res.ok) return [];

  const data = await res.json();
  const events = (data?.events ?? []) as TheSportsDbEvent[];

  const fixtures: FixtureEvent[] = [];
  for (const event of events) {
    const round = mapApiRound(event.intRound);
    if (!round) continue;

    const teamA = translateTeamName(event.strHomeTeam);
    const teamB = translateTeamName(event.strAwayTeam);
    const group = TEAM_GROUP_EN[event.strHomeTeam] ?? TEAM_GROUP_EN[event.strAwayTeam];
    const stage = group ? `Grupo ${group}` : round;

    fixtures.push({
      externalId: event.idEvent,
      teamA,
      teamB,
      datetime: `${event.strTimestamp}Z`,
      stage,
      round,
    });
  }

  return fixtures;
}
