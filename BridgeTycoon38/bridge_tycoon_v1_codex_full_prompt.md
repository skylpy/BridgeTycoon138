# Codex 执行提示词：一键补全《桥梁大亨 V1.0》Cocos Creator 3.8.x 可运行微信小游戏原型

> 使用方式：把本 Markdown 文件的全部内容复制给 Codex CLI 执行。  
> 执行位置：必须在已经创建好的 Cocos Creator 3.8.x 项目根目录中执行。  
> 目标：不重新建项目、不生成 scene/prefab，仅补齐代码、配置和 README，让项目可以在 Cocos Creator 3.8.x 中手动搭建节点后直接预览运行。

---

## 0. 当前任务身份

你是一个资深 Cocos Creator 3.8.x 游戏工程师。

请在当前已有 Cocos Creator 3.8.x 项目中，补全一个名为《桥梁大亨 V1.0》的搭桥升级类微信小游戏原型。

这是一个可以直接运行的 MVP 版本，重点不是美术，而是完整游戏闭环、代码结构清晰、配置可扩展、方便后续替换真实美术资源和接入微信小游戏能力。

---

## 1. 最高优先级限制

请严格遵守以下限制：

1. 不要重新创建 Cocos Creator 项目。
2. 不要修改项目根目录结构。
3. 不要生成 `.scene` 文件。
4. 不要生成 `.prefab` 文件。
5. 不要生成真实广告 SDK。
6. 不要使用第三方 npm 包。
7. 不要依赖远程资源。
8. 不要使用 JSB、原生插件、小游戏专属 API。
9. 只允许生成和修改以下位置：
   - `assets/scripts/`
   - `assets/resources/`
   - `README.md`
10. 使用 TypeScript。
11. 所有脚本必须兼容 Cocos Creator 3.8.x。
12. 所有资源使用 Cocos 节点、Label、Button、Sprite、颜色块、Graphics 占位。
13. 代码必须尽量做到 Cocos Creator 3.8.x 编译通过。
14. 不能因为某个节点未绑定就崩溃，必须使用 `console.warn` 提示。
15. README 必须详细说明如何手动创建节点、挂载脚本、拖拽绑定属性、运行预览。

---

## 2. 目标游戏说明

游戏名称：桥梁大亨 V1.0

游戏类型：搭桥升级类 / 放置经营类 / 点击收益类小游戏。

核心玩法：

```txt
玩家点击施工按钮
→ 获得金币
→ 金币足够后升级桥梁
→ 桥梁等级提升
→ 点击收益提升
→ 车辆经过收益提升
→ 自动收益提升
→ 离线回来获得收益
→ 继续升级更高级桥梁
```

首版不追求复杂关卡，只要求形成完整可玩循环。

---

## 3. 必须生成的文件结构

请创建或补全以下目录和文件：

```txt
assets/
  scripts/
    Types.ts
    Utils.ts
    EventBus.ts
    GameConfig.ts
    SaveManager.ts
    IncomeController.ts
    BridgeController.ts
    VehicleController.ts
    VehicleSpawner.ts
    UIManager.ts
    AudioManager.ts
    AdManager.ts
    GameManager.ts

  resources/
    configs/
      bridgeConfig.json
      vehicleConfig.json
      incomeConfig.json

README.md
```

如果目录不存在，请自动创建。

---

## 4. 代码总体设计要求

### 4.1 架构要求

1. `GameManager.ts` 是游戏总入口。
2. `GameConfig.ts` 负责配置加载和默认配置兜底。
3. `SaveManager.ts` 负责本地存档。
4. `IncomeController.ts` 负责金币、点击收益、车辆收益、自动收益。
5. `BridgeController.ts` 负责桥梁等级和桥梁展示。
6. `VehicleSpawner.ts` 负责车辆生成。
7. `VehicleController.ts` 负责单辆车移动和经过收益。
8. `UIManager.ts` 负责 UI 展示和提示，不直接写核心游戏逻辑。
9. `AdManager.ts` 负责激励广告 mock。
10. `AudioManager.ts` 负责音效开关和 mock 播放接口。
11. `EventBus.ts` 负责简单事件派发，降低模块耦合。
12. `Types.ts` 负责所有公共类型。
13. `Utils.ts` 负责格式化、数值安全处理、时间格式化。

