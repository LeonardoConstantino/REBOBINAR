import { create } from 'zustand';
import { CauseId, KeyframeSplit, ModeId, PowerupId, RunStats } from '../core/types';
import { SettingsRecord, dbService } from '../platform/storage/db';

export type ActiveModal =
  | 'none'
  | 'poster'
  | 'cinematheque'
  | 'settings'
  | 'mode_select'
  | 'calibration';

interface GameUIState {
  mode: ModeId;
  distanceMeters: number;
  bestDistanceMeters: number;
  takesCount: number;
  pressure: number;
  retakeCharges: number;
  storedPowerup: PowerupId | null;
  activePowerup: PowerupId | null;
  activePowerupTimer: number;

  latestSplit: KeyframeSplit | null;
  isRewinding: boolean;
  rewindProgress: number;
  canSkipRewind: boolean;

  activeModal: ActiveModal;
  isPortrait: boolean;
  lastRunStats: RunStats | null;

  settings: SettingsRecord;
  currentScreen: 'title' | 'game';

  // Actions
  setMode: (mode: ModeId) => void;
  startGame: () => void;
  goToTitle: () => void;
  updateHUD: (data: {
    distanceMeters: number;
    takesCount: number;
    pressure: number;
    retakeCharges: number;
    storedPowerup: PowerupId | null;
    activePowerup: PowerupId | null;
    activePowerupTimer: number;
  }) => void;
  setSplit: (split: KeyframeSplit) => void;
  setBestDistance: (meters: number) => void;
  setRewindState: (isRewinding: boolean, progress: number, canSkip: boolean) => void;
  openModal: (modal: ActiveModal) => void;
  closeModal: () => void;
  setPortrait: (isPortrait: boolean) => void;
  setLastRunStats: (stats: RunStats) => void;
  updateSettings: (newSettings: Partial<SettingsRecord>) => void;
  loadInitialData: () => Promise<void>;
}

export const useGameStore = create<GameUIState>((set, get) => ({
  mode: 'studio',
  currentScreen: 'title',
  distanceMeters: 0,
  bestDistanceMeters: 0,
  takesCount: 1,
  pressure: 0,
  retakeCharges: 1,
  storedPowerup: null,
  activePowerup: null,
  activePowerupTimer: 0,

  latestSplit: null,
  isRewinding: false,
  rewindProgress: 0,
  canSkipRewind: false,

  activeModal: 'none',
  isPortrait: false,
  lastRunStats: null,

  settings: {
    id: 'main',
    volume: 0.8,
    fxTier: 'high',
    marksVisibility: 'all',
    fastRewind: false,
    screenShake: 1.0,
    flickerReduction: false,
    leftHandedPad: false,
    padScale: 1.0,
    touchControls: 'auto',
  },

  setMode: (mode) => set({ mode }),
  startGame: () => set({ currentScreen: 'game', activeModal: 'none' }),
  goToTitle: () => set({ currentScreen: 'title', activeModal: 'none' }),

  updateHUD: (data) =>
    set({
      distanceMeters: data.distanceMeters,
      takesCount: data.takesCount,
      pressure: data.pressure,
      retakeCharges: data.retakeCharges,
      storedPowerup: data.storedPowerup,
      activePowerup: data.activePowerup,
      activePowerupTimer: data.activePowerupTimer,
    }),

  setSplit: (split) => set({ latestSplit: split }),
  setBestDistance: (bestDistanceMeters) => set({ bestDistanceMeters }),

  setRewindState: (isRewinding, rewindProgress, canSkipRewind) =>
    set({ isRewinding, rewindProgress, canSkipRewind }),

  openModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: 'none' }),
  setPortrait: (isPortrait) => set({ isPortrait }),
  setLastRunStats: (lastRunStats) => set({ lastRunStats }),

  updateSettings: (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    set({ settings: updated });
    dbService.saveSettings(updated);
  },

  loadInitialData: async () => {
    await dbService.init();
    const settings = await dbService.getSettings();
    const corridor = await dbService.getCorridor(get().mode);
    set({
      settings,
      bestDistanceMeters: corridor.bestDistance,
    });
  },
}));
