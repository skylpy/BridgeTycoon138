# 桥梁大亨 V1.0

## 1. 项目介绍

《桥梁大亨 V1.0》是一个 Cocos Creator 3.8.x 搭桥升级类微信小游戏原型。玩家点击施工获得金币，升级桥梁后提升点击收益、车辆收益、自动收益和离线收益。

本版本不生成 `.scene` 和 `.prefab`，只补齐脚本、JSON 配置和搭建说明。你需要在 Cocos Creator 中手动创建节点、挂载脚本、拖拽属性并绑定按钮事件。

## 2. 当前版本功能

- 点击施工获得金币。
- 金币足够时升级桥梁。
- 桥梁升级后改变桥梁宽度、颜色和名称。
- 每秒自动获得金币。
- 车辆自动从左向右经过桥梁，过桥时发放车辆收益。
- 本地存档保存金币、桥梁等级、声音开关、新手引导状态和退出时间。
- 离线超过 30 秒后显示离线收益弹窗。
- 激励广告 mock：90% 概率领取 2 倍离线收益。
- 新用户首次进入显示新手引导。
- 支持一键清空存档。

## 3. 文件结构说明

```txt
assets/
  scripts/
    Types.ts              公共类型定义
    Utils.ts              金币、时间、数字、颜色工具函数
    EventBus.ts           轻量事件总线
    GameConfig.ts         JSON 配置加载和默认配置兜底
    SaveManager.ts        本地存档管理
    IncomeController.ts   金币和收益计算
    BridgeController.ts   桥梁等级和视觉表现
    VehicleController.ts  单辆车移动和奖励触发
    VehicleSpawner.ts     车辆定时生成
    UIManager.ts          UI 文本、弹窗、Toast、按钮状态
    AudioManager.ts       音效 mock
    AdManager.ts          激励广告 mock
    GameManager.ts        游戏总入口

  resources/
    configs/
      bridgeConfig.json   20 级桥梁配置
      vehicleConfig.json  车辆配置
      incomeConfig.json   收益节奏配置
```

## 4. Cocos Creator 版本要求

- 推荐版本：Cocos Creator 3.8.8。
- 兼容目标：Cocos Creator 3.8.x。
- 脚本语言：TypeScript。
- 不依赖第三方 npm 包。
- 不依赖远程资源。
- 不使用 JSB、原生插件或小游戏专属 API。

## 5. 如何打开项目

1. 打开 Cocos Creator 3.8.x。
2. 选择“打开项目”。
3. 选择当前项目目录：`BridgeTycoon38`。
4. 等待资源导入完成。
5. 如果编辑器提示脚本编译，等待编译结束。

## 6. 场景节点搭建教程

在当前场景中创建以下节点结构：

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

建议给 `SkyBackground`、`River`、`BridgeVisual`、`PopupBg`、`GuideBg` 添加 `Sprite` 和 `UITransform`，用纯色块占位即可。`BridgeVisual` 即使不添加 `Sprite`，`BridgeController` 也会在运行时自动补一个。

## 7. 脚本挂载教程

按下面方式挂脚本：

- `GameRoot` 挂载 `GameManager.ts`。
- `SaveManager` 节点挂载 `SaveManager.ts`。
- `IncomeController` 节点挂载 `IncomeController.ts`。
- `BridgeController` 节点挂载 `BridgeController.ts`。
- `VehicleSpawner` 节点挂载 `VehicleSpawner.ts`。
- `UIManager` 节点挂载 `UIManager.ts`。
- `AdManager` 节点挂载 `AdManager.ts`。
- `AudioManager` 节点挂载 `AudioManager.ts`。

`VehicleController.ts` 不需要手动挂载，它会由 `VehicleSpawner` 运行时自动添加到车辆节点。

## 8. 属性拖拽绑定教程

### GameManager 属性

选中 `GameRoot`，在 `GameManager` 组件中拖入：

- `SaveManager`：拖 `Managers/SaveManager` 上的 `SaveManager` 组件。
- `IncomeController`：拖 `Managers/IncomeController` 上的 `IncomeController` 组件。
- `BridgeController`：拖 `Managers/BridgeController` 上的 `BridgeController` 组件。
- `VehicleSpawner`：拖 `Managers/VehicleSpawner` 上的 `VehicleSpawner` 组件。
- `UIManager`：拖 `Managers/UIManager` 上的 `UIManager` 组件。
- `AdManager`：拖 `Managers/AdManager` 上的 `AdManager` 组件。
- `AudioManager`：拖 `Managers/AudioManager` 上的 `AudioManager` 组件。

如果忘记拖，`GameManager` 会尝试从子节点中自动查找；仍然找不到时会在控制台 warn。

### BridgeController 属性

选中 `Managers/BridgeController`：

