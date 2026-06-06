import { _decorator, Component, JsonAsset, resources, sys } from 'cc';
import { LevelConfig, LevelResult } from './LevelTypes';

const { ccclass } = _decorator;

const SAVE_KEY = 'bridge_tycoon_v1_save_data';

export const DEFAULT_LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 1,
    name: '基础连桥',
    difficulty: 'tutorial',
    tips: '先用桥面横向连通左右道路，让小车可以通过。',
    budget: 100,
    spanWidth: 320,
    roadHeight: 0,
    anchorPoints: [{ x: -160, y: 0 }, { x: 160, y: 0 }],
    buildArea: { x: 0, y: -70, width: 440, height: 240 },
    vehicles: [{ type: 'car', weight: 1, speed: 68, count: 1, spawnInterval: 1.2 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 100 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 70 } },
    unlockNextOnPass: true,
  },
  {
    level: 2,
    name: '三角支撑',
    difficulty: 'tutorial',
    tips: '桥面下方加入双三角支撑，结构会更稳。',
    budget: 120,
    spanWidth: 380,
    roadHeight: 0,
    anchorPoints: [{ x: -190, y: 0 }, { x: 190, y: 0 }, { x: -190, y: -40 }, { x: 190, y: -40 }],
    buildArea: { x: 0, y: -76, width: 500, height: 250 },
    vehicles: [{ type: 'car', weight: 1, speed: 70, count: 1, spawnInterval: 1.2 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 120 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 86 } },
    unlockNextOnPass: true,
  },
  {
    level: 3,
    name: '桥面加固',
    difficulty: 'tutorial',
    tips: '车辆稍重，单纯平桥容易下沉，给桥面补上支撑。',
    budget: 130,
    spanWidth: 400,
    roadHeight: 0,
    anchorPoints: [{ x: -200, y: 0 }, { x: 200, y: 0 }, { x: -200, y: -40 }, { x: 200, y: -40 }],
    buildArea: { x: 0, y: -80, width: 520, height: 250 },
    vehicles: [{ type: 'car', weight: 1.2, speed: 70, count: 1, spawnInterval: 1.2 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 130 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 92 } },
    unlockNextOnPass: true,
  },
  {
    level: 4,
    name: '节省材料',
    difficulty: 'tutorial',
    tips: '预算变紧，尽量用必要杆件完成稳定结构。',
    budget: 105,
    spanWidth: 400,
    roadHeight: 0,
    anchorPoints: [{ x: -200, y: 0 }, { x: 200, y: 0 }, { x: -200, y: -40 }, { x: 200, y: -40 }],
    buildArea: { x: 0, y: -80, width: 520, height: 240 },
    vehicles: [{ type: 'car', weight: 1, speed: 72, count: 1, spawnInterval: 1.2 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 105 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 78 } },
    unlockNextOnPass: true,
  },
  {
    level: 5,
    name: '小河跨越',
    difficulty: 'tutorial',
    tips: '跨度变长，先保证桥面连续，再补三角支撑。',
    budget: 140,
    spanWidth: 460,
    roadHeight: 0,
    anchorPoints: [{ x: -230, y: 0 }, { x: 230, y: 0 }, { x: -230, y: -40 }, { x: 230, y: -40 }],
    buildArea: { x: 0, y: -84, width: 580, height: 260 },
    vehicles: [{ type: 'car', weight: 1, speed: 74, count: 1, spawnInterval: 1.2 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 140 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 102 } },
    unlockNextOnPass: true,
  },
  {
    level: 6,
    name: '轻货车',
    difficulty: 'easy',
    tips: '轻货车更重，桥面下方需要更可靠的承重结构。',
    budget: 160,
    spanWidth: 460,
    roadHeight: 0,
    anchorPoints: [{ x: -230, y: 0 }, { x: 230, y: 0 }, { x: -230, y: -40 }, { x: 230, y: -40 }],
    buildArea: { x: 0, y: -86, width: 590, height: 260 },
    vehicles: [{ type: 'truck', weight: 1.8, speed: 62, count: 1, spawnInterval: 1.3 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 160 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 118 } },
    unlockNextOnPass: true,
  },
  {
    level: 7,
    name: '双车通行',
    difficulty: 'easy',
    tips: '两辆小车连续通过，桥梁需要保持稳定。',
    budget: 160,
    spanWidth: 470,
    roadHeight: 0,
    anchorPoints: [{ x: -235, y: 0 }, { x: 235, y: 0 }, { x: -235, y: -40 }, { x: 235, y: -40 }],
    buildArea: { x: 0, y: -86, width: 600, height: 260 },
    vehicles: [{ type: 'car', weight: 1, speed: 72, count: 2, spawnInterval: 1.2 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 160 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 116 } },
    unlockNextOnPass: true,
  },
  {
    level: 8,
    name: '低预算挑战',
    difficulty: 'easy',
    tips: '跨度不变但预算明显减少，删掉多余杆件。',
    budget: 130,
    spanWidth: 470,
    roadHeight: 0,
    anchorPoints: [{ x: -235, y: 0 }, { x: 235, y: 0 }, { x: -235, y: -40 }, { x: 235, y: -40 }],
    buildArea: { x: 0, y: -86, width: 600, height: 250 },
    vehicles: [{ type: 'car', weight: 1, speed: 74, count: 1, spawnInterval: 1.2 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 130 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 96 } },
    unlockNextOnPass: true,
  },
  {
    level: 9,
    name: '长跨度',
    difficulty: 'easy',
    tips: '跨度继续变长，中心区域需要桁架分担压力。',
    budget: 180,
    spanWidth: 540,
    roadHeight: 0,
    anchorPoints: [{ x: -270, y: 0 }, { x: 270, y: 0 }, { x: -270, y: -40 }, { x: 270, y: -40 }],
    buildArea: { x: 0, y: -90, width: 660, height: 270 },
    vehicles: [{ type: 'car', weight: 1, speed: 76, count: 1, spawnInterval: 1.2 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 180 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 132 } },
    unlockNextOnPass: true,
  },
  {
    level: 10,
    name: '无中间支撑',
    difficulty: 'easy',
    tips: '较长跨度加货车，尽量用完整桁架跨过去。',
    budget: 190,
    spanWidth: 560,
    roadHeight: 0,
    anchorPoints: [{ x: -280, y: 0 }, { x: 280, y: 0 }],
    buildArea: { x: 0, y: -90, width: 680, height: 270 },
    vehicles: [{ type: 'truck', weight: 1.8, speed: 64, count: 1, spawnInterval: 1.3 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 190 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 140 } },
    unlockNextOnPass: true,
  },
  {
    level: 11,
    name: '高低岸桥',
    difficulty: 'normal',
    tips: '左岸更高，桥面可以带一点坡度，但要补足斜撑。',
    budget: 190,
    spanWidth: 520,
    roadHeight: 0,
    anchorPoints: [{ x: -260, y: 30 }, { x: 260, y: 0 }, { x: -260, y: -10 }, { x: 260, y: -40 }],
    buildArea: { x: 0, y: -72, width: 650, height: 260 },
    vehicles: [{ type: 'car', weight: 1.1, speed: 70, count: 1, spawnInterval: 1.2 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 190 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 142 } },
    unlockNextOnPass: true,
  },
  {
    level: 12,
    name: '限高桥',
    difficulty: 'normal',
    tips: '上方搭建空间变小，控制桁架高度。',
    budget: 180,
    spanWidth: 500,
    roadHeight: 0,
    anchorPoints: [{ x: -250, y: 0 }, { x: 250, y: 0 }, { x: -250, y: -40 }, { x: 250, y: -40 }],
    buildArea: { x: 0, y: -80, width: 620, height: 150 },
    vehicles: [{ type: 'car', weight: 1.1, speed: 74, count: 1, spawnInterval: 1.2 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 180 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 132 } },
    unlockNextOnPass: true,
  },
  {
    level: 13,
    name: '船道预留',
    difficulty: 'normal',
    tips: '下方要留出船道，支撑结构别压得太低。',
    budget: 190,
    spanWidth: 520,
    roadHeight: 0,
    anchorPoints: [{ x: -260, y: 0 }, { x: 260, y: 0 }, { x: -260, y: -40 }, { x: 260, y: -40 }],
    buildArea: { x: 0, y: -34, width: 640, height: 200 },
    vehicles: [{ type: 'car', weight: 1.1, speed: 74, count: 1, spawnInterval: 1.2 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 190 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 140 } },
    unlockNextOnPass: true,
  },
  {
    level: 14,
    name: '重货车',
    difficulty: 'normal',
    tips: '重货车压力很大，桥面和端点都要稳。',
    budget: 220,
    spanWidth: 520,
    roadHeight: 0,
    anchorPoints: [{ x: -260, y: 0 }, { x: 260, y: 0 }, { x: -260, y: -40 }, { x: 260, y: -40 }],
    buildArea: { x: 0, y: -90, width: 650, height: 270 },
    vehicles: [{ type: 'heavyTruck', weight: 2.6, speed: 56, count: 1, spawnInterval: 1.4 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 220 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 166 } },
    unlockNextOnPass: true,
  },
  {
    level: 15,
    name: '材料限制',
    difficulty: 'normal',
    tips: '货车不轻，预算偏紧，用更少杆件形成关键三角。',
    budget: 170,
    spanWidth: 520,
    roadHeight: 0,
    anchorPoints: [{ x: -260, y: 0 }, { x: 260, y: 0 }, { x: -260, y: -40 }, { x: 260, y: -40 }],
    buildArea: { x: 0, y: -86, width: 640, height: 250 },
    vehicles: [{ type: 'truck', weight: 1.8, speed: 64, count: 1, spawnInterval: 1.3 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 170 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 126 } },
    unlockNextOnPass: true,
  },
  {
    level: 16,
    name: '不对称支点',
    difficulty: 'hard',
    tips: '右岸更高，搭桥区域也偏移，先找稳固主桥面。',
    budget: 210,
    spanWidth: 560,
    roadHeight: 0,
    anchorPoints: [{ x: -280, y: 0 }, { x: 280, y: 40 }, { x: -280, y: -40 }, { x: 280, y: 0 }],
    buildArea: { x: 24, y: -68, width: 680, height: 270 },
    vehicles: [{ type: 'truck', weight: 1.9, speed: 62, count: 1, spawnInterval: 1.3 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 210 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 158 } },
    unlockNextOnPass: true,
  },
  {
    level: 17,
    name: '禁止区域预留',
    difficulty: 'hard',
    tips: '可搭建区域变窄，结构要更精简。',
    budget: 190,
    spanWidth: 560,
    roadHeight: 0,
    anchorPoints: [{ x: -280, y: 0 }, { x: 280, y: 0 }, { x: -280, y: -40 }, { x: 280, y: -40 }],
    buildArea: { x: 0, y: -78, width: 520, height: 240 },
    vehicles: [{ type: 'truck', weight: 1.9, speed: 64, count: 1, spawnInterval: 1.3 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 190 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 142 } },
    unlockNextOnPass: true,
  },
  {
    level: 18,
    name: '巴士通行',
    difficulty: 'hard',
    tips: '巴士更长更重，低速通过时桥梁要持续承重。',
    budget: 230,
    spanWidth: 560,
    roadHeight: 0,
    anchorPoints: [{ x: -280, y: 0 }, { x: 280, y: 0 }, { x: -280, y: -40 }, { x: 280, y: -40 }],
    buildArea: { x: 0, y: -88, width: 690, height: 270 },
    vehicles: [{ type: 'bus', weight: 2.4, speed: 54, count: 1, spawnInterval: 1.5 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 230 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 174 } },
    unlockNextOnPass: true,
  },
  {
    level: 19,
    name: '连续三车',
    difficulty: 'hard',
    tips: '三辆车连续通过，桥梁不能只扛住一瞬间。',
    budget: 240,
    spanWidth: 580,
    roadHeight: 0,
    anchorPoints: [{ x: -290, y: 0 }, { x: 290, y: 0 }, { x: -290, y: -40 }, { x: 290, y: -40 }],
    buildArea: { x: 0, y: -90, width: 710, height: 280 },
    vehicles: [{ type: 'car', weight: 1.1, speed: 74, count: 3, spawnInterval: 1.05 }],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 240 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 182 } },
    unlockNextOnPass: true,
  },
  {
    level: 20,
    name: '综合挑战',
    difficulty: 'challenge',
    tips: '长跨度、预算紧、车辆重，用清晰三角桁架完成最终关。',
    budget: 240,
    spanWidth: 620,
    roadHeight: 0,
    anchorPoints: [{ x: -310, y: 0 }, { x: 310, y: 0 }, { x: -310, y: -40 }, { x: 310, y: -40 }],
    buildArea: { x: 0, y: -90, width: 740, height: 280 },
    vehicles: [
      { type: 'truck', weight: 1.9, speed: 62, count: 1, spawnInterval: 1.2 },
      { type: 'bus', weight: 2.4, speed: 54, count: 1, spawnInterval: 1.5 },
    ],
    successCondition: { allVehiclesPass: true, maxBreakCount: 0, maxCost: 240 },
    starCondition: { oneStar: { allVehiclesPass: true }, twoStar: { maxBreakCount: 0 }, threeStar: { maxCost: 188 } },
    unlockNextOnPass: true,
  },
];

