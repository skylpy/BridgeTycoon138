// 游戏配置加载器，优先读取 resources/configs 下 JSON，失败时使用内置默认配置。
import { JsonAsset, resources } from 'cc';
import { BridgeLevelConfig, IncomeConfig, VehicleConfig } from './Types';
import { safeNumber } from './Utils';

const DEFAULT_BRIDGE_CONFIGS: BridgeLevelConfig[] = [
  { level: 1, name: '木板小桥', upgradeCost: 100, clickIncome: 1, vehicleIncome: 5, idleIncomePerSecond: 1 },
  { level: 2, name: '加固木桥', upgradeCost: 220, clickIncome: 2, vehicleIncome: 10, idleIncomePerSecond: 2 },
  { level: 3, name: '乡村木桥', upgradeCost: 480, clickIncome: 4, vehicleIncome: 18, idleIncomePerSecond: 4 },
  { level: 4, name: '石板小桥', upgradeCost: 950, clickIncome: 7, vehicleIncome: 30, idleIncomePerSecond: 7 },
  { level: 5, name: '青石拱桥', upgradeCost: 1800, clickIncome: 12, vehicleIncome: 48, idleIncomePerSecond: 12 },
  { level: 6, name: '河畔石桥', upgradeCost: 3300, clickIncome: 20, vehicleIncome: 75, idleIncomePerSecond: 20 },
  { level: 7, name: '钢筋桥', upgradeCost: 5800, clickIncome: 32, vehicleIncome: 112, idleIncomePerSecond: 32 },
  { level: 8, name: '钢架桥', upgradeCost: 9600, clickIncome: 50, vehicleIncome: 165, idleIncomePerSecond: 50 },
  { level: 9, name: '双车道桥', upgradeCost: 15000, clickIncome: 76, vehicleIncome: 235, idleIncomePerSecond: 76 },
  { level: 10, name: '城镇大桥', upgradeCost: 23000, clickIncome: 112, vehicleIncome: 330, idleIncomePerSecond: 112 },
  { level: 11, name: '城市高架桥', upgradeCost: 34000, clickIncome: 160, vehicleIncome: 455, idleIncomePerSecond: 160 },
  { level: 12, name: '快速通行桥', upgradeCost: 50000, clickIncome: 225, vehicleIncome: 620, idleIncomePerSecond: 225 },
  { level: 13, name: '江面大桥', upgradeCost: 72000, clickIncome: 310, vehicleIncome: 835, idleIncomePerSecond: 310 },
  { level: 14, name: '山谷悬索桥', upgradeCost: 102000, clickIncome: 420, vehicleIncome: 1110, idleIncomePerSecond: 420 },
  { level: 15, name: '跨江大桥', upgradeCost: 145000, clickIncome: 560, vehicleIncome: 1460, idleIncomePerSecond: 560 },
  { level: 16, name: '跨海大桥', upgradeCost: 205000, clickIncome: 735, vehicleIncome: 1900, idleIncomePerSecond: 735 },
  { level: 17, name: '超级立交桥', upgradeCost: 288000, clickIncome: 960, vehicleIncome: 2450, idleIncomePerSecond: 960 },
  { level: 18, name: '智能交通桥', upgradeCost: 400000, clickIncome: 1250, vehicleIncome: 3150, idleIncomePerSecond: 1250 },
  { level: 19, name: '未来科技桥', upgradeCost: 560000, clickIncome: 1620, vehicleIncome: 4050, idleIncomePerSecond: 1620 },
  { level: 20, name: '天空巨桥', upgradeCost: 0, clickIncome: 2100, vehicleIncome: 5200, idleIncomePerSecond: 2100 },
];

const DEFAULT_VEHICLE_CONFIGS: VehicleConfig[] = [
  { type: 'car', name: '小汽车', speed: 180, incomeMultiplier: 1, color: '#4DA3FF' },
  { type: 'truck', name: '货车', speed: 130, incomeMultiplier: 2, color: '#F5A623' },
  { type: 'bus', name: '巴士', speed: 110, incomeMultiplier: 3, color: '#7ED321' },
];

const DEFAULT_INCOME_CONFIG: IncomeConfig = {
  vehicleSpawnInterval: 2,
  offlineMaxSeconds: 28800,
  autoSaveInterval: 5,
  adMockSuccessRate: 0.9,
  autoIncomeInterval: 1,
};

type JsonValue = unknown;
type JsonRecord = Record<string, unknown>;

export class GameConfig {
  private static bridgeConfigs: BridgeLevelConfig[] = DEFAULT_BRIDGE_CONFIGS;
  private static vehicleConfigs: VehicleConfig[] = DEFAULT_VEHICLE_CONFIGS;
  private static incomeConfig: IncomeConfig = DEFAULT_INCOME_CONFIG;

  public static async loadAllConfigs(): Promise<void> {
    const [bridgeJson, vehicleJson, incomeJson] = await Promise.all([
      GameConfig.loadJson('configs/bridgeConfig'),
      GameConfig.loadJson('configs/vehicleConfig'),
      GameConfig.loadJson('configs/incomeConfig'),
    ]);

    GameConfig.bridgeConfigs = GameConfig.normalizeBridgeConfigs(bridgeJson);
    GameConfig.vehicleConfigs = GameConfig.normalizeVehicleConfigs(vehicleJson);
    GameConfig.incomeConfig = GameConfig.normalizeIncomeConfig(incomeJson);
    console.log('[GameConfig] 配置加载完成', {
      bridge: GameConfig.bridgeConfigs.length,
      vehicle: GameConfig.vehicleConfigs.length,
      income: GameConfig.incomeConfig,
    });
  }

