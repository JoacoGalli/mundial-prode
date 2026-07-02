import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  predictionPoints: number;
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
  /** Live score from TheSportsDB while the match is in progress. Cleared once `result` is set. */
  liveScore?: MatchResult | null;
  /** Raw TheSportsDB status while live (e.g. "1H", "HT", "2H", "ET", "P"). Cleared once `result` is set. */
  liveStatus?: string | null;
  /** True if the last attempt to recalculate predictions' points for this match's result failed. */
  pointsError?: boolean;
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
  /** The two official World Cup finalists, set by the admin once they're known. */
  finalists: string[] | null;
  /** Bonus points awarded per finalist a user correctly picked. */
  championBonus: number;
  /** When true, players can no longer change their finalists pick. */
  championPicksLocked: boolean;
}

export interface ChampionPick {
  uid: string;
  /** The two teams the user picked as finalists. */
  teams: string[];
}

export interface Group {
  id: string;
  name: string;
  ownerUid: string;
  adminUIDs: string[];
  inviteCode: string;
  prizePool: number;
  currency: 'ARS' | 'USD';
  distribution: number[];
  championBonus: number;
  createdAt: Timestamp;
}

export interface GroupMember {
  uid: string;
  name: string;
  photoURL: string;
  status: 'pending' | 'approved';
  /** Invite code used to join (omitted for the owner, who joins on creation). */
  inviteCode?: string;
  joinedAt: Timestamp;
}
