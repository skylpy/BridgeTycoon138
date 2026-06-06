# Codex 执行任务：为《桥梁大亨》增加第一版关卡难度递进系统

你现在正在一个已有的 Cocos Creator 3.8.x《桥梁大亨》项目中工作。

当前游戏已经有基础搭桥、测试车辆、预算、材料、撤销、清空、重试、下一关等功能。

现在需要新增第一版“关卡难度递进系统”，让每一关不再一样，而是从简单到困难逐步变化。

---

## 一、核心目标

请为游戏增加 20 个关卡配置，并让游戏根据当前关卡配置动态调整：

1. 关卡名称
2. 关卡提示文案
3. 预算
4. 跨度
5. 左右支点位置
6. 可搭建区域
7. 车辆类型
8. 车辆数量
9. 车辆重量
10. 成功条件
11. 下一关切换逻辑
12. 失败后重试当前关

第一版不要做太复杂，重点是让玩家感受到：

```txt
第1~5关：教学
第6~10关：基础挑战
第11~15关：地形限制
第16~20关：综合挑战
```

---

## 二、重要限制

请严格遵守：

1. 不要重建项目。
2. 不要生成 `.scene` 文件。
3. 不要生成 `.prefab` 文件。
4. 不要删除现有搭桥逻辑。
5. 不要破坏当前拖拽搭桥、撤销、清空、重试、测试车辆逻辑。
6. 不要引入第三方库。
7. 所有代码兼容 Cocos Creator 3.8.x。
8. 只允许在现有项目基础上新增或修改：
   - `assets/scripts/`
   - `assets/resources/configs/`
   - `README.md`
9. 如果已有 LevelManager / GameManager / ConfigManager，请优先基于现有代码改造。
10. 如果没有关卡系统，请新增。

---

## 三、难度递进原则

本次关卡设计必须遵守：

### 1. 每关只增加一个主要难点

不要突然同时增加很多难度。

错误示例：

```txt
第6关同时增加跨度、减少预算、加重车辆、减少支点
```

正确示例：

```txt
第6关：只加入轻货车
第7关：只加入双车连续通行
第8关：只减少预算
第9关：只增加跨度
```

---

### 2. 难度由 5 个核心参数组成

第一版只使用这 5 类难度变量：

```txt
1. spanWidth 跨度
2. budget 预算
3. vehicles 车辆配置
4. anchorPoints 支点位置
5. buildArea 可搭建区域
```

不要第一版就加入液压桥、风力、材料类型、排行榜、复杂评分系统。

---

### 3. 前 20 关难度结构

请按照下面节奏设计：

```txt
1~5关：教学关，让玩家学会搭桥
6~10关：基础挑战，开始控制预算和承重
11~15关：加入地形和区域限制
16~20关：综合挑战
```

---

## 四、需要新增的文件

请新增或补全以下文件：

```txt
assets/scripts/LevelTypes.ts
assets/scripts/LevelManager.ts
assets/resources/configs/levelConfig.json
```

如果项目已有类似文件，请合并，不要重复冲突。

---

## 五、LevelTypes.ts 要求

请创建：

```txt
assets/scripts/LevelTypes.ts
```

定义关卡相关类型：

```ts
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
```

可根据项目需要扩展字段，但不要删除以上字段。

---

## 六、levelConfig.json 要求

请创建：

```txt
assets/resources/configs/levelConfig.json
```

里面必须包含 20 关。

每关结构示例：

```json
{
  "level": 1,
  "name": "基础连桥",
  "difficulty": "tutorial",
  "tips": "先用桥面横向连通左右道路，让小车可以通过。",
  "budget": 100,
  "spanWidth": 320,
  "roadHeight": 0,
  "anchorPoints": [
    { "x": -160, "y": 0 },
    { "x": 160, "y": 0 }
  ],
  "buildArea": {
    "x": 0,
    "y": -80,
    "width": 420,
    "height": 220
  },
  "vehicles": [
    {
      "type": "car",
      "weight": 1,
      "speed": 80,
      "count": 1,
      "spawnInterval": 1.2
    }
  ],
  "successCondition": {
    "allVehiclesPass": true,
    "maxBreakCount": 0,
    "maxCost": 100
  },
  "starCondition": {
    "oneStar": {
      "allVehiclesPass": true
    },
    "twoStar": {
      "maxBreakCount": 0
    },
    "threeStar": {
      "maxCost": 70
    }
  },
  "unlockNextOnPass": true
}
```

