import type { Decade, GameMode, GradeId, Position } from '../config/constants';

export interface SkaterStats {
  g82: number;
  a82: number;
  pim82: number;
}

export interface GoalieStats {
  gaa: number;
  svPct: number;
}

export interface Player {
  id: string;
  name: string;
  franchiseId: string;
  decade: Decade;
  positions: Position[];
  tier: 1 | 2 | 3 | 4 | 5;
  hof: boolean;
  skater?: SkaterStats;
  goalie?: GoalieStats;
}

export interface Franchise {
  id: string;
  name: string;
  shortName: string;
  city: string;
  abbreviation: string;
  primary: string;
  secondary: string;
  decades: Decade[];
}

export interface SpinResult {
  decade: Decade;
  franchiseId: string;
}

export interface RosterSlot {
  position: Position;
  player: Player | null;
}

export interface CupSeries {
  round: string;
  opponent: string;
  wins: number;
  losses: number;
}

export interface CupResult {
  qualified: boolean;
  champion: boolean;
  roundsWon: number;
  series: CupSeries[];
}

export type TapeKind = 'shutout' | 'blowout' | 'one-goal' | 'overtime';

export interface SeasonTapeGame {
  game: number;
  kind: TapeKind;
  gf: number;
  ga: number;
  opponent: string;
  won: boolean;
}

export interface SeasonResult {
  wins: number;
  losses: number;
  score: number;
  gradeId: GradeId;
  gradeLabel: string;
  strengths: string[];
  weaknesses: string[];
  bestPickId: string | null;
  weakestSlot: Position | null;
  toughnessScore: number;
  tape: SeasonTapeGame[];
  cup?: CupResult;
}

export interface LeaderboardEntry {
  id: string;
  wins: number;
  losses: number;
  gradeLabel: string;
  mode: GameMode;
  rosterNames: string[];
  createdAt: string;
}

export interface DailyRecord {
  dateKey: string;
  completed: boolean;
  wins?: number;
  losses?: number;
  gradeLabel?: string;
  rosterNames?: string[];
}

declare global {
  interface Window {
    __E2E__?: boolean;
  }
}