### 4.2 TypeScript 要求

1. 尽量不使用 `any`。
2. 所有 public 方法入参和返回值要写类型。
3. 对 Cocos 组件引用要使用明确类型，例如：
   - `Label`
   - `Button`
   - `Node`
   - `Sprite`
   - `UITransform`
   - `Color`
   - `Vec3`
4. 对可能为空的节点做 null 判断。
5. 所有脚本顶部写简短注释说明用途。
6. 关键方法写注释。

---

## 5. 详细功能要求

---

# 5.1 Types.ts

请生成 `assets/scripts/Types.ts`。

必须包含以下类型：

```ts
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
```

也可以根据需要补充类型，但不要删除以上类型。

---

# 5.2 Utils.ts

请生成 `assets/scripts/Utils.ts`。

必须实现以下工具函数：

```ts
export function formatCoins(value: number): string
export function formatTime(seconds: number): string
export function safeNumber(value: unknown, defaultValue: number): number
export function clamp(value: number, min: number, max: number): number
export function parseColorHex(hex: string): Color
```

要求：

### formatCoins

显示规则：

```txt
0 - 999：正常显示，例如 999
1,000 - 999,999：显示 x.xxK，例如 1.25K
1,000,000 - 999,999,999：显示 x.xxM，例如 2.35M
1,000,000,000 以上：显示 x.xxB，例如 1.20B
```

### formatTime

显示规则：

```txt
小于 60 秒：xx秒
小于 3600 秒：xx分xx秒
大于等于 3600 秒：xx小时xx分
```

### safeNumber

要求：

1. 如果是合法数字，返回数字。
2. 如果是字符串数字，转换为数字。
3. 如果是 NaN / Infinity / null / undefined，返回 defaultValue。

### parseColorHex

要求：

1. 支持 `#RRGGBB`。
2. 支持不带 `#` 的 `RRGGBB`。
3. 解析失败返回白色。

---

# 5.3 EventBus.ts

请生成 `assets/scripts/EventBus.ts`。

实现一个轻量事件总线。

必须提供：

```ts
type EventCallback<T = unknown> = (payload?: T) => void;

export class EventBus {
  static on<T = unknown>(eventName: string, callback: EventCallback<T>): void
  static off<T = unknown>(eventName: string, callback: EventCallback<T>): void
  static emit<T = unknown>(eventName: string, payload?: T): void
  static clear(): void
}
```

要求：

1. 使用 `Map<string, Set<EventCallback>>` 实现。
2. 不依赖 Cocos EventTarget，避免生命周期复杂。
3. emit 出错时捕获异常，不能影响游戏运行。

---

# 5.4 GameConfig.ts

请生成 `assets/scripts/GameConfig.ts`。

功能：加载配置文件，并提供默认配置兜底。

必须支持从以下资源加载 JSON：

```txt
resources/configs/bridgeConfig.json
resources/configs/vehicleConfig.json
resources/configs/incomeConfig.json
```

Cocos 3.8.x 中使用：

```ts
resources.load('configs/bridgeConfig', JsonAsset, callback)
```

必须提供：

```ts
export class GameConfig {
  static loadAllConfigs(): Promise<void>;
  static getBridgeConfig(level: number): BridgeLevelConfig;
  static getAllBridgeConfigs(): BridgeLevelConfig[];
  static getVehicleConfigs(): VehicleConfig[];
  static getIncomeConfig(): IncomeConfig;
  static getMaxBridgeLevel(): number;
}
```

要求：

1. 配置加载失败时，使用内置默认配置。
2. 配置字段异常时，使用默认配置兜底。
3. `getBridgeConfig(level)` 如果 level 超出范围，返回最近合法等级。
4. `getMaxBridgeLevel()` 返回最大桥梁等级。
5. 所有默认配置必须完整写在代码中，避免 JSON 加载失败导致游戏不能运行。

---

# 5.5 SaveManager.ts

请生成 `assets/scripts/SaveManager.ts`。

作为 Cocos Component：

```ts
@ccclass('SaveManager')
export class SaveManager extends Component
```

功能要求：

