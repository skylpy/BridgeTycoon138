// 公共类型定义，集中描述配置、存档和事件数据结构。
export interface BridgeLevelConfig {
  level: number;
  name: string;
  upgradeCost: number;
  clickIncome: number;
  vehicleIncome: number;
  idleIncomePerSecond: number;
}

export interface VehicleConfig {
  type: string;
  name: string;
  speed: number;
  incomeMultiplier: number;
  color?: string;
}

export interface IncomeConfig {
  vehicleSpawnInterval: number;
  offlineMaxSeconds: number;
  autoSaveInterval: number;
  adMockSuccessRate: number;
  autoIncomeInterval: number;
}

export interface GameSaveData {
  coins: number;
  bridgeLevel: number;
  lastExitTime: number;
  soundEnabled: boolean;
  guideViewed: boolean;
  currentLevel: number;
  unlockedLevel: number;
  levelStars: Record<string, number>;
}

export interface OfflineRewardData {
  offlineSeconds: number;
  rewardCoins: number;
}

export interface GameEvents {
  COINS_CHANGED: string;
  BRIDGE_LEVEL_CHANGED: string;
  TOAST: string;
  SAVE_CHANGED: string;
}

export const GAME_EVENTS: GameEvents = {
  COINS_CHANGED: 'COINS_CHANGED',
  BRIDGE_LEVEL_CHANGED: 'BRIDGE_LEVEL_CHANGED',
  TOAST: 'TOAST',
  SAVE_CHANGED: 'SAVE_CHANGED',
};
