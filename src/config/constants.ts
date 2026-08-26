export const SEASON_GAMES = 82;

export const POSITIONS = ['LW', 'C', 'RW', 'LD', 'RD', 'G'] as const;

export type Position = (typeof POSITIONS)[number];

export const POSITION_LABELS: Record<Position, string> = {
  LW: 'Left Wing',
  C: 'Centre',
  RW: 'Right Wing',
  LD: 'Left Defence',
  RD: 'Right Defence',
  G: 'Goalie',
};

export const DECADES = [
  '1950s',
  '1960s',
  '1970s',
  '1980s',
  '1990s',
  '2000s',
  '2010s',
  '2020s',
] as const;

export type Decade = (typeof DECADES)[number];

export const ROUNDS = POSITIONS.length;

export type GameMode =
  | 'classic'
  | 'iceiq'
  | 'daily'
  | 'salary'
  | 'franchise'
  | 'challenge'
  | 'tough'
  | 'eralock';

export const MODE_LABELS: Record<GameMode, string> = {
  classic: 'Classic',
  iceiq: 'Ice IQ',
  daily: 'Daily',
  salary: 'Salary Cap',
  franchise: 'One Franchise',
  challenge: 'Challenge',
  tough: 'Toughest Team',
  eralock: 'Era Lock',
};

/** Spin animation duration; shortened when `window.__E2E__` is set */
export function spinDurationMs(): number {
  if (typeof window !== 'undefined' && (window as Window & { __E2E__?: boolean }).__E2E__) {
    return 40;
  }
  return 900;
}

export type GradeId =
  | 'perfection'
  | 'dynasty'
  | 'contender'
  | 'playoffs'
  | 'rebuilding';

export interface GradeBand {
  id: GradeId;
  label: string;
  minWins: number;
}

export const GRADE_BANDS: GradeBand[] = [
  { id: 'perfection', label: 'PERFECTION', minWins: 82 },
  { id: 'dynasty', label: 'DYNASTY', minWins: 70 },
  { id: 'contender', label: 'CUP CONTENDER', minWins: 58 },
  { id: 'playoffs', label: 'PLAYOFF TEAM', minWins: 44 },
  { id: 'rebuilding', label: 'REBUILDING', minWins: 0 },
];

export const LEADERBOARD_MIN_WINS = 70;
export const LEADERBOARD_MAX = 50;
export const GAME_LOG_MAX = 500;
export const STORAGE_KEYS = {
  leaderboard: 'nhl820_leaderboard',
  daily: 'nhl820_daily',
  lastResult: 'nhl820_last_result',
  career: 'nhl820_career',
  achievements: 'nhl820_achievements',
  dailyHistory: 'nhl820_daily_history',
  installTip: 'nhl820_install_tip',
  rematch: 'nhl820_rematch',
  displayName: 'nhl820_display_name',
  gameLog: 'nhl820_game_log',
} as const;