1. 使用 `sys.localStorage`。
2. 存储 key 使用：`bridge_tycoon_v1_save_data`。
3. 保存内容：
   - coins
   - bridgeLevel
   - lastExitTime
   - soundEnabled
   - guideViewed
4. 游戏启动时读取存档。
5. 游戏关键数据变化时保存。
6. 支持清空存档。
7. 支持获取默认存档。
8. 处理异常 JSON，避免崩溃。

必须提供：

```ts
loadSave(): GameSaveData;
saveData(data: GameSaveData): void;
clearSave(): void;
getDefaultSave(): GameSaveData;
markExitTime(data: GameSaveData): GameSaveData;
```

默认存档：

```ts
{
  coins: 0,
  bridgeLevel: 1,
  lastExitTime: Date.now(),
  soundEnabled: true,
  guideViewed: false
}
```

要求：

1. coins 小于 0 时修正为 0。
2. bridgeLevel 小于 1 时修正为 1。
3. lastExitTime 非法时修正为 Date.now()。
4. `console.log` 输出读取和保存结果。

---

# 5.6 IncomeController.ts

请生成 `assets/scripts/IncomeController.ts`。

作为 Cocos Component：

```ts
@ccclass('IncomeController')
export class IncomeController extends Component
```

功能：管理金币收入。

必须提供：

```ts
init(initialCoins: number): void;
getCoins(): number;
setCoins(value: number): void;
addCoins(value: number, reason?: string): void;
spendCoins(value: number): boolean;
hasEnoughCoins(value: number): boolean;
applyClickIncome(clickIncome: number): number;
applyVehicleIncome(baseIncome: number, multiplier: number): number;
applyIdleIncome(idleIncomePerSecond: number): number;
```

要求：

1. 金币不允许为负数。
2. 金币变化时通过 EventBus 发出 `COINS_CHANGED`。
3. 每次增加金币输出 log，包含 reason。
4. `spendCoins` 金币不足时返回 false。
5. 金币使用 number 即可，暂不考虑大数库。

---

# 5.7 BridgeController.ts

请生成 `assets/scripts/BridgeController.ts`。

作为 Cocos Component：

```ts
@ccclass('BridgeController')
export class BridgeController extends Component
```

功能：管理桥梁等级和桥梁展示。

需要暴露属性：

```ts
@property(Node)
bridgeVisual: Node | null = null;

@property(Label)
bridgeNameVisualLabel: Label | null = null;
```

必须提供：

```ts
init(level: number): void;
getCurrentLevel(): number;
getCurrentConfig(): BridgeLevelConfig;
canUpgrade(): boolean;
upgrade(): BridgeLevelConfig;
setLevel(level: number): void;
refreshBridgeVisual(): void;
```

要求：

1. 初始等级为 1。
2. 最高等级来自 GameConfig。
3. 升级后通过 EventBus 发出 `BRIDGE_LEVEL_CHANGED`。
4. `refreshBridgeVisual()` 根据等级改变桥梁节点表现：
   - 宽度逐级变大
   - 颜色逐级变化
   - 名称 Label 更新
5. 如果 `bridgeVisual` 没绑定，不报错，只 warn。
6. 如果 `bridgeNameVisualLabel` 没绑定，不报错。

建议实现：

1. 通过 `UITransform.setContentSize(width, height)` 改变桥梁宽度。
2. 通过 `Sprite.color = xxx` 改颜色。
3. 如果节点没有 Sprite，可以自动添加 Sprite 组件。

---

# 5.8 VehicleController.ts

请生成 `assets/scripts/VehicleController.ts`。

作为 Cocos Component：

```ts
@ccclass('VehicleController')
export class VehicleController extends Component
```

功能：控制单辆车从左往右移动，经过桥梁中线时发放收益。

必须提供：

```ts
init(config: VehicleConfig, startX: number, endX: number, bridgeCenterX: number, baseIncome: number, onReward: (amount: number) => void): void;
update(deltaTime: number): void;
```

要求：

1. 车辆从 startX 移动到 endX。
2. 移动速度来自 VehicleConfig.speed。
3. 当车辆第一次经过 bridgeCenterX 时发放收益。
4. 收益 = baseIncome * incomeMultiplier。
5. 发放收益后不能重复发放。
6. 到达 endX 后销毁节点。
7. 车辆显示使用 Sprite 色块 + Label。
8. 根据车辆类型设置不同大小：
   - car：60x30
   - truck：80x36
   - bus：90x40
