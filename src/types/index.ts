import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  totalPoints: number;
  joinedAt: Timestamp;
}

export interface MatchResult {
  home: number;
  away: number;
}

export type Round =
  | 'Fecha 1'
  | 'Fecha 2'
  | 'Fecha 3'
  | 'Dieciseisavos de Final'
  | 'Octavos de Final'
  | 'Cuartos de Final'
  | 'Semifinales'
  | 'Final';

export interface Match {
  id: string;
  teamA: string;
  teamB: string;
  datetime: Timestamp;
  stage: string;
  round: Round;
  result?: MatchResult | null;
  locked: boolean;
  /** Team names as TheSportsDB reports them, used to auto-sync the official result */
  apiTeamA?: string;
  apiTeamB?: string;
}

export interface Prediction {
  id: string;
  uid: string;
  matchId: string;
  home: number;
  away: number;
  points: number | null;
  scoredAt: Timestamp | null;
}

export interface AppSettings {
  prizePool: number;
  currency: 'ARS' | 'USD';
  distribution: number[];
  adminUIDs: string[];
  /** Official World Cup winner, set by the admin once the tournament ends. */
  champion: string | null;
  /** Bonus points awarded to users who picked the champion correctly. */
  championBonus: number;
  /** When true, players can no longer change their champion pick. */
  championPicksLocked: boolean;
}

export interface ChampionPick {
  uid: string;
  team: string;
  points: number | null;
}
