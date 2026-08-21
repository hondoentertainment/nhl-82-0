import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import {
  MODE_LABELS,
  POSITIONS,
  spinDurationMs,
  type GameMode,
  type Position,
} from '../config/constants';
import { FRANCHISE_BY_ID } from '../data/franchises';
import { evaluateAchievements, type AchievementId } from '../game/achievements';
import { recordCareerResult } from '../game/career';
import {
  decodeChallengeSeed,
  encodeChallengeSeed,
  newChallengeSeed,
} from '../game/challenge';
import { dailyRng, saveDailyRecord, utcDateKey } from '../game/daily';
import { submitDailyBoard } from '../game/dailyBoard';
import { tryAddLeaderboardEntry } from '../game/leaderboard';
import { hashString, mulberry32 } from '../game/rng';
import { playerSalary, rosterSpend, SALARY_CAP_M } from '../game/salary';
import { simulateSeason } from '../game/simulate';
import {
  spinDecadeForFranchise,
  spinNewFranchise,
  spinWithEligibility,
  getAvailablePlayers,
} from '../game/spin';
import type { Player, RosterSlot, SeasonResult, SpinResult } from '../types/game';

export type Screen =
  | 'home'
  | 'franchise-select'
  | 'draft'
  | 'reveal'
  | 'result'
  | 'how'
  | 'leaderboard'
  | 'career';

interface GameState {
  screen: Screen;
  mode: GameMode | null;
  roster: RosterSlot[];
  round: number;
  spin: SpinResult | null;
  spinning: boolean;
  teamSkips: number;
  decadeSkips: number;
  result: SeasonResult | null;
  showStats: boolean;
  randSeed: number;
  dateKey: string | null;
  madeLeaderboard: boolean;
  dailyRank: number | null;
  salaryCap: number | null;
  lockedFranchiseId: string | null;
  challengeCode: string | null;
  newAchievements: AchievementId[];
}

type Action =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'START'; mode: GameMode; franchiseId?: string; challengeCode?: string }
  | { type: 'SPIN_START' }
  | { type: 'SPIN_DONE'; spin: SpinResult }
  | { type: 'SKIP_TEAM' }
  | { type: 'SKIP_DECADE' }
  | { type: 'RESPIN' }
  | { type: 'PICK'; player: Player; position: Position }
  | {
      type: 'SET_RESULT';
      result: SeasonResult;
      madeLeaderboard: boolean;
      dailyRank: number | null;
      newAchievements: AchievementId[];
    }
  | { type: 'RESET' };

function emptyRoster(): RosterSlot[] {
  return POSITIONS.map((position) => ({ position, player: null }));
}

function createRng(seed: number): () => number {
  return mulberry32(seed);
}

const initialState: GameState = {
  screen: 'home',
  mode: null,
  roster: emptyRoster(),
  round: 1,
  spin: null,
  spinning: false,
  teamSkips: 1,
  decadeSkips: 1,
  result: null,
  showStats: true,
  randSeed: Date.now(),
  dateKey: null,
  madeLeaderboard: false,
  dailyRank: null,
  salaryCap: null,
  lockedFranchiseId: null,
  challengeCode: null,
  newAchievements: [],
};

function openPositions(roster: RosterSlot[]): Position[] {
  return roster.filter((s) => !s.player).map((s) => s.position);
}