9. 不允许未初始化就运行时报错。

实现方式：

1. 在 `init` 中记录参数。
2. 自动给车辆节点添加 UITransform 和 Sprite。
3. 自动创建一个子节点 Label 显示车辆名称。
4. `update` 中移动节点。
5. 使用 `this.node.destroy()` 清理。

---

# 5.9 VehicleSpawner.ts

请生成 `assets/scripts/VehicleSpawner.ts`。

作为 Cocos Component：

```ts
@ccclass('VehicleSpawner')
export class VehicleSpawner extends Component
```

需要暴露属性：

```ts
@property(Node)
vehicleLayer: Node | null = null;
```

必须提供：

```ts
init(getBaseVehicleIncome: () => number, onVehicleReward: (baseIncome: number, multiplier: number) => void): void;
startSpawn(): void;
stopSpawn(): void;
spawnVehicle(): void;
```

要求：

1. 根据 incomeConfig.vehicleSpawnInterval 定时生成车辆。
2. 每次随机选择一个 VehicleConfig。
3. 车辆从左到右移动。
4. startX 默认 -420。
5. endX 默认 420。
6. bridgeCenterX 默认 0。
7. 车辆父节点使用 vehicleLayer，如果未绑定则使用当前节点。
8. 车辆节点通过代码创建，不使用 prefab。
9. 车辆经过桥时调用回调，让 GameManager/IncomeController 增加金币。
10. 车辆生成失败不能导致游戏崩溃。

注意：

`VehicleController.init` 的 onReward 回调返回的是最终金额，但为了让 IncomeController 统一处理，也可以传 baseIncome + multiplier。两种方式任选一种，但要保证收益正确、代码清晰。

---

# 5.10 UIManager.ts

请生成 `assets/scripts/UIManager.ts`。

作为 Cocos Component：

```ts
@ccclass('UIManager')
export class UIManager extends Component
```

必须暴露以下属性，名字必须一致：

```ts
@property(Label)
coinLabel: Label | null = null;

@property(Label)
bridgeLevelLabel: Label | null = null;

@property(Label)
bridgeNameLabel: Label | null = null;

@property(Label)
upgradeCostLabel: Label | null = null;

@property(Label)
idleIncomeLabel: Label | null = null;

@property(Label)
clickIncomeLabel: Label | null = null;

@property(Button)
buildButton: Button | null = null;

@property(Button)
upgradeButton: Button | null = null;

@property(Button)
clearSaveButton: Button | null = null;

@property(Node)
offlinePopup: Node | null = null;

@property(Label)
offlineRewardLabel: Label | null = null;

@property(Button)
claimOfflineButton: Button | null = null;

@property(Button)
claimDoubleOfflineButton: Button | null = null;

@property(Label)
toastLabel: Label | null = null;

@property(Node)
guidePanel: Node | null = null;

@property(Label)
guideLabel: Label | null = null;
```

必须提供：

```ts
refreshAll(coins: number, bridgeConfig: BridgeLevelConfig, maxLevel: number): void;
refreshCoins(coins: number): void;
refreshBridgeInfo(config: BridgeLevelConfig, maxLevel: number): void;
showToast(message: string, duration?: number): void;
showOfflinePopup(offlineSeconds: number, rewardCoins: number): void;
hideOfflinePopup(): void;
showGuide(): void;
hideGuide(): void;
setUpgradeButtonInteractable(canUpgrade: boolean): void;
```

要求：

1. 使用 `formatCoins` 展示金币。
2. 最高级时，升级费用显示“已满级”。
3. 离线弹窗默认隐藏。
4. Toast 支持自动隐藏。
5. 如果 Label/Button/Node 未绑定，不报错，只 warn。
6. UIManager 不直接修改金币和桥梁等级。
7. UIManager 可以监听 EventBus 的 TOAST 事件。

---

# 5.11 AdManager.ts

请生成 `assets/scripts/AdManager.ts`。

作为 Cocos Component：

