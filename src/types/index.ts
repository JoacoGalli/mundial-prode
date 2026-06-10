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

export interface Match {
  id: string;
  teamA: string;
  teamB: string;
  datetime: Timestamp;
  stage: string;
  result?: MatchResult | null;
  locked: boolean;
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
}