function takenIds(roster: RosterSlot[]): Set<string> {
  return new Set(roster.filter((s) => s.player).map((s) => s.player!.id));
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen };
    case 'START': {
      const isDaily = action.mode === 'daily';
      const isSalary = action.mode === 'salary';
      const isFranchise = action.mode === 'franchise';
      const isChallenge = action.mode === 'challenge';
      const dateKey = isDaily ? utcDateKey() : null;
      let seed: number;
      let challengeCode: string | null = null;
      if (isDaily) {
        seed = hashString(`nhl820-daily-${dateKey}`);
      } else if (isChallenge) {
        const fromCode = action.challengeCode
          ? decodeChallengeSeed(action.challengeCode)
          : null;
        seed = fromCode ?? newChallengeSeed();
        challengeCode = encodeChallengeSeed(seed);
      } else {
        seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
      }
      return {
        ...initialState,
        screen: 'draft',
        mode: action.mode,
        showStats:
          action.mode === 'classic' ||
          isSalary ||
          isFranchise ||
          isChallenge ||
          action.mode === 'tough',
        teamSkips: isDaily || isFranchise || isChallenge ? 0 : 1,
        decadeSkips: isDaily || isChallenge ? 0 : isFranchise ? 2 : 1,
        randSeed: seed,
        dateKey,
        roster: emptyRoster(),
        salaryCap: isSalary ? SALARY_CAP_M : null,
        lockedFranchiseId: isFranchise ? (action.franchiseId ?? null) : null,
        challengeCode,
      };
    }
    case 'SPIN_START':
      return { ...state, spinning: true };
    case 'SPIN_DONE':
      return { ...state, spinning: false, spin: action.spin };
    case 'SKIP_TEAM': {
      if (!state.spin || state.teamSkips <= 0 || state.lockedFranchiseId) return state;
      const rand = createRng(state.randSeed + state.round * 97 + 11);
      const spin = spinNewFranchise(rand, state.spin.decade, state.spin.franchiseId);
      return {
        ...state,
        teamSkips: state.teamSkips - 1,
        spin,
        randSeed: state.randSeed + 13,
      };
    }
    case 'SKIP_DECADE': {
      if (state.decadeSkips <= 0) return state;
      const rand = createRng(state.randSeed + state.round * 91 + 17);
      const spin = state.lockedFranchiseId
        ? spinDecadeForFranchise(rand, state.lockedFranchiseId, state.spin?.decade)
        : spinWithEligibility(
            rand,
            openPositions(state.roster),
            takenIds(state.roster),
          );
      return {
        ...state,
        decadeSkips: state.decadeSkips - 1,
        spin,
        randSeed: state.randSeed + 29,
      };
    }
    case 'RESPIN': {
      if (!state.spin || state.mode === 'daily' || state.mode === 'challenge') return state;
      const open = openPositions(state.roster);
      const taken = takenIds(state.roster);
      let nextSeed = state.randSeed + 41;
      let spin = state.spin;
      for (let i = 0; i < 24; i++) {
        const rand = createRng(nextSeed + state.round * 53 + 7 + i * 17);
        spin = spinWithEligibility(rand, open, taken, 40, state.lockedFranchiseId);
        const pool = getAvailablePlayers(spin, open, taken);
        if (!pool.length) {
          nextSeed += 3;
          continue;
        }
        if (state.salaryCap == null) break;
        const spent = rosterSpend(state.roster.map((s) => s.player));
        const remaining = state.salaryCap - spent;
        if (pool.some((p) => playerSalary(p) <= remaining)) break;
        nextSeed += 3;
      }
      return { ...state, spin, randSeed: nextSeed };
    }
    case 'PICK': {
      if (state.salaryCap != null) {
        const spent = rosterSpend(state.roster.map((s) => s.player));
        if (spent + playerSalary(action.player) > state.salaryCap) return state;
      }
      const roster = state.roster.map((slot) =>
        slot.position === action.position
          ? { ...slot, player: action.player }
          : slot,
      );
      const filled = roster.every((s) => s.player);
      return {
        ...state,
        roster,
        spin: null,
        round: filled ? state.round : state.round + 1,
        screen: filled ? 'reveal' : 'draft',
      };
    }
    case 'SET_RESULT':
      if (state.result) return state;
      return {
        ...state,
        result: action.result,
        madeLeaderboard: action.madeLeaderboard,
        dailyRank: action.dailyRank,
        newAchievements: action.newAchievements,
        screen: 'result',
      };
    case 'RESET':
      return { ...initialState, screen: 'home' };
    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  startGame: (mode: GameMode, franchiseId?: string, challengeCode?: string) => void;
  beginFranchiseSelect: () => void;
  spin: () => void;
  skipTeam: () => void;
  skipDecade: () => void;
  respinEmpty: () => void;
  pickPlayer: (player: Player, position: Position) => void;
  finishReveal: () => void;
  goHome: () => void;
  setScreen: (screen: Screen) => void;
  availablePlayers: Player[];
  franchiseName: string;
  salarySpent: number;
  salaryRemaining: number | null;
  modeLabel: string;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const startGame = useCallback(
    (mode: GameMode, franchiseId?: string, challengeCode?: string) => {
      dispatch({ type: 'START', mode, franchiseId, challengeCode });
    },
    [],
  );

  const beginFranchiseSelect = useCallback(() => {
    dispatch({ type: 'SET_SCREEN', screen: 'franchise-select' });
  }, []);

  const spin = useCallback(() => {
    dispatch({ type: 'SPIN_START' });
    let rand: () => number;
    if (state.mode === 'daily') {
      rand = dailyRng(state.dateKey ?? utcDateKey());
      for (let i = 0; i < state.round * 17; i++) rand();
    } else if (state.mode === 'challenge') {
      rand = createRng(state.randSeed);
      for (let i = 0; i < state.round * 17; i++) rand();
    } else {
      rand = createRng(state.randSeed + state.round * 1009);
    }
    const open = openPositions(state.roster);
    const taken = takenIds(state.roster);
    let result = spinWithEligibility(
      rand,
      open,
      taken,
      40,
      state.lockedFranchiseId,
    );
    if (
      (state.mode === 'daily' || state.mode === 'challenge') &&
      getAvailablePlayers(result, open, taken).length === 0
    ) {
      for (let i = 0; i < 60; i++) {
        result = spinWithEligibility(rand, open, taken, 20, state.lockedFranchiseId);
        if (getAvailablePlayers(result, open, taken).length > 0) break;
      }
    }
    window.setTimeout(
      () => dispatch({ type: 'SPIN_DONE', spin: result }),
      spinDurationMs(),
    );
  }, [
    state.dateKey,
    state.lockedFranchiseId,
    state.mode,
    state.randSeed,
    state.roster,
    state.round,
  ]);

  const skipTeam = useCallback(() => dispatch({ type: 'SKIP_TEAM' }), []);
  const skipDecade = useCallback(() => dispatch({ type: 'SKIP_DECADE' }), []);
  const respinEmpty = useCallback(() => dispatch({ type: 'RESPIN' }), []);

  const pickPlayer = useCallback((player: Player, position: Position) => {
    dispatch({ type: 'PICK', player, position });
  }, []);

  const finishReveal = useCallback(() => {
    void (async () => {
      const result = simulateSeason(state.roster, { tough: state.mode === 'tough' });
      const rosterNames = state.roster.map((s) => s.player?.name ?? '—');
      let madeLeaderboard = false;
      let dailyRank: number | null = null;

      if (state.mode === 'classic') {
        madeLeaderboard = tryAddLeaderboardEntry({
          id: `${Date.now()}-${result.wins}`,
          wins: result.wins,
          losses: result.losses,
          gradeLabel: result.gradeLabel,
          mode: 'classic',
          rosterNames,
          createdAt: new Date().toISOString(),
        });
      }

      if (state.mode === 'daily' && state.dateKey) {
        saveDailyRecord({
          dateKey: state.dateKey,
          completed: true,
          wins: result.wins,
          losses: result.losses,
          gradeLabel: result.gradeLabel,
          rosterNames,
        });
        const submitted = await submitDailyBoard({
          dateKey: state.dateKey,
          wins: result.wins,
          losses: result.losses,
          gradeLabel: result.gradeLabel,
          rosterNames,
        });
        dailyRank = submitted.rank ?? null;
      }

      const career = state.mode
        ? recordCareerResult({
            mode: state.mode,
            result,
            dateKey: state.dateKey,
          })
        : null;

      const newAchievements =
        state.mode && career
          ? evaluateAchievements({
              mode: state.mode,
              result,
              rosterPlayers: state.roster.map((s) => s.player),
              career,
            })
          : [];

      try {
        localStorage.setItem(
          'nhl820_last_result',
          JSON.stringify({ result, rosterNames, mode: state.mode }),
        );
      } catch {
        /* ignore */
      }

      dispatch({
        type: 'SET_RESULT',
        result,
        madeLeaderboard,
        dailyRank,
        newAchievements,
      });
    })();
  }, [state.dateKey, state.mode, state.roster]);

  const goHome = useCallback(() => dispatch({ type: 'RESET' }), []);
  const setScreen = useCallback(
    (screen: Screen) => dispatch({ type: 'SET_SCREEN', screen }),
    [],
  );

  const salarySpent = useMemo(
    () => rosterSpend(state.roster.map((s) => s.player)),
    [state.roster],
  );
  const salaryRemaining =
    state.salaryCap != null ? state.salaryCap - salarySpent : null;

  const availablePlayers = useMemo(() => {
    if (!state.spin) return [];
    return getAvailablePlayers(
      state.spin,
      openPositions(state.roster),
      takenIds(state.roster),
    );
  }, [state.roster, state.spin]);

  const franchiseName = state.spin
    ? FRANCHISE_BY_ID[state.spin.franchiseId]?.name ?? state.spin.franchiseId
    : state.lockedFranchiseId
      ? FRANCHISE_BY_ID[state.lockedFranchiseId]?.name ?? state.lockedFranchiseId
      : '';

  const modeLabel = state.mode ? MODE_LABELS[state.mode] : '';

  const value = useMemo(
    () => ({
      state,
      startGame,
      beginFranchiseSelect,
      spin,
      skipTeam,
      skipDecade,
      respinEmpty,
      pickPlayer,
      finishReveal,
      goHome,
      setScreen,
      availablePlayers,
      franchiseName,
      salarySpent,
      salaryRemaining,
      modeLabel,
    }),
    [
      state,
      startGame,
      beginFranchiseSelect,
      spin,
      skipTeam,
      skipDecade,
      respinEmpty,
      pickPlayer,
      finishReveal,
      goHome,
      setScreen,
      availablePlayers,
      franchiseName,
      salarySpent,
      salaryRemaining,
      modeLabel,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