```ts
@ccclass('AdManager')
export class AdManager extends Component
```

必须提供：

```ts
showRewardAd(): Promise<boolean>;
```

mock 逻辑：

1. 延迟 1 秒。
2. 根据 incomeConfig.adMockSuccessRate 判断成功。
3. 默认成功率 0.9。
4. 成功输出 log。
5. 失败输出 warn。

用途：

1. 离线收益翻倍领取。
2. 金币不足时可扩展看广告补金币。

---

# 5.12 AudioManager.ts

请生成 `assets/scripts/AudioManager.ts`。

作为 Cocos Component：

```ts
@ccclass('AudioManager')
export class AudioManager extends Component
```

首版不需要真实音频资源，但要提供接口方便后续扩展。

必须提供：

```ts
init(soundEnabled: boolean): void;
setSoundEnabled(enabled: boolean): void;
isSoundEnabled(): boolean;
playClick(): void;
playUpgrade(): void;
playCoin(): void;
```

要求：

1. 如果 soundEnabled=false，不播放。
2. 当前没有音频资源时，只 `console.log`。
3. 不引入任何音频文件。

---

# 5.13 GameManager.ts

请生成 `assets/scripts/GameManager.ts`。

作为 Cocos Component：

```ts
@ccclass('GameManager')
export class GameManager extends Component
```

需要暴露属性：

```ts
@property(SaveManager)
saveManager: SaveManager | null = null;

@property(IncomeController)
incomeController: IncomeController | null = null;

@property(BridgeController)
bridgeController: BridgeController | null = null;

@property(VehicleSpawner)
vehicleSpawner: VehicleSpawner | null = null;

@property(UIManager)
uiManager: UIManager | null = null;

@property(AdManager)
adManager: AdManager | null = null;

@property(AudioManager)
audioManager: AudioManager | null = null;
```

必须提供以下按钮绑定方法，名字必须一致：

```ts
onClickBuild(): void;
onClickUpgradeBridge(): void;
onClickClearSave(): void;
onClaimOfflineReward(): void;
onClaimDoubleOfflineReward(): void;
onCloseGuide(): void;
```

启动流程：

```txt
onLoad
→ 检查组件引用
→ 如果属性未拖拽，尝试从当前节点和子节点自动查找组件

start
→ GameConfig.loadAllConfigs()
→ SaveManager.loadSave()
→ IncomeController.init(save.coins)
→ BridgeController.init(save.bridgeLevel)
→ AudioManager.init(save.soundEnabled)
→ 计算离线收益
→ UIManager.refreshAll()
→ 注册事件监听
→ 启动车辆生成
→ 开启自动收益定时器
→ 开启自动保存定时器
→ 如果 guideViewed=false，显示新手引导
```

必须实现：

### 点击施工

```txt
点击施工按钮
→ 获取当前桥梁 clickIncome
→ 增加金币
→ 播放点击音效 mock
→ 刷新 UI
→ 保存
```

### 升级桥梁

```txt
点击升级按钮
→ 判断是否满级
→ 判断金币是否足够
→ 金币足够：扣金币、桥梁升级、播放升级音效、刷新 UI、保存
→ 金币不足：Toast 提示金币不足
```

### 自动收益

1. 每 `incomeConfig.autoIncomeInterval` 秒发放一次。
2. 收益来自当前桥梁 `idleIncomePerSecond`。
3. 增加金币后刷新 UI。

### 车辆收益

1. 车辆经过桥梁中线时触发收益。
2. 收益 = 当前桥梁 vehicleIncome * 车辆倍率。
3. 增加金币后刷新 UI。

### 离线收益

1. 读取存档中的 `lastExitTime`。
2. 当前时间 - lastExitTime = 离线秒数。
3. 离线收益上限为 `incomeConfig.offlineMaxSeconds`，默认 28800 秒，即 8 小时。
4. 如果离线时间小于 30 秒，可以不显示弹窗。
5. 奖励 = 有效离线秒数 * 当前桥梁 idleIncomePerSecond。
6. 启动后显示离线收益弹窗。
7. 普通领取：增加 rewardCoins。
8. 看广告翻倍领取：调用 AdManager.showRewardAd，成功后领取 2 倍，失败提示广告未完整观看。

