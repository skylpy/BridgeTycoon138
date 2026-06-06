// 本地存档管理，负责读取、保存、清空和退出时间记录。
import { _decorator, Component, sys } from 'cc';
import { EventBus } from './EventBus';
import { GameSaveData, GAME_EVENTS } from './Types';
import { safeNumber } from './Utils';

const { ccclass } = _decorator;
const SAVE_KEY = 'bridge_tycoon_v1_save_data';

@ccclass('SaveManager')
export class SaveManager extends Component {
  public loadSave(): GameSaveData {
    const defaultSave = this.getDefaultSave();
    try {
      const raw = sys.localStorage.getItem(SAVE_KEY);
      if (!raw) {
        console.log('[SaveManager] 未找到存档，使用默认存档', defaultSave);
        return defaultSave;
      }
      const parsed = JSON.parse(raw) as unknown;
      const saveData = this.normalizeSave(parsed, defaultSave);
      console.log('[SaveManager] 读取存档成功', saveData);
      return saveData;
    } catch (error) {
      console.warn('[SaveManager] 读取存档失败，使用默认存档', error);
      return defaultSave;
    }
  }

  public saveData(data: GameSaveData): void {
    const normalized = this.normalizeSave(data, this.getDefaultSave());
    try {
      sys.localStorage.setItem(SAVE_KEY, JSON.stringify(normalized));
      console.log('[SaveManager] 保存存档成功', normalized);
      EventBus.emit<GameSaveData>(GAME_EVENTS.SAVE_CHANGED, normalized);
    } catch (error) {
      console.warn('[SaveManager] 保存存档失败', error);
    }
  }

  public clearSave(): void {
    try {
      sys.localStorage.removeItem(SAVE_KEY);
      console.log('[SaveManager] 已清空存档');
    } catch (error) {
      console.warn('[SaveManager] 清空存档失败', error);
    }
  }

  public getDefaultSave(): GameSaveData {
    return {
      coins: 0,
      bridgeLevel: 1,
      lastExitTime: Date.now(),
      soundEnabled: true,
      guideViewed: false,
      currentLevel: 1,
      unlockedLevel: 1,
      levelStars: {},
    };
  }

  public markExitTime(data: GameSaveData): GameSaveData {
    return {
      ...this.normalizeSave(data, this.getDefaultSave()),
      lastExitTime: Date.now(),
    };
  }

  private normalizeSave(value: unknown, fallback: GameSaveData): GameSaveData {
    const record = typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
    const lastExitTime = safeNumber(record.lastExitTime, fallback.lastExitTime);
    return {
      coins: Math.max(0, safeNumber(record.coins, fallback.coins)),
      bridgeLevel: Math.max(1, Math.floor(safeNumber(record.bridgeLevel, fallback.bridgeLevel))),
      lastExitTime: Number.isFinite(lastExitTime) && lastExitTime > 0 ? lastExitTime : Date.now(),
      soundEnabled: typeof record.soundEnabled === 'boolean' ? record.soundEnabled : fallback.soundEnabled,
      guideViewed: typeof record.guideViewed === 'boolean' ? record.guideViewed : fallback.guideViewed,
      currentLevel: Math.max(1, Math.floor(safeNumber(record.currentLevel, fallback.currentLevel))),
      unlockedLevel: Math.max(1, Math.floor(safeNumber(record.unlockedLevel, fallback.unlockedLevel))),
      levelStars: this.normalizeLevelStars(record.levelStars, fallback.levelStars),
    };
  }

  private normalizeLevelStars(value: unknown, fallback: Record<string, number>): Record<string, number> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return { ...fallback };
    }
    const result: Record<string, number> = {};
    const record = value as Record<string, unknown>;
    Object.keys(record).forEach((key: string) => {
      const stars = record[key];
      const normalizedStars = Math.max(0, Math.min(3, Math.floor(safeNumber(stars, 0))));
      if (normalizedStars > 0) {
        result[key] = normalizedStars;
      }
    });
    return result;
  }
}