  public static getBridgeConfig(level: number): BridgeLevelConfig {
    const configs = GameConfig.bridgeConfigs.length > 0 ? GameConfig.bridgeConfigs : DEFAULT_BRIDGE_CONFIGS;
    const sorted = configs.slice().sort((a: BridgeLevelConfig, b: BridgeLevelConfig) => a.level - b.level);
    const maxLevel = sorted[sorted.length - 1].level;
    const minLevel = sorted[0].level;
    const safeLevel = Math.min(Math.max(Math.floor(level), minLevel), maxLevel);
    return sorted.find((config: BridgeLevelConfig) => config.level === safeLevel) ?? sorted[0];
  }

  public static getAllBridgeConfigs(): BridgeLevelConfig[] {
    return GameConfig.bridgeConfigs.slice();
  }

  public static getVehicleConfigs(): VehicleConfig[] {
    return GameConfig.vehicleConfigs.slice();
  }

  public static getIncomeConfig(): IncomeConfig {
    return { ...GameConfig.incomeConfig };
  }

  public static getMaxBridgeLevel(): number {
    return GameConfig.bridgeConfigs.reduce((maxLevel: number, config: BridgeLevelConfig) => Math.max(maxLevel, config.level), 1);
  }

  private static loadJson(path: string): Promise<JsonValue | null> {
    return new Promise<JsonValue | null>((resolve: (value: JsonValue | null) => void) => {
      resources.load(path, JsonAsset, (error: Error | null, asset: JsonAsset | null) => {
        if (error || !asset) {
          console.warn(`[GameConfig] 配置 ${path} 加载失败，使用默认配置`, error);
          resolve(null);
          return;
        }
        resolve(asset.json as JsonValue);
      });
    });
  }

  private static normalizeBridgeConfigs(value: JsonValue | null): BridgeLevelConfig[] {
    if (!Array.isArray(value)) {
      return DEFAULT_BRIDGE_CONFIGS.slice();
    }
    const normalized = value.map((item: unknown, index: number): BridgeLevelConfig => {
      const fallback = DEFAULT_BRIDGE_CONFIGS[index] ?? DEFAULT_BRIDGE_CONFIGS[DEFAULT_BRIDGE_CONFIGS.length - 1];
      const record = GameConfig.asRecord(item);
      return {
        level: Math.max(1, Math.floor(safeNumber(record.level, fallback.level))),
        name: typeof record.name === 'string' && record.name.length > 0 ? record.name : fallback.name,
        upgradeCost: Math.max(0, safeNumber(record.upgradeCost, fallback.upgradeCost)),
        clickIncome: Math.max(0, safeNumber(record.clickIncome, fallback.clickIncome)),
        vehicleIncome: Math.max(0, safeNumber(record.vehicleIncome, fallback.vehicleIncome)),
        idleIncomePerSecond: Math.max(0, safeNumber(record.idleIncomePerSecond, fallback.idleIncomePerSecond)),
      };
    });
    return normalized.length > 0 ? normalized.sort((a: BridgeLevelConfig, b: BridgeLevelConfig) => a.level - b.level) : DEFAULT_BRIDGE_CONFIGS.slice();
  }

  private static normalizeVehicleConfigs(value: JsonValue | null): VehicleConfig[] {
    if (!Array.isArray(value)) {
      return DEFAULT_VEHICLE_CONFIGS.slice();
    }
    const normalized = value.map((item: unknown, index: number): VehicleConfig => {
      const fallback = DEFAULT_VEHICLE_CONFIGS[index] ?? DEFAULT_VEHICLE_CONFIGS[0];
      const record = GameConfig.asRecord(item);
      return {
        type: typeof record.type === 'string' && record.type.length > 0 ? record.type : fallback.type,
        name: typeof record.name === 'string' && record.name.length > 0 ? record.name : fallback.name,
        speed: Math.max(1, safeNumber(record.speed, fallback.speed)),
        incomeMultiplier: Math.max(0, safeNumber(record.incomeMultiplier, fallback.incomeMultiplier)),
        color: typeof record.color === 'string' ? record.color : fallback.color,
      };
    });
    return normalized.length > 0 ? normalized : DEFAULT_VEHICLE_CONFIGS.slice();
  }

  private static normalizeIncomeConfig(value: JsonValue | null): IncomeConfig {
    const record = GameConfig.asRecord(value);
    return {
      vehicleSpawnInterval: Math.max(0.1, safeNumber(record.vehicleSpawnInterval, DEFAULT_INCOME_CONFIG.vehicleSpawnInterval)),
      offlineMaxSeconds: Math.max(0, safeNumber(record.offlineMaxSeconds, DEFAULT_INCOME_CONFIG.offlineMaxSeconds)),
      autoSaveInterval: Math.max(1, safeNumber(record.autoSaveInterval, DEFAULT_INCOME_CONFIG.autoSaveInterval)),
      adMockSuccessRate: Math.min(Math.max(safeNumber(record.adMockSuccessRate, DEFAULT_INCOME_CONFIG.adMockSuccessRate), 0), 1),
      autoIncomeInterval: Math.max(0.1, safeNumber(record.autoIncomeInterval, DEFAULT_INCOME_CONFIG.autoIncomeInterval)),
    };
  }

  private static asRecord(value: unknown): JsonRecord {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as JsonRecord;
    }
    return {};
  }
}