### 保存策略

1. 点击施工后保存。
2. 升级后保存。
3. 离线领取后保存。
4. 每 `autoSaveInterval` 秒自动保存一次。
5. `onDestroy` 或 `onDisable` 时保存 lastExitTime。

### 新手引导

1. 如果 `guideViewed=false`，显示新手引导。
2. 点击关闭引导后，保存 `guideViewed=true`。
3. 引导内容：

```txt
欢迎来到桥梁大亨！\n点击施工获得金币，升级桥梁后，车辆和离线收益都会提升。
```

---

## 6. JSON 配置文件要求

---

# 6.1 bridgeConfig.json

请生成：

```txt
assets/resources/configs/bridgeConfig.json
```

内容必须是数组，包含 20 级桥梁配置。

字段：

```json
{
  "level": 1,
  "name": "木板小桥",
  "upgradeCost": 100,
  "clickIncome": 1,
  "vehicleIncome": 5,
  "idleIncomePerSecond": 1
}
```

要求：

1. level 从 1 到 20。
2. 名称有成长感。
3. upgradeCost 逐级增加。
4. clickIncome 逐级增加。
5. vehicleIncome 逐级增加。
6. idleIncomePerSecond 逐级增加。
7. 第 20 级也要有 upgradeCost，可设置为 0 或较大值，但 UI 最高级显示“已满级”。

建议名称：

```txt
1 木板小桥
2 加固木桥
3 乡村木桥
4 石板小桥
5 青石拱桥
6 河畔石桥
7 钢筋桥
8 钢架桥
9 双车道桥
10 城镇大桥
11 城市高架桥
12 快速通行桥
13 江面大桥
14 山谷悬索桥
15 跨江大桥
16 跨海大桥
17 超级立交桥
18 智能交通桥
19 未来科技桥
20 天空巨桥
```

---

# 6.2 vehicleConfig.json

请生成：

```txt
assets/resources/configs/vehicleConfig.json
```

内容：

```json
[
  {
    "type": "car",
    "name": "小汽车",
    "speed": 180,
    "incomeMultiplier": 1,
    "color": "#4DA3FF"
  },
  {
    "type": "truck",
    "name": "货车",
    "speed": 130,
    "incomeMultiplier": 2,
    "color": "#F5A623"
  },
  {
    "type": "bus",
    "name": "巴士",
    "speed": 110,
    "incomeMultiplier": 3,
    "color": "#7ED321"
  }
]
```

---

# 6.3 incomeConfig.json

请生成：

```txt
assets/resources/configs/incomeConfig.json
```

内容：

```json
{
  "vehicleSpawnInterval": 2,
  "offlineMaxSeconds": 28800,
  "autoSaveInterval": 5,
  "adMockSuccessRate": 0.9,
  "autoIncomeInterval": 1
}
```

---

## 7. README.md 要求

请生成完整 `README.md`。

README 必须非常详细，适合我这种直接照着操作的人。

必须包含以下章节：

```txt
# 桥梁大亨 V1.0

## 1. 项目介绍
## 2. 当前版本功能
## 3. 文件结构说明
## 4. Cocos Creator 版本要求
## 5. 如何打开项目
## 6. 场景节点搭建教程
## 7. 脚本挂载教程
## 8. 属性拖拽绑定教程
## 9. Button 点击事件绑定教程
## 10. 推荐节点结构
## 11. 如何预览运行
## 12. 如何测试核心玩法
## 13. 如何测试离线收益
## 14. 如何清空存档
## 15. 如何修改桥梁配置
## 16. 如何修改车辆配置
## 17. 如何修改收益配置
## 18. 如何构建微信小游戏
## 19. 常见报错排查
## 20. 后续 V1.1 扩展方向
```

---

## 8. README 中必须写清楚的节点结构

README 必须指导我在 Cocos Creator 里创建如下节点：