---

## 七、20 关设计要求

请按下面关卡主题生成 20 关配置。

### 第 1 阶段：教学关，1~5 关

#### 第1关：基础连桥

目的：教玩家横向连通桥面。

规则：

```txt
跨度短
预算充足
1辆小车
只有左右两个支点
可搭建区域大
```

建议参数：

```txt
budget: 100
spanWidth: 320
vehicles: car x1
```

---

#### 第2关：三角支撑

目的：教玩家使用三角结构。

规则：

```txt
跨度略增加
预算仍充足
1辆小车
提示使用双三角支撑
```

建议参数：

```txt
budget: 120
spanWidth: 380
vehicles: car x1
```

---

#### 第3关：桥面加固

目的：让玩家知道单纯平桥容易下沉。

规则：

```txt
车辆稍重
仍然是小车
桥跨度不大
```

建议参数：

```txt
budget: 130
spanWidth: 400
vehicles: car x1
weight: 1.2
```

---

#### 第4关：节省材料

目的：引入预算意识。

规则：

```txt
预算减少
跨度和车辆不大变
要求别乱搭
```

建议参数：

```txt
budget: 105
spanWidth: 400
vehicles: car x1
```

---

#### 第5关：小河跨越

目的：引入更长跨度。

规则：

```txt
跨度增加
预算适中
1辆小车
```

建议参数：

```txt
budget: 140
spanWidth: 460
vehicles: car x1
```

---

### 第 2 阶段：基础挑战，6~10 关

#### 第6关：轻货车

目的：引入更重车辆。

规则：

```txt
1辆轻货车
跨度中等
预算适中
```

建议参数：

```txt
budget: 160
spanWidth: 460
vehicles: truck x1
weight: 1.8
```

---

#### 第7关：双车通行

目的：引入连续车辆。

规则：

```txt
2辆小车连续通过
桥梁需要稳定
```

建议参数：

```txt
budget: 160
spanWidth: 470
vehicles: car x2
```

---

#### 第8关：低预算挑战

目的：控制预算。

规则：

```txt
预算明显减少
跨度不继续增加
车辆保持小车
```

建议参数：

```txt
budget: 130
spanWidth: 470
vehicles: car x1
```

---

#### 第9关：长跨度

目的：增加跨度挑战。

规则：

```txt
跨度增加
预算略增加
车辆还是小车
```

建议参数：

```txt
budget: 180
spanWidth: 540
vehicles: car x1
```

---

#### 第10关：无中间支撑

目的：要求玩家使用更合理桁架。

规则：

```txt
跨度较长
没有中间支点
1辆货车
```

建议参数：

```txt
budget: 190
spanWidth: 560
vehicles: truck x1
```

---

### 第 3 阶段：地形限制，11~15 关

#### 第11关：高低岸桥

目的：左右道路高度不同。

规则：

```txt
左支点比右支点高
车辆从左到右
需要斜桥面或加固结构
```

建议参数：

```txt
budget: 190
spanWidth: 520
anchorPoints: left y 30, right y 0
vehicles: car x1
```

---

#### 第12关：限高桥

目的：限制上方搭建空间。

规则：

```txt
可搭建区域高度变小
不能搭太高
```

建议参数：

```txt
budget: 180
spanWidth: 500
buildArea height: 150
vehicles: car x1
```

---

#### 第13关：船道预留

目的：限制桥下空间。

规则：

```txt
可搭建区域下边界提高
不能搭太低
需要下方留空间
```

建议参数：

```txt
budget: 190
spanWidth: 520
buildArea y 更高
vehicles: car x1
```

---

#### 第14关：重货车

目的：承重要求提升。

规则：

```txt
1辆重货车
跨度中等
预算较充足
```

建议参数：

```txt
budget: 220
spanWidth: 520
vehicles: heavyTruck x1
weight: 2.6
```

---

#### 第15关：材料限制

目的：限制材料数量 / 预算压力。

规则：

```txt
预算较紧
跨度中等
1辆货车
```

建议参数：

```txt
budget: 170
spanWidth: 520
vehicles: truck x1
```

---

### 第 4 阶段：综合挑战，16~20 关

#### 第16关：不对称支点

目的：支点位置更别扭。

规则：

```txt
左右锚点高度不同
可搭建区域偏移
```

建议参数：