- `bridgeVisual`：拖入 `GameView/BridgeVisual`。
- `bridgeNameVisualLabel`：拖入 `GameView/BridgeVisual/BridgeNameVisualLabel` 的 `Label` 组件。

### VehicleSpawner 属性

选中 `Managers/VehicleSpawner`：

- `vehicleLayer`：拖入 `GameView/VehicleLayer`。

### UIManager 属性

选中 `Managers/UIManager`，按名字一一拖入：

- `coinLabel`：`UI/TopBar/CoinLabel` 的 `Label`。
- `bridgeLevelLabel`：`UI/BridgeInfoPanel/BridgeLevelLabel` 的 `Label`。
- `bridgeNameLabel`：`UI/BridgeInfoPanel/BridgeNameLabel` 的 `Label`。
- `upgradeCostLabel`：`UI/BridgeInfoPanel/UpgradeCostLabel` 的 `Label`。
- `idleIncomeLabel`：`UI/BridgeInfoPanel/IdleIncomeLabel` 的 `Label`。
- `clickIncomeLabel`：`UI/BridgeInfoPanel/ClickIncomeLabel` 的 `Label`。
- `buildButton`：`UI/ButtonPanel/BuildButton` 的 `Button`。
- `upgradeButton`：`UI/ButtonPanel/UpgradeButton` 的 `Button`。
- `clearSaveButton`：`UI/ButtonPanel/ClearSaveButton` 的 `Button`。
- `offlinePopup`：`UI/OfflinePopup`。
- `offlineRewardLabel`：`UI/OfflinePopup/OfflineRewardLabel` 的 `Label`。
- `claimOfflineButton`：`UI/OfflinePopup/ClaimOfflineButton` 的 `Button`。
- `claimDoubleOfflineButton`：`UI/OfflinePopup/ClaimDoubleOfflineButton` 的 `Button`。
- `toastLabel`：`UI/ToastLabel` 的 `Label`。
- `guidePanel`：`UI/GuidePanel`。
- `guideLabel`：`UI/GuidePanel/GuideLabel` 的 `Label`。

## 9. Button 点击事件绑定教程

每个按钮都在 `Button` 组件的 `Click Events` 中添加事件，拖入 `GameRoot` 节点，然后选择 `GameManager` 对应方法。

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

## 10. 推荐节点结构

推荐直接使用第 6 节的结构。布局可以按下面方式摆放：

- `GameView` 放在画面中部，`BridgeVisual` 放在桥面位置，`VehicleLayer` 和桥梁同一水平线。
- `TopBar` 放顶部，展示金币。
- `BridgeInfoPanel` 放左上或右上，展示等级、名称和收益。
- `ButtonPanel` 放底部，放施工、升级、清空存档按钮。
- `OfflinePopup` 居中，初始可以设为隐藏。
- `GuidePanel` 居中，初始可以设为隐藏。
- `ToastLabel` 放屏幕中上方，初始可以设为隐藏。

## 11. 如何预览运行

1. 保存当前场景。
2. 确认 `GameRoot` 已挂 `GameManager`。
3. 确认所有 Manager 节点已挂对应脚本。
4. 确认按钮点击事件已经绑定。
5. 点击 Cocos Creator 顶部“预览”。
6. 打开浏览器控制台查看 log 和 warn。

首次运行会显示新手引导，点击关闭后下次不再显示。

## 12. 如何测试核心玩法

1. 点击“施工”，观察金币增加。
2. 等待车辆从左向右移动，经过桥中间时金币增加。
3. 等待自动收益，金币每秒增加。
4. 金币达到升级费用后，点击“升级桥梁”。
5. 观察桥梁等级、名称、宽度、颜色、点击收益、自动收益变化。
6. 金币不足时点击“升级桥梁”，观察 Toast 提示。

## 13. 如何测试离线收益

1. 运行游戏并获得一些金币。
2. 关闭预览窗口或停止预览。
3. 等待 30 秒以上。
4. 再次预览运行。
5. 如果存档正常，会显示离线收益弹窗。
6. 点击“领取”获得普通离线收益。
7. 或点击“看广告翻倍”，等待 1 秒 mock 广告结果，成功后获得 2 倍收益。

离线收益上限由 `assets/resources/configs/incomeConfig.json` 的 `offlineMaxSeconds` 控制，默认 28800 秒。

## 14. 如何清空存档

运行中点击“清空存档”按钮即可。清空后会恢复：

- 金币：0。
- 桥梁等级：1。
- 声音：开启。
- 新手引导：未看过。

也可以在浏览器控制台手动清除 localStorage 中的 `bridge_tycoon_v1_save_data`。

## 15. 如何修改桥梁配置

编辑 `assets/resources/configs/bridgeConfig.json`。每一级字段如下：

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