```txt
Canvas
  GameRoot
    Managers
      SaveManager
      IncomeController
      BridgeController
      VehicleSpawner
      UIManager
      AdManager
      AudioManager

  GameView
    SkyBackground
    River
    BridgeVisual
      BridgeNameVisualLabel
    VehicleLayer

  UI
    TopBar
      CoinLabel
    BridgeInfoPanel
      BridgeLevelLabel
      BridgeNameLabel
      UpgradeCostLabel
      IdleIncomeLabel
      ClickIncomeLabel
    ButtonPanel
      BuildButton
        Label
      UpgradeButton
        Label
      ClearSaveButton
        Label
    OfflinePopup
      PopupBg
      OfflineRewardLabel
      ClaimOfflineButton
        Label
      ClaimDoubleOfflineButton
        Label
    GuidePanel
      GuideBg
      GuideLabel
      CloseGuideButton
        Label
    ToastLabel
```

说明：

1. `GameRoot` 挂 `GameManager.ts`。
2. `SaveManager` 节点挂 `SaveManager.ts`。
3. `IncomeController` 节点挂 `IncomeController.ts`。
4. `BridgeController` 节点挂 `BridgeController.ts`。
5. `VehicleSpawner` 节点挂 `VehicleSpawner.ts`。
6. `UIManager` 节点挂 `UIManager.ts`。
7. `AdManager` 节点挂 `AdManager.ts`。
8. `AudioManager` 节点挂 `AudioManager.ts`。
9. `BridgeVisual` 拖给 `BridgeController.bridgeVisual`。
10. `BridgeNameVisualLabel` 拖给 `BridgeController.bridgeNameVisualLabel`。
11. `VehicleLayer` 拖给 `VehicleSpawner.vehicleLayer`。
12. 所有 Label/Button/Popup/GuidePanel 拖给 `UIManager` 对应属性。
13. 所有 Manager 组件拖给 `GameManager` 对应属性。

---

## 9. README 中必须写清楚的按钮绑定

README 必须写清楚 Button 点击事件绑定方式：

### BuildButton

```txt
Button 组件 → Click Events → +
拖入 GameRoot 节点
选择 GameManager → onClickBuild
```

### UpgradeButton

```txt
Button 组件 → Click Events → +
拖入 GameRoot 节点
选择 GameManager → onClickUpgradeBridge
```

### ClearSaveButton

```txt
Button 组件 → Click Events → +
拖入 GameRoot 节点
选择 GameManager → onClickClearSave
```

### ClaimOfflineButton

```txt
Button 组件 → Click Events → +
拖入 GameRoot 节点
选择 GameManager → onClaimOfflineReward
```

### ClaimDoubleOfflineButton

```txt
Button 组件 → Click Events → +
拖入 GameRoot 节点
选择 GameManager → onClaimDoubleOfflineReward
```

### CloseGuideButton

```txt
Button 组件 → Click Events → +
拖入 GameRoot 节点
选择 GameManager → onCloseGuide
```

---

## 10. README 中必须写清楚的 UI 初始建议

README 必须写出每个 UI 的初始文案建议：

```txt
CoinLabel：金币：0
BridgeLevelLabel：桥梁等级：1
BridgeNameLabel：木板小桥
UpgradeCostLabel：升级费用：100
IdleIncomeLabel：自动收益：1/秒
ClickIncomeLabel：点击收益：1
BuildButton Label：施工
UpgradeButton Label：升级桥梁
ClearSaveButton Label：清空存档
OfflineRewardLabel：离线收益：0
ClaimOfflineButton Label：领取
ClaimDoubleOfflineButton Label：看广告翻倍
GuideLabel：欢迎来到桥梁大亨！点击施工获得金币，升级桥梁后，车辆和离线收益都会提升。
ToastLabel：提示文字
```

---

## 11. 游戏运行后必须达到的效果

完成后，在 Cocos Creator 手动搭建并绑定节点后，运行预览必须能实现：

1. 游戏启动显示金币、桥梁等级、桥梁名称、升级费用、点击收益、自动收益。
2. 点击“施工”按钮，金币增加。
3. 点击“升级桥梁”按钮，金币足够则升级。
4. 金币不足时出现 Toast。
5. 桥梁升级后，桥梁宽度/颜色/名称变化。
6. 每秒自动增加金币。
7. 车辆不断从左侧开到右侧。
8. 车辆经过桥梁中间时增加金币。
9. 关闭重新打开后，金币和桥梁等级仍然存在。
10. 离线超过 30 秒后重新打开，显示离线收益弹窗。
11. 点击领取离线收益，金币增加。
12. 点击看广告翻倍领取，有 90% 概率获得 2 倍收益。
13. 点击清空存档，恢复初始状态。
14. 新用户第一次进入显示新手引导。
15. 关闭新手引导后，下次不再显示。