interface LevelSaveFields {
  currentLevel: number;
  unlockedLevel: number;
  levelStars: Record<string, number>;
}

@ccclass('LevelManager')
export class LevelManager extends Component {
  private levels: LevelConfig[] = DEFAULT_LEVEL_CONFIGS;
  private currentLevel = 1;
  private unlockedLevel = 1;
  private levelStars: Record<string, number> = {};

  public async loadLevels(): Promise<void> {
    this.loadSaveFields();
    try {
      const asset = await this.loadJsonAsset('configs/levelConfig');
      const parsed = Array.isArray(asset.json) ? asset.json : [];
      const normalized = this.normalizeLevels(parsed);
      this.levels = normalized.length >= 20 ? normalized : DEFAULT_LEVEL_CONFIGS;
    } catch (error) {
      console.warn('[LevelManager] 关卡配置加载失败，使用内置默认配置', error);
      this.levels = DEFAULT_LEVEL_CONFIGS;
    }
    this.currentLevel = Math.min(Math.max(1, this.currentLevel), this.getMaxLevel());
    this.unlockedLevel = Math.min(Math.max(1, this.unlockedLevel), this.getMaxLevel());
    if (this.currentLevel > this.unlockedLevel) {
      this.currentLevel = this.unlockedLevel;
    }
    this.saveFields();
  }