```txt
budget: 210
spanWidth: 560
anchorPoints: left y 0, right y 40
vehicles: truck x1
```

---

#### 第17关：禁止区域预留

目的：模拟中间不能搭太多。

第一版如果没有禁止区域系统，可以先通过 buildArea 缩小来模拟。

规则：

```txt
可搭建区域变窄
需要更精简结构
```

建议参数：

```txt
budget: 190
spanWidth: 560
buildArea width: 520
vehicles: truck x1
```

---

#### 第18关：巴士通行

目的：更长更重车辆。

规则：

```txt
1辆巴士
速度较慢
重量较高
```

建议参数：

```txt
budget: 230
spanWidth: 560
vehicles: bus x1
weight: 2.4
```

---

#### 第19关：连续三车

目的：测试稳定性。

规则：

```txt
3辆车连续通过
桥梁不能只扛一瞬间
```

建议参数：

```txt
budget: 240
spanWidth: 580
vehicles: car x3
```

---

#### 第20关：综合挑战

目的：第一章最终关。

规则：

```txt
跨度长
预算紧
车辆重
需要合理三角结构
```

建议参数：

```txt
budget: 240
spanWidth: 620
vehicles: truck x1 + bus x1
```

---

## 八、LevelManager.ts 要求

请创建或补全：

```txt
assets/scripts/LevelManager.ts
```

作为 Cocos Component：

```ts
@ccclass('LevelManager')
export class LevelManager extends Component
```

必须提供：

```ts
loadLevels(): Promise<void>;
getCurrentLevel(): LevelConfig;
getLevel(level: number): LevelConfig;
getCurrentLevelIndex(): number;
setCurrentLevel(level: number): void;
goNextLevel(): boolean;
restartCurrentLevel(): void;
getMaxLevel(): number;
calculateStars(result: LevelResult): number;
```

要求：

1. 从 `resources/configs/levelConfig.json` 加载关卡。
2. 加载失败时使用内置默认 20 关配置。
3. 当前关卡存到本地存档。
4. 通关后才能解锁下一关。
5. 点击下一关时，如果已经是最后一关，显示提示：已经是最后一关。
6. 重试当前关时，清空当前桥梁结构，但不切换关卡。
7. 切换关卡时刷新：
   - 预算
   - 已用材料
   - 关卡标题
   - 提示文案
   - 可搭建区域
   - 支点位置
   - 车辆配置
   - 桥面跨度

---

## 九、存档扩展要求

如果当前 SaveManager 已有存档，请扩展字段：

```ts
currentLevel: number;
unlockedLevel: number;
levelStars: Record<string, number>;
```

默认：

```ts
currentLevel: 1,
unlockedLevel: 1,
levelStars: {}
```

要求：

1. 兼容旧存档。
2. 老玩家没有这些字段时自动补默认值。
3. 通关后更新 unlockedLevel。
4. 如果当前关获得更高星级，更新 levelStars。

---

## 十、GameManager 对接要求

请把 LevelManager 接入 GameManager。

GameManager 启动流程需要变成：

```txt
加载存档
加载关卡配置
读取 currentLevel
应用当前关卡
初始化预算、桥面、支点、车辆、可搭建区域
刷新 UI
```

需要增加或适配：

```ts
@property(LevelManager)
levelManager: LevelManager | null = null;
```

如果没有手动绑定，尝试自动查找。

---

## 十一、UI 对接要求

请让 UI 显示当前关卡信息。

顶部栏需要显示：

```txt
关卡：第 X 关
预算剩余：xx
已用材料：xx
```

提示条显示：

```txt
当前关卡 tips
```

如果项目里已有 UIManager / HUDView，请新增方法或适配：

```ts
refreshLevelInfo(levelConfig: LevelConfig): void;
refreshBudget(remainingBudget: number, usedMaterial: number): void;
refreshLevelTips(tips: string): void;
showLevelResult(stars: number): void;
```

---

## 十二、预算和材料要求

每关都有独立预算。

要求：

1. 玩家放置杆件时消耗预算。
2. 已用材料根据杆件长度或数量计算。
3. 预算剩余不能小于 0。
4. 预算不足时，不允许继续建造。
5. 清空 / 重试当前关时，预算恢复。
6. 切换下一关时，预算使用新关卡配置。

如果当前项目已经有材料计算逻辑，请不要重写，只改成读取当前关卡 budget。

---

## 十三、跨度和支点要求