---

## 12. Cocos 兼容性注意事项

代码必须注意：

1. Cocos Creator 3.8.x 使用：

```ts
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
```

2. JSON 加载使用：

```ts
import { resources, JsonAsset } from 'cc';
```

3. 本地存储使用：

```ts
import { sys } from 'cc';
```

4. 定时器可以使用 Component 的：

```ts
this.schedule(callback, interval);
this.unschedule(callback);
this.scheduleOnce(callback, delay);
```

5. 动态创建节点使用：

```ts
const node = new Node('Vehicle');
parent.addChild(node);
node.addComponent(Sprite);
node.addComponent(UITransform);
```

6. 修改节点位置使用：

```ts
this.node.setPosition(new Vec3(x, y, 0));
```

7. 修改 Sprite 颜色：

```ts
const sprite = node.getComponent(Sprite);
sprite.color = new Color(255, 255, 255, 255);
```

---

## 13. 兜底和自动查找要求

为了减少手动绑定出错，`GameManager` 需要做自动查找兜底：

如果属性没有拖拽绑定，请尝试：

```ts
this.getComponentInChildren(SaveManager)
this.getComponentInChildren(IncomeController)
this.getComponentInChildren(BridgeController)
this.getComponentInChildren(VehicleSpawner)
this.getComponentInChildren(UIManager)
this.getComponentInChildren(AdManager)
this.getComponentInChildren(AudioManager)
```

如果仍然找不到，用 `console.warn` 提示具体缺失哪个组件。

但注意：

1. 找不到关键组件时，不要直接崩溃。
2. 能运行的部分继续运行。
3. README 要提示用户检查拖拽绑定。

---

## 14. 重要实现细节

### 14.1 防止重复领取离线奖励

`GameManager` 中需要保存一个当前离线奖励对象：

```ts
private pendingOfflineReward: OfflineRewardData | null = null;
```

领取后设为 null，并隐藏弹窗。

### 14.2 保存时更新 lastExitTime

保存时请注意：

1. 普通自动保存可以更新金币和等级。
2. onDisable / onDestroy 时必须更新 lastExitTime 为 Date.now()。
3. 清空存档后也要刷新 UI。

### 14.3 最高级处理

如果当前等级已经是最高级：

1. 升级按钮可以不可点击。
2. 升级费用显示“已满级”。
3. 点击升级时 Toast：桥梁已满级。

### 14.4 金币不足处理

金币不足时：

1. 不扣金币。
2. 不升级。
3. Toast：金币不足，继续施工或等待车辆收益。

### 14.5 节点未绑定处理

所有节点访问前都要判断 null。

错误示例：

```ts
this.coinLabel.string = '金币：0';
```

正确示例：

```ts
if (this.coinLabel) {
  this.coinLabel.string = '金币：0';
} else {
  console.warn('[UIManager] coinLabel 未绑定');
}
```

---

## 15. 输出要求

执行完成后，请在终端回复：

1. 已生成的文件列表。
2. 每个文件的作用说明。
3. 是否有编译注意事项。
4. 我接下来在 Cocos Creator 里怎么做。
5. 哪些节点必须手动创建。
6. 哪些属性必须手动拖拽绑定。
7. 哪些按钮事件必须手动绑定。
8. 如何点击预览验证。

不要只输出建议。
不要省略代码。
不要生成伪代码。
不要只生成部分文件。
不要要求我重新创建项目。
不要生成 `.scene`。
不要生成 `.prefab`。

---

## 16. 请开始执行

现在请直接在当前 Cocos Creator 3.8.x 项目中生成以上所有文件和代码。

再次强调：

1. 只改 `assets/scripts/`、`assets/resources/`、`README.md`。
2. 代码要能编译。
3. README 要能让我一步一步照着搭建场景并运行。
4. 最终目标是：我打开 Cocos Creator，按 README 建节点和绑定脚本后，可以预览运行《桥梁大亨 V1.0》。