  public getCurrentLevel(): LevelConfig {
    return this.getLevel(this.currentLevel);
  }

  public getLevel(level: number): LevelConfig {
    return this.levels.find((item: LevelConfig) => item.level === level) ?? this.levels[0] ?? DEFAULT_LEVEL_CONFIGS[0];
  }

  public getCurrentLevelIndex(): number {
    return this.currentLevel;
  }

  public setCurrentLevel(level: number): void {
    this.currentLevel = Math.min(Math.max(1, Math.floor(level)), Math.min(this.unlockedLevel, this.getMaxLevel()));
    this.saveFields();
  }

  public goNextLevel(): boolean {
    if (this.currentLevel >= this.getMaxLevel()) {
      return false;
    }
    if (this.currentLevel + 1 > this.unlockedLevel) {
      return false;
    }
    this.currentLevel += 1;
    this.saveFields();
    return true;
  }

  public restartCurrentLevel(): void {
    this.saveFields();
  }

  public getMaxLevel(): number {
    return this.levels.reduce((max: number, level: LevelConfig) => Math.max(max, level.level), 1);
  }

  public calculateStars(result: LevelResult): number {
    const level = this.getCurrentLevel();
    if (!result.allVehiclesPass) {
      return 0;
    }
    if (result.breakCount > level.successCondition.maxBreakCount) {
      return 1;
    }
    if (result.usedCost <= level.starCondition.threeStar.maxCost) {
      return 3;
    }
    return 2;
  }