修改后回到 Cocos Creator，等待资源重新导入，再预览。即使 JSON 字段异常，`GameConfig.ts` 也会使用默认配置兜底。

## 16. 如何修改车辆配置

编辑 `assets/resources/configs/vehicleConfig.json`。字段说明：

- `type`：车辆类型，支持 `car`、`truck`、`bus` 时会使用内置大小。
- `name`：车辆显示名称。
- `speed`：移动速度，数值越大越快。
- `incomeMultiplier`：车辆收益倍率。
- `color`：车辆色块颜色，格式为 `#RRGGBB`。

## 17. 如何修改收益配置

编辑 `assets/resources/configs/incomeConfig.json`：

```json
{
  "vehicleSpawnInterval": 2,
  "offlineMaxSeconds": 28800,
  "autoSaveInterval": 5,
  "adMockSuccessRate": 0.9,
  "autoIncomeInterval": 1
}
```

- `vehicleSpawnInterval`：车辆生成间隔。
- `offlineMaxSeconds`：离线收益最大累计秒数。
- `autoSaveInterval`：自动保存间隔。
- `adMockSuccessRate`：广告 mock 成功率，0 到 1。
- `autoIncomeInterval`：自动收益发放间隔。

## 18. 如何构建微信小游戏

1. 确认浏览器预览玩法正常。
2. 打开“项目 → 构建发布”。
3. 发布平台选择“微信小游戏”。
4. 按 Cocos Creator 官方流程填写 AppID、构建目录和相关选项。
5. 点击构建。
6. 使用微信开发者工具打开构建产物。

当前版本没有接入真实微信广告 SDK，也没有使用微信专属 API。`AdManager.ts` 只是 mock，后续接入真实能力时替换 `showRewardAd()` 即可。

## 19. 常见报错排查

- 控制台提示 `xxx 未绑定`：检查对应节点或组件是否拖到 Inspector 属性里。
- 点击按钮没反应：检查 Button 的 `Click Events` 是否拖入 `GameRoot`，方法是否选对。
- 车辆不出现：检查 `VehicleSpawner.vehicleLayer` 是否绑定，或确认 `GameView/VehicleLayer` 在可见区域。
- 桥梁不变色或不变宽：检查 `BridgeController.bridgeVisual` 是否绑定到 `BridgeVisual`。
- 离线弹窗不出现：确认离线时间超过 30 秒，并且上次退出时存档写入成功。
- JSON 修改后无效：回到 Creator 等待资源导入，必要时重新预览。
- 升级按钮不可点：金币不足或桥梁已经满级。

## 20. 后续 V1.1 扩展方向

- 加入真实桥梁美术资源和车辆精灵图。
- 增加桥梁主题、区域解锁和任务系统。
- 增加商店、倍速收益、永久升级项。
- 接入微信小游戏激励视频广告。
- 接入排行榜、分享、云存档。
- 增加数值曲线工具和关卡配置表。
- 增加音效资源并替换 `AudioManager` mock。

## UI 初始文案建议

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

## 关卡难度系统

当前版本新增 20 个配置驱动关卡，配置文件位于 `assets/resources/configs/levelConfig.json`。游戏启动时会优先读取该 JSON；如果读取失败，会使用 `LevelManager.ts` 内置的 20 关默认配置，避免预览时空关卡或黑屏。

关卡节奏：

- 第 1~5 关：教学，学习连通桥面、三角支撑、预算意识。
- 第 6~10 关：基础挑战，引入货车、连续车辆、低预算和长跨度。
- 第 11~15 关：地形限制，引入高低岸、限高、船道预留和重车。
- 第 16~20 关：综合挑战，组合不对称支点、窄区域、巴士、连续三车和最终长跨度。

## levelConfig.json 字段说明

- `level`：关卡序号，从 1 开始。
- `name`：关卡名称，显示在顶部栏。
- `difficulty`：难度标签，支持 `tutorial`、`easy`、`normal`、`hard`、`challenge`。
- `tips`：提示条文案。
- `budget`：本关预算。
- `spanWidth`：桥梁跨度，用于关卡设计和默认兜底。
- `roadHeight`：道路基础高度。
- `anchorPoints`：支点坐标，至少包含左右桥面端点。
- `buildArea`：可搭建区域中心点和宽高。
- `vehicles`：车辆配置，可配置车型、重量、速度、数量和生成间隔。
- `successCondition`：通关条件，目前使用所有车辆通过和断裂数量限制。
- `starCondition`：星级条件，目前三星看材料使用量。
- `unlockNextOnPass`：通关后是否解锁下一关。

## 20关难度设计说明

每关只增加一个主要难点：先学习搭桥，再增加承重和预算压力，然后加入地形限制，最后组合跨度、预算、车辆和支点变化。第一版只使用跨度、预算、车辆、支点、可搭建区域这 5 类变量。

