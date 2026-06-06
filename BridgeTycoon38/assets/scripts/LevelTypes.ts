export interface Vec2Config {
  x: number;
  y: number;
}

export interface BuildAreaConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LevelVehicleConfig {
  type: 'car' | 'truck' | 'bus' | 'heavyTruck';
  weight: number;
  speed: number;
  count: number;
  spawnInterval: number;
}

export interface LevelSuccessCondition {
  allVehiclesPass: boolean;
  maxBreakCount: number;
  maxCost?: number;
}

export interface StarCondition {
  oneStar: {
    allVehiclesPass: boolean;
  };
  twoStar: {
    maxBreakCount: number;
  };
  threeStar: {
    maxCost: number;
  };
}

export interface LevelConfig {
  level: number;
  name: string;
  difficulty: 'tutorial' | 'easy' | 'normal' | 'hard' | 'challenge';
  tips: string;
  objective?: string;
  difficultyPoint?: string;
  vehicleSummary?: string;
  budget: number;
  spanWidth: number;
  roadHeight: number;
  anchorPoints: Vec2Config[];
  buildArea: BuildAreaConfig;
  vehicles: LevelVehicleConfig[];
  successCondition: LevelSuccessCondition;
  starCondition: StarCondition;
  unlockNextOnPass: boolean;
}

export interface LevelResult {
  allVehiclesPass: boolean;
  breakCount: number;
  usedCost: number;
}