每关根据配置动态生成：

```txt
anchorPoints
spanWidth
roadHeight
```

要求：

1. 左右道路端点根据 `anchorPoints` 对齐。
2. 桥面目标连接点根据关卡配置改变。
3. 可搭建区域根据 `buildArea` 改变。
4. 支点视觉位置跟随配置变化。
5. 车辆起点和终点跟随跨度变化。

如果当前项目的道路和桥面位置是写死的，请抽成读取 LevelConfig。

---

## 十四、车辆要求

每关车辆来自配置：

```json
"vehicles": [
  {
    "type": "car",
    "weight": 1,
    "speed": 80,
    "count": 1,
    "spawnInterval": 1.2
  }
]
```

要求：

1. 测试时按 vehicles 配置生成车辆。
2. count > 1 时连续生成多辆。
3. 不同 type 影响车辆尺寸和颜色。
4. weight 影响桥梁受力。
5. speed 影响车辆移动速度。
6. 当前物理系统如果还没有真实重量，可先映射到现有承重/压力计算参数。

---

## 十五、成功条件

成功条件第一版使用：

```txt
所有车辆通过
断裂数量 <= maxBreakCount
```

如果已有成功/失败逻辑，请对接：

```ts
successCondition.allVehiclesPass
successCondition.maxBreakCount
```

通关后：

1. 计算星级。
2. 解锁下一关。
3. 显示通关结果。
4. 允许点击下一关。

失败后：

1. 显示失败提示。
2. 保持当前关。
3. 允许点击重试。

---

## 十六、星级规则

第一版星级：

```txt
1星：所有车辆通过
2星：所有车辆通过 + 断裂数量 <= 配置
3星：所有车辆通过 + 断裂数量 <= 配置 + 使用材料 <= threeStar.maxCost
```

要求：

1. 星级结果保存到存档。
2. 如果重复挑战获得更高星级，则覆盖旧星级。
3. UI 可以先简单显示：
   - 通关：★★★
   - 或 Toast：获得 3 星
4. 不要求第一版做复杂关卡选择页面。

---

## 十七、下一关逻辑

点击“下一关”：

1. 如果当前关已通关，则进入下一关。
2. 如果当前关未通关，提示：请先通过当前关。
3. 如果已经是第 20 关，提示：已经是最后一关。
4. 切换关卡后：
   - 清空当前桥梁
   - 重置车辆
   - 重置预算
   - 应用新支点
   - 应用新可搭建区域
   - 更新 UI

---

## 十八、重试逻辑

点击“重试”：

1. 当前关不变。
2. 清空车辆。
3. 清空当前测试状态。
4. 清空或恢复桥梁到测试前状态，按当前项目已有逻辑处理。
5. 预算恢复到当前关卡初始状态，或者保留玩家当前编辑状态，按项目现有设计处理。
6. UI 刷新。

推荐第一版：

```txt
重试 = 车辆回到起点 + 桥梁恢复编辑状态 + 当前关卡不变
清空 = 删除所有玩家搭建结构 + 预算恢复
```

---

## 十九、README 更新要求

请更新 README.md，增加以下内容：

```txt
## 关卡难度系统
## levelConfig.json 字段说明
## 20关难度设计说明
## 如何修改每关预算
## 如何修改车辆重量
## 如何修改跨度
## 如何修改可搭建区域
## 如何测试下一关
## 如何重置关卡存档
```

---

## 二十、验收标准

完成后必须尽量达到：

1. 游戏有 20 个不同关卡。
2. 每关预算不同。
3. 每关跨度可以不同。
4. 每关提示文案不同。
5. 每关车辆配置不同。
6. 关卡难度从第1关到第20关逐渐增加。
7. 点击下一关会进入下一关。
8. 点击重试不会跳关。
9. 通关后解锁下一关。
10. 未通关不能跳下一关。
11. 星级结果可以保存。
12. 旧存档不会崩溃。
13. README 说明清楚如何改关卡。

---

## 二十一、输出要求

完成后请输出：

1. 新增了哪些文件。
2. 修改了哪些文件。
3. 20关难度是如何递进的。
4. 如何修改关卡配置。
5. 当前下一关逻辑怎么判断。
6. 当前重试逻辑怎么处理。
7. 如果我要继续做 V2 难度，可以加哪些机制。

请直接修改代码，不要只给建议。
不要写伪代码。
不要生成 scene。
不要生成 prefab。