## 如何修改每关预算

打开 `assets/resources/configs/levelConfig.json`，修改目标关卡的 `budget`。例如把第 8 关预算从 `130` 改为 `150`，保存后回到 Creator 等待资源导入并重新预览。

## 如何修改车辆重量

在关卡的 `vehicles` 数组里修改 `weight`。重量越高，桥面压力越大。示例：

```json
{ "type": "truck", "weight": 2.0, "speed": 62, "count": 1, "spawnInterval": 1.3 }
```

## 如何修改跨度

同时调整 `spanWidth` 和左右主支点的 `anchorPoints`。例如跨度 520 通常对应左右主支点 `x` 为 `-260` 和 `260`。

## 如何修改可搭建区域

修改 `buildArea`：

```json
{ "x": 0, "y": -80, "width": 620, "height": 220 }
```

`width` 越小，横向可搭建范围越窄；`height` 越小，上下结构空间越受限；`y` 越高，越能模拟下方需要留空的船道。

## 如何测试下一关

在当前关点击“开始测试”，所有车辆通过后会显示星级并解锁下一关。点击“下一关”进入新配置；如果当前关未通关会提示“请先通过当前关”，第 20 关后会提示“已经是最后一关”。

## 如何重置关卡存档

关卡进度保存在本地存档字段：

- `currentLevel`
- `unlockedLevel`
- `levelStars`

在游戏内点击清空存档会恢复默认值。调试时也可以清除浏览器/Cocos 预览的 localStorage，或删除 key `bridge_tycoon_v1_save_data` 后重新预览。

## 玩法体验优化 V1

本轮优化集中接入到自动场景主流程 `SceneBootstrap.ts`，不新增 scene/prefab，不改变原有撤销、清空、重试、下一关按钮流程。配置文件位于 `assets/resources/configs/gameplayConfig.json`。

## 拖拽预览线说明

拖拽建造时会实时绘制预览线：绿色代表可建造，黄色代表可建造但杆件较长、成本较高，红色代表不可建造。非法原因会同步显示在提示条和 Toast 中。

## 节点吸附规则

固定锚点优先吸附，普通节点次之。吸附半径由 `snap.anchorSnapRadius` 和 `snap.snapRadius` 控制，吸附到节点时会显示黄色高亮圈。

## 重复节点和重复杆件防止

节点合并距离为 12px；同一对节点之间 A-B 和 B-A 视为同一根杆件；同时防止超出可搭建区域、自己连自己、杆件太短、杆件太长、预算不足仍创建。

## 杆件受力颜色说明

测试时杆件根据 `stressRatio` 变色：正常工程黄、轻微受力浅橙、高压力深橙、危险红色，断裂后变灰。桥面和靠近车辆的斜撑都会参与轻量受力模拟。

## 桥面下沉反馈说明

车辆经过桥面时会产生视觉下沉，小车较轻、货车和巴士更明显；危险受力时会出现轻微抖动。该反馈只改变视觉位置，重试和清空会恢复。

## 失败原因弹窗说明

测试前会检查是否有桥梁结构、桥面是否连通、预算是否异常。失败弹窗会显示失败原因和优化建议，覆盖桥面未连通、下沉过大、杆件断裂、超预算、车辆未通过、车辆掉入水中。

## 通关星级规则

1 星：所有车辆通过。2 星：所有车辆通过且断裂数量满足关卡限制。3 星：在 2 星基础上，用料不超过 `starCondition.threeStar.maxCost`。星级会通过 `LevelManager` 保存到存档。

## 每关目标提示配置

`levelConfig.json` 每关新增：

- `objective`：本关目标。
- `difficultyPoint`：核心难点。
- `vehicleSummary`：车辆摘要。

每次进入新关会显示目标面板，重试不会重复弹出完整目标面板。

## gameplayConfig.json 字段说明

- `buildPreview`：预览线开关、颜色、线宽、最短/最长杆件、长杆警告阈值。
- `snap`：吸附开关、普通节点/锚点吸附半径、吸附高亮颜色。
- `stressVisual`：受力颜色和低/高/危险阈值。
- `deckFeedback`：不同车型下沉幅度、恢复速度、危险抖动开关和幅度。

## 常见问题排查

- 预览线一直红色：检查是否超出搭建区域、预算不足、杆件过长或连接了重复杆件。
- 车辆一开始就不测试：桥面未横向连通左右道路，先搭连续桥面。
- 杆件很快变红：桥面过长或下方支撑不足，增加三角斜撑。
- 通关星级低：减少用料并避免断裂，参考目标面板的三星成本。
- 修改 JSON 后无效：回到 Creator 等待资源重新导入，必要时重新打开预览。
