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
  Iraq: 'Irak',
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

/** English (TheSportsDB) team name -> Group letter for the WC2026 group stage. */
const TEAM_GROUP_EN: Record<string, string> = {
  // Group A
  'Czech Republic': 'A',
  Mexico: 'A',
  'South Africa': 'A',
  'South Korea': 'A',
  // Group B
  'Bosnia-Herzegovina': 'B',
  Canada: 'B',
  Qatar: 'B',
  Switzerland: 'B',
  // Group C
  Brazil: 'C',
  Haiti: 'C',
  Morocco: 'C',
  Scotland: 'C',
  // Group D
  Australia: 'D',
  Paraguay: 'D',
  Turkey: 'D',
  USA: 'D',
  'United States': 'D',
  // Group E
  Curaçao: 'E',
  Curacao: 'E',
  Ecuador: 'E',
  Germany: 'E',
  'Ivory Coast': 'E',
  // Group F
  Japan: 'F',
  Netherlands: 'F',
  Sweden: 'F',
  Tunisia: 'F',
  // Group G
  Belgium: 'G',
  Egypt: 'G',
  Iran: 'G',
  'New Zealand': 'G',
  // Group H
  'Cape Verde': 'H',
  'Saudi Arabia': 'H',
  Spain: 'H',
  Uruguay: 'H',
  // Group I
  France: 'I',
  Iraq: 'I',
  Norway: 'I',
  Senegal: 'I',
  // Group J
  Algeria: 'J',
  Argentina: 'J',
  Austria: 'J',
  Jordan: 'J',
  // Group K
  Colombia: 'K',
  'DR Congo': 'K',
  Portugal: 'K',
  Uzbekistan: 'K',
  // Group L
  Croatia: 'L',
  England: 'L',
  Ghana: 'L',
  Panama: 'L',
};

export function translateTeamName(name: string): string {
  return TEAM_NAME_ES[name] ?? name;
}

function addDays(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Look up the official result of a match on TheSportsDB by date and team
 * names, since the free API doesn't reliably expose every event's ID ahead
 * of time. Tries the given date and the days right before/after it (events
 * are sometimes listed under a neighboring date due to timezone rounding).
 * Returns null if the match hasn't finished yet (or wasn't found).
 */
export async function fetchResultByDateAndTeams(
  dateISO: string,
  apiTeamA: string,
  apiTeamB: string
): Promise<MatchResult | null> {
  const candidateDates = [dateISO, addDays(dateISO, 1), addDays(dateISO, -1)];

  for (const date of candidateDates) {
    const res = await fetch(`${THESPORTSDB_BASE}/eventsday.php?d=${date}&l=${WORLD_CUP_LEAGUE_ID}`);
    if (!res.ok) continue;

    const data = await res.json();
    const events = (data?.events ?? []) as TheSportsDbEvent[];

    const event = events.find(
      (e) =>
        (e.strHomeTeam === apiTeamA && e.strAwayTeam === apiTeamB) ||
        (e.strHomeTeam === apiTeamB && e.strAwayTeam === apiTeamA)
    );
    if (!event) continue;

    if (event.intHomeScore == null || event.intAwayScore == null) return null;

    const home = parseInt(event.intHomeScore, 10);
    const away = parseInt(event.intAwayScore, 10);

    return event.strHomeTeam === apiTeamA ? { home, away } : { home: away, away: home };
  }

  return null;
}

export interface FixtureEvent {
  teamA: string;
  teamB: string;
  /** Team names as TheSportsDB reports them, used to auto-sync the official result */
  apiTeamA: string;
  apiTeamB: string;
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
      teamA,
      teamB,
      apiTeamA: event.strHomeTeam,
      apiTeamB: event.strAwayTeam,
      datetime: `${event.strTimestamp}Z`,
      stage,
      round,
    });
  }

  return fixtures;
}
