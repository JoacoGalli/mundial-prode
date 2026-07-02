import type { MatchResult, Round } from '../types';
import { mapApiRound } from '../utils/rounds';

const THESPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';
const WORLD_CUP_LEAGUE_ID = '4429';

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
 * Match statuses TheSportsDB uses to mark an event as fully over (including
 * extra time and penalty shootouts, if any). Anything else (e.g. "1H", "HT",
 * "2H", "ET", "P", "NS") means the match hasn't finished yet.
 */
const FINISHED_STATUSES = new Set([
  'FT',
  'AET',
  'PEN',
  'AWD',
  'WO',
  'Match Finished',
  'Finished',
]);

/**
 * Statuses where TheSportsDB's score is the *final* score after extra time
 * and/or penalties rather than the 90-minute score. Our rule is that
 * predictions only count the 90-minute result, and the API doesn't expose
 * the interim score separately, so matches ending this way can't be
 * auto-applied as the official result — an admin has to enter the 90' score.
 */
const EXTRA_TIME_STATUSES = new Set(['AET', 'PEN']);

export interface EventStatus extends MatchResult {
  /** Raw TheSportsDB status (e.g. "1H", "HT", "2H", "ET", "P", "FT", "AET", "PEN"). */
  status: string;
  /** True once the match is fully over, including extra time and penalties. */
  finished: boolean;
  /**
   * True when `home`/`away` is the 90-minute result and safe to auto-apply as
   * the official result. False when the match went to extra time/penalties —
   * the score reflects the final (post-120'/post-penalties) outcome instead.
   */
  resultReliable: boolean;
}

/**
 * Look up the current score and status of a match on TheSportsDB by date and
 * team names, since the free API doesn't reliably expose every event's ID
 * ahead of time. Tries the given date and the days right before/after it
 * (events are sometimes listed under a neighboring date due to timezone
 * rounding). Returns null if the match hasn't kicked off yet (no score) or
 * wasn't found.
 */
export async function fetchEventStatus(
  dateISO: string,
  apiTeamA: string,
  apiTeamB: string
): Promise<EventStatus | null> {
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
    const finished = FINISHED_STATUSES.has(event.strStatus);
    const resultReliable = finished && !EXTRA_TIME_STATUSES.has(event.strStatus);

    return event.strHomeTeam === apiTeamA
      ? { home, away, status: event.strStatus, finished, resultReliable }
      : { home: away, away: home, status: event.strStatus, finished, resultReliable };
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
 * Fetch the World Cup 2026 knockout-phase schedule from TheSportsDB.
 * eventsseason.php returns only a handful of events with the free API key, so
 * we iterate day-by-day across the full knockout window using eventsday.php
 * instead.  Group-stage matches are seeded manually, so we only look for
 * rounds beyond matchday 3.
 */
export async function fetchSeasonEvents(): Promise<FixtureEvent[]> {
  const KNOCKOUT_START = '2026-06-28';
  const KNOCKOUT_END = '2026-07-19';

  const days: string[] = [];
  const d = new Date(`${KNOCKOUT_START}T00:00:00Z`);
  const end = new Date(`${KNOCKOUT_END}T00:00:00Z`);
  while (d <= end) {
    days.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }

  const perDay = await Promise.all(
    days.map(async (date) => {
      const res = await fetch(`${THESPORTSDB_BASE}/eventsday.php?d=${date}&l=${WORLD_CUP_LEAGUE_ID}`);
      if (!res.ok) return [] as TheSportsDbEvent[];
      const data = await res.json();
      return (data?.events ?? []) as TheSportsDbEvent[];
    })
  );

  const fixtures: FixtureEvent[] = [];
  for (const event of perDay.flat()) {
    const round = mapApiRound(event.intRound);
    if (!round) continue;

    const teamA = translateTeamName(event.strHomeTeam);
    const teamB = translateTeamName(event.strAwayTeam);

    // Only assign a "Grupo X" stage for actual group-stage matchdays; knockout
    // rounds always use the round name as the stage even if both teams happen to
    // be in the same group.
    const isGroupStage = round === 'Fecha 1' || round === 'Fecha 2' || round === 'Fecha 3';
    const group = isGroupStage
      ? (TEAM_GROUP_EN[event.strHomeTeam] ?? TEAM_GROUP_EN[event.strAwayTeam])
      : null;
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
