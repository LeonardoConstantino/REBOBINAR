import { openDB, IDBPDatabase } from 'idb';
import { CauseId, ModeId, RunStats } from '../../core/types';

export interface DeathMarkRecord {
  mode: ModeId;
  bucket: number;
  count: number;
  lastRun: number;
  cause: CauseId;
}

export interface SettingsRecord {
  id: 'main';
  volume: number;
  fxTier: 'high' | 'mid' | 'low';
  marksVisibility: 'all' | 'nearby' | 'off';
  fastRewind: boolean;
  screenShake: number; // 0 to 1
  flickerReduction: boolean;
  leftHandedPad: boolean;
  padScale: number; // 0.8 to 1.3
  touchControls: 'auto' | 'always' | 'never';
}

export interface CorridorRecord {
  mode: ModeId;
  corridorSeed: number;
  totalRuns: number;
  bestDistance: number;
  bestTime: number;
}

export interface CodexRecord {
  entryId: string;
  firstSeenAt: number;
  encounters: number;
  deathsBy: number;
}

const DEFAULT_SETTINGS: SettingsRecord = {
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
};

class GameDatabase {
  private db: IDBPDatabase | null = null;
  private isAvailable: boolean = true;

  // In-memory fallbacks if IDB unavailable
  private memDeathMarks: Map<string, DeathMarkRecord> = new Map();
  private memCorridors: Map<ModeId, CorridorRecord> = new Map();
  private memSettings: SettingsRecord = { ...DEFAULT_SETTINGS };
  private memCodex: Map<string, CodexRecord> = new Map();
  private memSplits: Map<string, number> = new Map();

  async init(): Promise<void> {
    try {
      this.db = await openDB('rebobinar', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('profile')) {
            db.createObjectStore('profile', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('corridors')) {
            db.createObjectStore('corridors', { keyPath: 'mode' });
          }
          if (!db.objectStoreNames.contains('deathMarks')) {
            // Compound key: [mode, bucket]
            db.createObjectStore('deathMarks', { keyPath: ['mode', 'bucket'] });
          }
          if (!db.objectStoreNames.contains('splits')) {
            db.createObjectStore('splits', { keyPath: ['mode', 'segment'] });
          }
          if (!db.objectStoreNames.contains('codex')) {
            db.createObjectStore('codex', { keyPath: 'entryId' });
          }
          if (!db.objectStoreNames.contains('posters')) {
            db.createObjectStore('posters', { autoIncrement: true });
          }
        },
      });
    } catch {
      this.isAvailable = false;
      this.db = null;
    }
  }

  async getSettings(): Promise<SettingsRecord> {
    if (!this.isAvailable || !this.db) {
      return this.memSettings;
    }
    try {
      const data = await this.db.get('settings', 'main');
      return data || this.memSettings;
    } catch {
      return this.memSettings;
    }
  }

  async saveSettings(settings: SettingsRecord): Promise<void> {
    this.memSettings = { ...settings };
    if (!this.isAvailable || !this.db) return;
    try {
      await this.db.put('settings', settings);
    } catch {
      // Non-fatal
    }
  }

  async getCorridor(mode: ModeId): Promise<CorridorRecord> {
    if (!this.isAvailable || !this.db) {
      return (
        this.memCorridors.get(mode) || {
          mode,
          corridorSeed: 198402,
          totalRuns: 0,
          bestDistance: 0,
          bestTime: 0,
        }
      );
    }
    try {
      const res = await this.db.get('corridors', mode);
      return (
        res || {
          mode,
          corridorSeed: 198402,
          totalRuns: 0,
          bestDistance: 0,
          bestTime: 0,
        }
      );
    } catch {
      return {
        mode,
        corridorSeed: 198402,
        totalRuns: 0,
        bestDistance: 0,
        bestTime: 0,
      };
    }
  }

  async recordRunEnd(stats: RunStats): Promise<void> {
    // Write-behind pattern
    setTimeout(async () => {
      try {
        // Update Corridor record
        const corridor = await this.getCorridor(stats.mode);
        corridor.totalRuns++;
        if (stats.distanceMeters > corridor.bestDistance) {
          corridor.bestDistance = stats.distanceMeters;
          corridor.bestTime = stats.timeSeconds;
        }
        this.memCorridors.set(stats.mode, corridor);
        if (this.db) {
          await this.db.put('corridors', corridor);
        }

        // Record Death Mark
        if (stats.deathBucket !== undefined && stats.deathCause) {
          const key = `${stats.mode}:${stats.deathBucket}`;
          let mark = this.memDeathMarks.get(key);
          if (!mark && this.db) {
            mark = await this.db.get('deathMarks', [stats.mode, stats.deathBucket]);
          }

          if (mark) {
            mark.count++;
            mark.lastRun = corridor.totalRuns;
            mark.cause = stats.deathCause;
          } else {
            mark = {
              mode: stats.mode,
              bucket: stats.deathBucket,
              count: 1,
              lastRun: corridor.totalRuns,
              cause: stats.deathCause,
            };
          }

          this.memDeathMarks.set(key, mark);
          if (this.db) {
            await this.db.put('deathMarks', mark);
          }
        }

        // Update Codex entry
        if (stats.deathCause) {
          let codex = this.memCodex.get(stats.deathCause);
          if (!codex && this.db) {
            codex = await this.db.get('codex', stats.deathCause);
          }
          if (codex) {
            codex.encounters++;
            codex.deathsBy++;
          } else {
            codex = {
              entryId: stats.deathCause,
              firstSeenAt: Date.now(),
              encounters: 1,
              deathsBy: 1,
            };
          }
          this.memCodex.set(stats.deathCause, codex);
          if (this.db) {
            await this.db.put('codex', codex);
          }
        }
      } catch {
        // Silently preserve in-memory
      }
    }, 10);
  }

  async getAllDeathMarks(mode: ModeId): Promise<DeathMarkRecord[]> {
    if (!this.isAvailable || !this.db) {
      return Array.from(this.memDeathMarks.values()).filter((m) => m.mode === mode);
    }
    try {
      const all = await this.db.getAll('deathMarks');
      return all.filter((m) => m.mode === mode);
    } catch {
      return Array.from(this.memDeathMarks.values()).filter((m) => m.mode === mode);
    }
  }

  async getAllCodex(): Promise<CodexRecord[]> {
    if (!this.isAvailable || !this.db) {
      return Array.from(this.memCodex.values());
    }
    try {
      return await this.db.getAll('codex');
    } catch {
      return Array.from(this.memCodex.values());
    }
  }
}

export const dbService = new GameDatabase();