  public completeCurrentLevel(result: LevelResult): number {
    const stars = this.calculateStars(result);
    if (stars <= 0) {
      return 0;
    }
    const level = this.getCurrentLevel();
    if (level.unlockNextOnPass) {
      this.unlockedLevel = Math.min(this.getMaxLevel(), Math.max(this.unlockedLevel, level.level + 1));
    }
    const key = String(level.level);
    this.levelStars[key] = Math.max(this.levelStars[key] ?? 0, stars);
    this.saveFields();
    return stars;
  }

  public getUnlockedLevel(): number {
    return this.unlockedLevel;
  }

  public getLevelStars(level: number): number {
    return this.levelStars[String(level)] ?? 0;
  }

  private loadJsonAsset(path: string): Promise<JsonAsset> {
    return new Promise((resolve, reject) => {
      resources.load(path, JsonAsset, (error: Error | null, asset: JsonAsset) => {
        if (error || !asset) {
          reject(error ?? new Error(`Missing JsonAsset: ${path}`));
          return;
        }
        resolve(asset);
      });
    });
  }

  private normalizeLevels(value: unknown[]): LevelConfig[] {
    return value
      .map((item: unknown) => this.normalizeLevel(item))
      .filter((item: LevelConfig | null): item is LevelConfig => item !== null)
      .sort((a: LevelConfig, b: LevelConfig) => a.level - b.level);
  }

  private normalizeLevel(value: unknown): LevelConfig | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return null;
    }
    const record = value as Partial<LevelConfig>;
    if (typeof record.level !== 'number' || typeof record.name !== 'string') {
      return null;
    }
    const fallback = DEFAULT_LEVEL_CONFIGS[Math.max(0, Math.min(DEFAULT_LEVEL_CONFIGS.length - 1, record.level - 1))];
    return {
      ...fallback,
      ...record,
      anchorPoints: Array.isArray(record.anchorPoints) && record.anchorPoints.length >= 2 ? record.anchorPoints : fallback.anchorPoints,
      buildArea: record.buildArea ?? fallback.buildArea,
      vehicles: Array.isArray(record.vehicles) && record.vehicles.length > 0 ? record.vehicles : fallback.vehicles,
      successCondition: record.successCondition ?? fallback.successCondition,
      starCondition: record.starCondition ?? fallback.starCondition,
      unlockNextOnPass: typeof record.unlockNextOnPass === 'boolean' ? record.unlockNextOnPass : fallback.unlockNextOnPass,
    } as LevelConfig;
  }

  private loadSaveFields(): void {
    const fields = this.readSaveFields();
    this.currentLevel = fields.currentLevel;
    this.unlockedLevel = fields.unlockedLevel;
    this.levelStars = fields.levelStars;
  }

  private readSaveFields(): LevelSaveFields {
    try {
      const raw = sys.localStorage.getItem(SAVE_KEY);
      const parsed = raw ? JSON.parse(raw) as Record<string, unknown> : {};
      const currentLevel = this.safePositiveInt(parsed.currentLevel, 1);
      const unlockedLevel = this.safePositiveInt(parsed.unlockedLevel, 1);
      const levelStars = typeof parsed.levelStars === 'object' && parsed.levelStars !== null && !Array.isArray(parsed.levelStars)
        ? parsed.levelStars as Record<string, number>
        : {};
      return {
        currentLevel,
        unlockedLevel: Math.max(unlockedLevel, currentLevel),
        levelStars,
      };
    } catch {
      return { currentLevel: 1, unlockedLevel: 1, levelStars: {} };
    }
  }

  private saveFields(): void {
    try {
      const raw = sys.localStorage.getItem(SAVE_KEY);
      const parsed = raw ? JSON.parse(raw) as Record<string, unknown> : {};
      parsed.currentLevel = this.currentLevel;
      parsed.unlockedLevel = this.unlockedLevel;
      parsed.levelStars = this.levelStars;
      sys.localStorage.setItem(SAVE_KEY, JSON.stringify(parsed));
    } catch (error) {
      console.warn('[LevelManager] 保存关卡进度失败', error);
    }
  }

  private safePositiveInt(value: unknown, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return fallback;
    }
    return Math.max(1, Math.floor(value));
  }
}
