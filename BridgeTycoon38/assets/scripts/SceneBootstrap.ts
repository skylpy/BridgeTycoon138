// 场景启动器：2D 物理搭桥闯关 V1，默认场景挂载后可直接预览试玩。
import {
  _decorator,
  BoxCollider2D,
  Button,
  Color,
  Component,
  ERigidBody2DType,
  EventTouch,
  Graphics,
  HorizontalTextAlignment,
  JsonAsset,
  Label,
  Node,
  NodeEventType,
  PhysicsSystem2D,
  RigidBody2D,
  Size,
  Sprite,
  UITransform,
  Vec2,
  Vec3,
  VerticalTextAlignment,
  isValid,
  resources,
} from 'cc';
import { BuildInvalidReason, BuildValidationResult, FailureReason, GameplayConfig, TestResult, colorFromHex } from './GameplayTypes';
import { LevelManager } from './LevelManager';
import { LevelConfig, LevelResult, LevelVehicleConfig } from './LevelTypes';

const { ccclass, property } = _decorator;

type GameState = 'BUILDING' | 'TESTING' | 'SUCCESS' | 'FAILED';

interface BridgeSegmentData {
  id: string;
  startNodeId: string;
  endNodeId: string;
  start: Vec2;
  end: Vec2;
  cost: number;
  length: number;
  node: Node;
  stress: number;
  maxStress: number;
  isBroken: boolean;
  isDeck: boolean;
  isSupport: boolean;
  baseY: number;
}

interface BridgeNodeData {
  id: string;
  x: number;
  y: number;
  point: Vec2;
  isAnchor: boolean;
  node?: Node;
}

interface VehicleRuntime {
  node: Node;
  body: RigidBody2D;
  config: LevelVehicleConfig;
  lastX: number;
  stuckTimer: number;
}

interface UiBlockRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const PLATFORM_HEIGHT = 96;
const PLATFORM_TOP_OFFSET = PLATFORM_HEIGHT / 2;
const SEGMENT_THICKNESS = 14;
const SEGMENT_VISUAL_HEIGHT = 72;
const GRID_SIZE = 40;
const LEVEL_ANCHOR_BASE_Y = -112;
const GRID_MINOR_ALPHA = Math.round(255 * 0.12);
const GRID_MAJOR_ALPHA = Math.round(255 * 0.22);
const NODE_DEDUPE_DISTANCE = 12;
const DRAG_CREATE_DISTANCE = 12;
const DRIVE_DECK_MAX_SLOPE = 18;
const DRIVE_DECK_COLLIDER_THICKNESS = 10;
const DECK_BASE_MAX_STRESS = 108;
const SUPPORT_BASE_MAX_STRESS = 135;
const STRESS_BREAK_RATIO = 1.08;
const FALL_Y = -370;
const DEFAULT_GAMEPLAY_CONFIG: GameplayConfig = {
  buildPreview: {
    enabled: true,
    validColor: '#62D26F',
    warningColor: '#FFD95A',
    invalidColor: '#E84C3D',
    lineWidth: 5,
    minSegmentLength: 25,
    maxSegmentLength: 180,
    longSegmentWarningLength: 130,
  },
  snap: {
    enabled: true,
    snapRadius: 24,
    anchorSnapRadius: 32,
    showSnapHighlight: true,
    highlightColor: '#FFE066',
  },
  stressVisual: {
    enabled: true,
    normalColor: '#F2C230',
    lowStressColor: '#F5A623',
    highStressColor: '#F28C28',
    dangerColor: '#E84C3D',
    brokenColor: '#4A4A4A',
    lowThreshold: 0.35,
    highThreshold: 0.65,
    dangerThreshold: 0.85,
  },
  deckFeedback: {
    enabled: true,
    carSink: 3,
    truckSink: 7,
    busSink: 10,
    heavyTruckSink: 12,
    recoverSpeed: 8,
    shakeOnDanger: true,
    shakeAmplitude: 4,
  },
};

@ccclass('SceneBootstrap')
export class SceneBootstrap extends Component {
  @property(LevelManager)
  public levelManager: LevelManager | null = null;

  private state: GameState = 'BUILDING';
  private nodeSerial = 0;
  private segmentSerial = 0;
  private budgetRemaining = 100;
  private selectedPoint: Vec2 | null = null;
  private leftAnchor = new Vec2(-175, -112);
  private rightAnchor = new Vec2(175, -112);
  private startPoint = new Vec2(-430, -100);
  private finishX = 430;
  private finishY = -91;
  private breakCount = 0;
  private maxSink = 0;
  private vehicleSpawnCursor = 0;
  private vehicleSpawnTimer = 0;
  private vehiclesPassed = 0;
  private totalVehicles = 0;
  private readonly vehicleQueue: LevelVehicleConfig[] = [];
  private readonly runtimeVehicles: VehicleRuntime[] = [];
  private readonly segments: BridgeSegmentData[] = [];
  private readonly bridgeNodes: BridgeNodeData[] = [];
  private readonly snapPoints: Vec2[] = [];
  private readonly platformAnchorPoints: Vec2[] = [];
  private buildAreaMinX = -180;
  private buildAreaMaxX = 180;
  private buildAreaMinY = -230;
  private buildAreaMaxY = 40;
  private gridOriginX = -180;
  private gridOriginY = -100;
  private touchStartPoint: Vec2 | null = null;
  private touchStartHadSelection = false;
  private touchMovedForDrag = false;
  private snapHighlightPoint: Vec2 | null = null;
  private toastTimer = 0;
  private gameplayConfig: GameplayConfig = DEFAULT_GAMEPLAY_CONFIG;

  private backgroundLayer: Node | null = null;
  private gameLayer: Node | null = null;
  private anchorLayer: Node | null = null;
  private bridgeLayer: Node | null = null;
  private vehicleLayer: Node | null = null;
  private uiRoot: Node | null = null;
  private previewNode: Node | null = null;
  private previewGraphics: Graphics | null = null;
  private markerNode: Node | null = null;
  private markerGraphics: Graphics | null = null;
  private carGraphics: Graphics | null = null;

  private titleLabel: Label | null = null;
  private levelLabel: Label | null = null;
  private budgetLabel: Label | null = null;
  private usedMaterialLabel: Label | null = null;
  private modeLabel: Label | null = null;
  private hintLabel: Label | null = null;
  private toastLabel: Label | null = null;
  private resultPopup: Node | null = null;
  private resultTitleLabel: Label | null = null;
  private resultMessageLabel: Label | null = null;
  private objectivePopup: Node | null = null;
  private objectiveTitleLabel: Label | null = null;
  private objectiveMessageLabel: Label | null = null;

  private startTestButton: Node | null = null;
  private undoButton: Node | null = null;
  private clearButton: Node | null = null;
  private retryButton: Node | null = null;
  private nextButton: Node | null = null;
  private readonly uiBlockRects: UiBlockRect[] = [];

  protected onLoad(): void {
    this.setupPhysics();
    this.resolveSceneNodes();
    this.createUI();
    this.node.on(NodeEventType.TOUCH_START, this.onCanvasTouchStart, this);
    this.node.on(NodeEventType.TOUCH_END, this.onCanvasTouchEnd, this);
    this.node.on(NodeEventType.TOUCH_MOVE, this.onCanvasTouchMove, this);
    this.node.on(NodeEventType.TOUCH_CANCEL, this.onCanvasTouchCancel, this);
  }

  protected async start(): Promise<void> {
    await this.loadGameplayConfig();
    await this.prepareLevelManager();
    this.loadCurrentLevel();
  }

  protected onDestroy(): void {
    this.node.off(NodeEventType.TOUCH_START, this.onCanvasTouchStart, this);
    this.node.off(NodeEventType.TOUCH_END, this.onCanvasTouchEnd, this);
    this.node.off(NodeEventType.TOUCH_MOVE, this.onCanvasTouchMove, this);
    this.node.off(NodeEventType.TOUCH_CANCEL, this.onCanvasTouchCancel, this);
  }

  protected update(deltaTime: number): void {
    this.updateToast(deltaTime);
    if (this.state !== 'TESTING') {
      return;
    }
    this.updateVehicle(deltaTime);
  }

  private setupPhysics(): void {
    const physics = PhysicsSystem2D.instance;
    physics.enable = true;
    physics.gravity = new Vec2(0, -650);
    physics.debugDrawFlags = 0;
  }

  private resolveSceneNodes(): void {
    this.node.name = 'Canvas';
    this.ensureTransform(this.node, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.ensureCoreLayers();
  }

  private async prepareLevelManager(): Promise<void> {
    if (!this.levelManager) {
      this.levelManager = this.node.getComponentInChildren(LevelManager);
    }
    if (!this.levelManager) {
      const managerNode = this.getOrCreateNode('GameManager', this.node);
      this.levelManager = managerNode.getComponent(LevelManager) ?? managerNode.addComponent(LevelManager);
    }
    await this.levelManager.loadLevels();
  }

  private async loadGameplayConfig(): Promise<void> {
    try {
      const asset = await this.loadJsonAsset('configs/gameplayConfig');
      this.gameplayConfig = this.mergeGameplayConfig(asset.json as Partial<GameplayConfig>);
    } catch (error) {
      console.warn('[SceneBootstrap] gameplayConfig 加载失败，使用默认体验配置', error);
      this.gameplayConfig = DEFAULT_GAMEPLAY_CONFIG;
    }
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

  private mergeGameplayConfig(value: Partial<GameplayConfig>): GameplayConfig {
    return {
      buildPreview: { ...DEFAULT_GAMEPLAY_CONFIG.buildPreview, ...(value.buildPreview ?? {}) },
      snap: { ...DEFAULT_GAMEPLAY_CONFIG.snap, ...(value.snap ?? {}) },
      stressVisual: { ...DEFAULT_GAMEPLAY_CONFIG.stressVisual, ...(value.stressVisual ?? {}) },
      deckFeedback: { ...DEFAULT_GAMEPLAY_CONFIG.deckFeedback, ...(value.deckFeedback ?? {}) },
    };
  }

  private loadCurrentLevel(): void {
    const levelNumber = this.levelManager?.getCurrentLevelIndex() ?? 1;
    this.loadLevel(levelNumber);
  }

  private loadLevel(levelNumber: number): void {
    if (this.levelManager) {
      this.levelManager.setCurrentLevel(levelNumber);
    }
    const level = this.getCurrentLevel();
    this.state = 'BUILDING';
    this.nodeSerial = 0;
    this.segmentSerial = 0;
    this.budgetRemaining = level.budget;
    this.selectedPoint = null;
    this.resetTouchInteraction();
    this.breakCount = 0;
    this.maxSink = 0;
    this.vehicleSpawnCursor = 0;
    this.vehicleSpawnTimer = 0;
    this.vehiclesPassed = 0;
    this.totalVehicles = 0;
    this.vehicleQueue.length = 0;
    this.runtimeVehicles.length = 0;
    this.segments.length = 0;
    this.bridgeNodes.length = 0;
    this.snapPoints.length = 0;
    this.platformAnchorPoints.length = 0;
    this.snapHighlightPoint = null;

    this.clearLayer(this.backgroundLayer);
    this.clearLayer(this.gameLayer);
    if (!this.ensureCoreLayers()) {
      this.showToast('场景层级初始化失败');
      return;
    }

    this.createBackground();
    this.createLevelGeometry(level);
    this.createPreviewLayer();
    this.createMarkerLayer();
    this.bringGameplayOverlayLayersToFront();
    this.refreshSnapPoints();
    this.redrawMarkers();
    this.hideResultPopup();
    this.showToast(`第 ${level.level} 关：${level.name}`);
    this.refreshUI();
    this.showLevelObjective(level);
  }

  private createBackground(): void {
    if (!this.backgroundLayer) {
      return;
    }
    this.createSky();
    this.createCloud('CloudLeft', -500, 200, 0.82);
    this.createCloud('CloudMid', -290, 196, 0.58);
    this.createCloud('CloudRight', 420, 212, 1.02);
    this.createCloud('CloudFarRight', 560, 190, 0.62);
    this.createBuildings('FarBuildings', -610, 30, 0.5, new Color(130, 183, 216, 132));
    this.createBuildings('MidBuildings', -590, -40, 0.72, new Color(130, 183, 216, 190));
    this.createBridgeConstructionBackdrop();
    this.createGraphicsNode('River', this.backgroundLayer, CANVAS_WIDTH, 300, new Color(0, 105, 168, 255)).setPosition(new Vec3(0, -246, 4));
    this.drawRiverDetails();
  }

  private createBridgeConstructionBackdrop(): void {
    if (!this.backgroundLayer) {
      return;
    }
    const backdrop = this.ensureNode('BridgeConstructionBackdrop', this.backgroundLayer);
    const graphics = backdrop.getComponent(Graphics) ?? backdrop.addComponent(Graphics);
    graphics.clear();

    graphics.fillColor = new Color(78, 84, 88, 255);
    graphics.fillRect(-CANVAS_WIDTH / 2, -76, CANVAS_WIDTH, 44);
    graphics.fillColor = new Color(89, 96, 107, 255);
    graphics.fillRect(-CANVAS_WIDTH / 2, -38, CANVAS_WIDTH, 6);
    graphics.fillColor = new Color(238, 238, 220, 255);
    for (let x = -580; x < 620; x += 92) {
      graphics.fillRect(x, -54, 44, 4);
    }
    graphics.strokeColor = new Color(201, 210, 219, 205);
    graphics.lineWidth = 3;
    graphics.moveTo(-CANVAS_WIDTH / 2, -28);
    graphics.lineTo(CANVAS_WIDTH / 2, -28);
    graphics.stroke();
    for (let x = -560; x <= 560; x += 72) {
      graphics.moveTo(x, -38);
      graphics.lineTo(x, -20);
    }
    graphics.stroke();
    this.drawMiniTraffic(graphics, -210, -36, new Color(246, 190, 52, 255), 0.72);
    this.drawMiniTruck(graphics, -64, -35, new Color(235, 100, 48, 255), 0.78);
    this.drawMiniTraffic(graphics, 150, -37, new Color(46, 126, 202, 255), 0.68);

    graphics.fillColor = new Color(226, 224, 210, 255);
    graphics.roundRect(-620, -130, 330, 90, 18);
    graphics.roundRect(290, -130, 330, 90, 18);
    graphics.fill();
    graphics.fillColor = new Color(180, 184, 176, 255);
    graphics.fillRect(-620, -164, 330, 42);
    graphics.fillRect(290, -164, 330, 42);
    graphics.fillColor = new Color(246, 246, 232, 255);
    graphics.fillRect(-620, -88, 330, 12);
    graphics.fillRect(290, -88, 330, 12);
    graphics.fillColor = new Color(218, 182, 68, 255);
    graphics.fillRect(-620, -104, 330, 5);
    graphics.fillRect(290, -104, 330, 5);

    graphics.fillColor = new Color(205, 205, 192, 255);
    graphics.roundRect(-250, -246, 58, 170, 18);
    graphics.roundRect(192, -246, 58, 170, 18);
    graphics.fill();
    graphics.strokeColor = new Color(150, 154, 150, 210);
    graphics.lineWidth = 3;
    graphics.moveTo(-221, -236);
    graphics.lineTo(-221, -92);
    graphics.moveTo(221, -236);
    graphics.lineTo(221, -92);
    graphics.stroke();

    graphics.strokeColor = new Color(210, 214, 214, 135);
    graphics.lineWidth = 2;
    for (let x = -520; x <= 520; x += GRID_SIZE) {
      graphics.moveTo(x, 214);
      graphics.lineTo(x, -190);
    }
    for (let y = -180; y <= 210; y += GRID_SIZE) {
      graphics.moveTo(-540, y);
      graphics.lineTo(540, y);
    }
    graphics.stroke();

    graphics.strokeColor = new Color(245, 218, 74, 180);
    graphics.lineWidth = 3;
    graphics.moveTo(-300, -138);
    graphics.quadraticCurveTo(-235, -170, -190, -120);
    graphics.moveTo(300, -138);
    graphics.quadraticCurveTo(235, -170, 190, -120);
    graphics.stroke();

    for (let x = -520; x <= 520; x += 220) {
      this.drawBackdropTree(graphics, x, -34);
    }
  }

  private drawMiniTraffic(graphics: Graphics, x: number, y: number, color: Color, scale: number): void {
    graphics.fillColor = new Color(30, 34, 40, 90);
    graphics.roundRect(x - 28 * scale, y - 10 * scale, 56 * scale, 8 * scale, 4 * scale);
    graphics.fill();
    graphics.fillColor = color;
    graphics.roundRect(x - 24 * scale, y - 18 * scale, 48 * scale, 20 * scale, 7 * scale);
    graphics.fill();
    graphics.fillColor = new Color(220, 246, 255, 235);
    graphics.roundRect(x - 5 * scale, y - 12 * scale, 16 * scale, 10 * scale, 4 * scale);
    graphics.fill();
    graphics.fillColor = new Color(35, 39, 45, 255);
    graphics.circle(x - 15 * scale, y - 19 * scale, 6 * scale);
    graphics.circle(x + 16 * scale, y - 19 * scale, 6 * scale);
    graphics.fill();
  }

  private drawMiniTruck(graphics: Graphics, x: number, y: number, color: Color, scale: number): void {
    graphics.fillColor = new Color(30, 34, 40, 90);
    graphics.roundRect(x - 36 * scale, y - 10 * scale, 74 * scale, 8 * scale, 4 * scale);
    graphics.fill();
    graphics.fillColor = color;
    graphics.roundRect(x - 40 * scale, y - 22 * scale, 48 * scale, 28 * scale, 5 * scale);
    graphics.roundRect(x + 8 * scale, y - 18 * scale, 30 * scale, 22 * scale, 5 * scale);
    graphics.fill();
    graphics.fillColor = new Color(220, 246, 255, 235);
    graphics.fillRect(x + 17 * scale, y - 12 * scale, 12 * scale, 10 * scale);
    graphics.fillColor = new Color(35, 39, 45, 255);
    graphics.circle(x - 22 * scale, y - 22 * scale, 6 * scale);
    graphics.circle(x + 24 * scale, y - 22 * scale, 6 * scale);
    graphics.fill();
  }

  private createLevelGeometry(level: LevelConfig): void {
    if (!this.gameLayer) {
      return;
    }
    const leftConfig = level.anchorPoints[0] ?? { x: -level.spanWidth / 2, y: level.roadHeight };
    const rightConfig = level.anchorPoints[1] ?? { x: level.spanWidth / 2, y: level.roadHeight };
    const leftDeckY = LEVEL_ANCHOR_BASE_Y + leftConfig.y;
    const rightDeckY = LEVEL_ANCHOR_BASE_Y + rightConfig.y;
    const leftPlatformWidth = Math.max(230, Math.min(340, 660 - level.spanWidth / 2));
    const rightPlatformWidth = leftPlatformWidth;
    const leftCenterX = leftConfig.x - leftPlatformWidth / 2;
    const rightCenterX = rightConfig.x + rightPlatformWidth / 2;
    const leftTopY = leftDeckY + DRIVE_DECK_COLLIDER_THICKNESS / 2;
    const rightTopY = rightDeckY + DRIVE_DECK_COLLIDER_THICKNESS / 2;
    const leftPlatformY = leftTopY - PLATFORM_TOP_OFFSET;
    const rightPlatformY = rightTopY - PLATFORM_TOP_OFFSET;
    this.leftAnchor = new Vec2(leftConfig.x, leftDeckY);
    this.rightAnchor = new Vec2(rightConfig.x, rightDeckY);
    this.gridOriginX = this.leftAnchor.x;
    this.gridOriginY = this.leftAnchor.y;
    level.anchorPoints.forEach((point) => {
      this.platformAnchorPoints.push(new Vec2(point.x, LEVEL_ANCHOR_BASE_Y + point.y));
    });
    this.platformAnchorPoints.forEach((point: Vec2) => this.getOrCreateBridgeNode(point, true));
    this.buildAreaMinX = level.buildArea.x - level.buildArea.width / 2;
    this.buildAreaMaxX = level.buildArea.x + level.buildArea.width / 2;
    this.buildAreaMinY = LEVEL_ANCHOR_BASE_Y + level.buildArea.y - level.buildArea.height / 2;
    this.buildAreaMaxY = LEVEL_ANCHOR_BASE_Y + level.buildArea.y + level.buildArea.height / 2;
    this.startPoint = new Vec2(leftCenterX - leftPlatformWidth / 2 + 70, leftTopY + 16);
    this.finishX = rightCenterX + rightPlatformWidth / 2 - 70;
    this.finishY = rightTopY + 16;

    this.createPlatform('LeftPlatform', leftCenterX, leftPlatformY, leftPlatformWidth, PLATFORM_HEIGHT);
    this.createPlatform('RightPlatform', rightCenterX, rightPlatformY, rightPlatformWidth, PLATFORM_HEIGHT);
    this.createRoadStrip('LeftRoad', leftCenterX, leftTopY + 10, leftPlatformWidth, 20);
    this.createRoadStrip('RightRoad', rightCenterX, rightTopY + 10, rightPlatformWidth, 20);
    this.createBridgeApproach('LeftBridgeApproach', this.leftAnchor.x + 22, this.leftAnchor.y, 46, 10);
    this.createBridgeApproach('RightBridgeApproach', this.rightAnchor.x - 22, this.rightAnchor.y, 46, 10);
    this.createFlag('StartFlag', this.startPoint.x - 26, leftTopY + 72, new Color(82, 166, 255, 255));
    this.createFlag('FinishFlag', this.finishX, rightTopY + 72, new Color(255, 92, 92, 255));
    this.createBuildArea(level);
    this.platformAnchorPoints.forEach((point: Vec2, index: number) => {
      this.createAnchorDot(`PlatformAnchor_${index}`, point.x, point.y);
    });
  }

  private createPlatform(name: string, x: number, y: number, width: number, height: number): void {
    if (!this.gameLayer) {
      return;
    }
    const platform = this.createGraphicsNode(name, this.gameLayer, width, height + 70, new Color(0, 0, 0, 0));
    platform.setPosition(new Vec3(x, y, 6));
    this.createStaticBox(platform, width, height, 0.92);
    const platformGraphics = platform.getComponent(Graphics) ?? platform.addComponent(Graphics);
    platformGraphics.clear();
    platformGraphics.fillColor = new Color(154, 161, 168, 255);
    platformGraphics.roundRect(-width / 2 + 8, -height / 2 + 2, width, height, 12);
    platformGraphics.fill();
    platformGraphics.fillColor = new Color(191, 195, 200, 255);
    platformGraphics.roundRect(-width / 2, -height / 2 + 12, width, height, 12);
    platformGraphics.fill();
    platformGraphics.fillColor = new Color(154, 161, 168, 255);
    platformGraphics.fillRect(-width / 2, -height / 2 - 34, width, 58);
    platformGraphics.fillColor = new Color(226, 229, 232, 255);
    platformGraphics.fillRect(-width / 2, height / 2 - 10, width, 16);
    platformGraphics.fillColor = new Color(130, 138, 146, 255);
    platformGraphics.fillRect(-width / 2, height / 2 - 25, width, 5);
    platformGraphics.strokeColor = new Color(126, 132, 139, 255);
    platformGraphics.lineWidth = 3;
    for (let px = -width / 2 + 34; px < width / 2; px += 42) {
      platformGraphics.moveTo(px, -height / 2 - 28);
      platformGraphics.lineTo(px + 18, -height / 2 + 12);
    }
    platformGraphics.stroke();
    platformGraphics.strokeColor = new Color(174, 179, 184, 255);
    platformGraphics.lineWidth = 1;
    for (let py = -height / 2 - 20; py < height / 2 - 28; py += 22) {
      platformGraphics.moveTo(-width / 2 + 12, py);
      platformGraphics.lineTo(width / 2 - 12, py);
    }
    platformGraphics.stroke();

    const road = this.createGraphicsNode(`${name}Road`, platform, width, 24, new Color(98, 101, 108, 255));
    road.setPosition(new Vec3(0, height / 2 - 12, 1));
    const grass = this.createGraphicsNode(`${name}Grass`, platform, width, 18, new Color(88, 178, 102, 255));
    grass.setPosition(new Vec3(0, height / 2 + 8, 2));
  }

  private createRoadStrip(name: string, x: number, y: number, width: number, height: number): void {
    if (!this.gameLayer) {
      return;
    }
    const strip = this.createGraphicsNode(name, this.gameLayer, width, height + 16, new Color(0, 0, 0, 0));
    strip.setPosition(new Vec3(x, y, 8));
    const graphics = strip.getComponent(Graphics) ?? strip.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(61, 67, 76, 255);
    graphics.fillRect(-width / 2, -height / 2, width, height);
    graphics.fillColor = new Color(89, 96, 107, 255);
    graphics.fillRect(-width / 2, height / 2 - 5, width, 5);
    graphics.fillColor = new Color(242, 242, 242, 235);
    for (let px = -width / 2 + 28; px < width / 2 - 20; px += 70) {
      graphics.fillRect(px, -2, 34, 3);
    }
    graphics.strokeColor = new Color(201, 210, 219, 220);
    graphics.lineWidth = 3;
    graphics.moveTo(-width / 2, height / 2 + 5);
    graphics.lineTo(width / 2, height / 2 + 5);
    graphics.stroke();
    graphics.lineWidth = 2;
    for (let px = -width / 2 + 18; px < width / 2; px += 34) {
      graphics.moveTo(px, height / 2 - 3);
      graphics.lineTo(px, height / 2 + 11);
    }
    graphics.stroke();
  }

  private createBridgeApproach(name: string, x: number, y: number, width: number, height: number): void {
    if (!this.gameLayer) {
      return;
    }
    const visualHeight = 82;
    const approach = this.createGraphicsNode(name, this.gameLayer, width, visualHeight, new Color(0, 0, 0, 0));
    approach.setPosition(new Vec3(x, y, 14));
    this.createStaticBox(approach, width, Math.max(height, DRIVE_DECK_COLLIDER_THICKNESS), 1);
    const graphics = approach.getComponent(Graphics) ?? approach.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(151, 158, 166, 255);
    graphics.roundRect(-width / 2 + 4, -visualHeight / 2 + 4, width, visualHeight - 14, 8);
    graphics.fill();
    graphics.fillColor = new Color(191, 195, 200, 255);
    graphics.roundRect(-width / 2, -visualHeight / 2 + 12, width, visualHeight - 18, 8);
    graphics.fill();
    graphics.fillColor = new Color(226, 229, 232, 255);
    graphics.roundRect(-width / 2 - 5, -8, width + 10, 18, 5);
    graphics.fill();
    graphics.fillColor = new Color(68, 74, 85, 255);
    graphics.roundRect(-width / 2 - 3, 0, width + 6, 10, 3);
    graphics.fill();
    graphics.strokeColor = new Color(142, 148, 155, 255);
    graphics.lineWidth = 1.5;
    for (let px = -width / 2 + 12; px < width / 2; px += 18) {
      graphics.moveTo(px, -visualHeight / 2 + 18);
      graphics.lineTo(px, -15);
    }
    graphics.stroke();
  }

  private createBuildArea(level: LevelConfig): void {
    if (!this.gameLayer) {
      return;
    }
    const area = this.ensureNode('BuildAreaHint', this.gameLayer);
    const graphics = area.getComponent(Graphics) ?? area.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(184, 226, 255, 26);
    graphics.fillRect(this.buildAreaMinX, this.buildAreaMinY, this.buildAreaMaxX - this.buildAreaMinX, this.buildAreaMaxY - this.buildAreaMinY);
    graphics.strokeColor = new Color(255, 255, 255, GRID_MINOR_ALPHA);
    graphics.lineWidth = 1;
    for (let x = this.getFirstGridValue(this.buildAreaMinX, GRID_SIZE / 2, this.gridOriginX); x <= this.buildAreaMaxX; x += GRID_SIZE / 2) {
      graphics.moveTo(x, this.buildAreaMinY);
      graphics.lineTo(x, this.buildAreaMaxY);
    }
    for (let y = this.getFirstGridValue(this.buildAreaMinY, GRID_SIZE / 2, this.gridOriginY); y <= this.buildAreaMaxY; y += GRID_SIZE / 2) {
      graphics.moveTo(this.buildAreaMinX, y);
      graphics.lineTo(this.buildAreaMaxX, y);
    }
    graphics.stroke();
    graphics.strokeColor = new Color(255, 255, 255, GRID_MAJOR_ALPHA);
    graphics.lineWidth = 1.5;
    for (let x = this.getFirstGridValue(this.buildAreaMinX, GRID_SIZE, this.gridOriginX); x <= this.buildAreaMaxX; x += GRID_SIZE) {
      graphics.moveTo(x, this.buildAreaMinY);
      graphics.lineTo(x, this.buildAreaMaxY);
    }
    for (let y = this.getFirstGridValue(this.buildAreaMinY, GRID_SIZE, this.gridOriginY); y <= this.buildAreaMaxY; y += GRID_SIZE) {
      graphics.moveTo(this.buildAreaMinX, y);
      graphics.lineTo(this.buildAreaMaxX, y);
    }
    graphics.stroke();
    this.drawGridDots(graphics);
    this.drawTrussGuide(graphics);
    graphics.strokeColor = new Color(255, 255, 255, 166);
    graphics.lineWidth = 2;
    this.drawDashedLine(graphics, new Vec2(this.buildAreaMinX, this.buildAreaMaxY), new Vec2(this.buildAreaMaxX, this.buildAreaMaxY), 14, 9);
    this.drawDashedLine(graphics, new Vec2(this.buildAreaMaxX, this.buildAreaMaxY), new Vec2(this.buildAreaMaxX, this.buildAreaMinY), 14, 9);
    this.drawDashedLine(graphics, new Vec2(this.buildAreaMaxX, this.buildAreaMinY), new Vec2(this.buildAreaMinX, this.buildAreaMinY), 14, 9);
    this.drawDashedLine(graphics, new Vec2(this.buildAreaMinX, this.buildAreaMinY), new Vec2(this.buildAreaMinX, this.buildAreaMaxY), 14, 9);
    const label = this.createLabel('BuildAreaLabel', area, '可搭建桥梁区域', 22, new Color(255, 255, 255, 235), 240, 34);
    label.node.setPosition(new Vec3(0, this.buildAreaMaxY - 24, 1));
  }

  private createFlag(name: string, x: number, y: number, color: Color): void {
    if (!this.gameLayer) {
      return;
    }
    const flag = this.ensureNode(name, this.gameLayer);
    flag.setPosition(new Vec3(x, y, 12));
    const graphics = flag.getComponent(Graphics) ?? flag.addComponent(Graphics);
    graphics.clear();
    graphics.strokeColor = new Color(255, 255, 255, 255);
    graphics.lineWidth = 4;
    graphics.moveTo(0, -38);
    graphics.lineTo(0, 36);
    graphics.stroke();
    graphics.fillColor = color;
    graphics.fillRect(0, 10, 46, 28);
  }

  private createMarkerLayer(): void {
    if (!this.ensureCoreLayers() || !this.isNodeUsable(this.bridgeLayer)) {
      return;
    }
    this.markerNode = this.ensureNode('BridgeNodeMarkers', this.bridgeLayer);
    this.markerNode.setPosition(new Vec3(0, 0, 45));
    this.ensureTransform(this.markerNode, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.markerGraphics = this.markerNode.getComponent(Graphics) ?? this.markerNode.addComponent(Graphics);
    this.setGraphicsFillColor(this.markerGraphics, new Color(255, 255, 255, 255));
    this.setGraphicsStrokeColor(this.markerGraphics, new Color(255, 255, 255, 255));
    this.bringBridgeEditLayersToFront();
  }

  private drawTrussGuide(graphics: Graphics): void {
    const level = this.getCurrentLevel();
    const topLeft = this.leftAnchor.clone();
    const topRight = this.rightAnchor.clone();
    const deckLeft = new Vec2(this.leftAnchor.x, this.leftAnchor.y - GRID_SIZE);
    const deckRight = new Vec2(this.rightAnchor.x, this.rightAnchor.y - GRID_SIZE);
    const centerTop = new Vec2(this.snapToGridValue(0, this.gridOriginX), Math.min(this.buildAreaMaxY - GRID_SIZE, Math.max(topLeft.y, topRight.y) + GRID_SIZE * 2));
    const centerDeck = new Vec2(centerTop.x, this.snapToGridValue((deckLeft.y + deckRight.y) / 2, this.gridOriginY));
    let guideLines: Vec2[][] = [];
    if (this.getGuideStyle(level) === 'wide') {
      const leftPeak = new Vec2(this.snapToGridValue(this.leftAnchor.x + GRID_SIZE * 3, this.gridOriginX), centerTop.y);
      const rightPeak = new Vec2(this.snapToGridValue(this.rightAnchor.x - GRID_SIZE * 3, this.gridOriginX), centerTop.y);
      guideLines = [
        [deckLeft, centerDeck],
        [centerDeck, deckRight],
        [topLeft, leftPeak],
        [leftPeak, centerDeck],
        [centerDeck, rightPeak],
        [rightPeak, topRight],
        [leftPeak, rightPeak],
      ];
    } else if (this.getGuideStyle(level) === 'slope') {
      const midA = new Vec2(this.snapToGridValue(-GRID_SIZE * 2, this.gridOriginX), this.snapToGridValue((topLeft.y + topRight.y) / 2 + GRID_SIZE, this.gridOriginY));
      const midB = new Vec2(this.snapToGridValue(GRID_SIZE * 2, this.gridOriginX), this.snapToGridValue((deckLeft.y + deckRight.y) / 2 - GRID_SIZE, this.gridOriginY));
      guideLines = [
        [topLeft, midA],
        [midA, topRight],
        [deckLeft, midB],
        [midB, deckRight],
        [deckLeft, midA],
        [midA, midB],
        [midB, topRight],
      ];
    } else {
      guideLines = [
        [deckLeft, centerDeck],
        [centerDeck, deckRight],
        [topLeft, centerTop],
        [centerTop, topRight],
        [deckLeft, centerTop],
        [centerTop, deckRight],
      ];
    }
    this.setGraphicsStrokeColor(graphics, new Color(255, 232, 118, 74));
    graphics.lineWidth = 2;
    guideLines.forEach(([start, end]: Vec2[]) => {
      this.drawDashedLine(graphics, start, end, 8, 10);
    });
    graphics.stroke();
  }

  private drawGridDots(graphics: Graphics): void {
    this.setGraphicsFillColor(graphics, new Color(255, 255, 255, 64));
    for (let x = this.getFirstGridValue(this.buildAreaMinX, GRID_SIZE, this.gridOriginX); x <= this.buildAreaMaxX; x += GRID_SIZE) {
      for (let y = this.getFirstGridValue(this.buildAreaMinY, GRID_SIZE, this.gridOriginY); y <= this.buildAreaMaxY; y += GRID_SIZE) {
        graphics.circle(x, y, 2);
      }
    }
    graphics.fill();
  }

  private createPreviewLayer(): void {
    if (!this.ensureCoreLayers() || !this.isNodeUsable(this.bridgeLayer)) {
      return;
    }
    this.previewNode = this.ensureNode('BridgePreviewLine', this.bridgeLayer);
    this.previewNode.setPosition(new Vec3(0, 0, 35));
    this.ensureTransform(this.previewNode, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.previewGraphics = this.previewNode.getComponent(Graphics) ?? this.previewNode.addComponent(Graphics);
    this.previewGraphics.clear();
    this.bringBridgeEditLayersToFront();
  }

  private onCanvasTouchStart(event: EventTouch): void {
    if (this.state !== 'BUILDING') {
      return;
    }
    const point = this.getLocalTouchPoint(event);
    if (!this.canHandleBuildInput(point)) {
      this.resetTouchInteraction();
      return;
    }
    const snapped = this.getSnappedPoint(point);
    this.updateSnapHighlight(snapped);
    this.touchStartPoint = snapped;
    this.touchStartHadSelection = !!this.selectedPoint;
    this.touchMovedForDrag = false;
    if (!this.selectedPoint) {
      this.selectedPoint = snapped;
      this.showToast('选择第二个格点');
      this.redrawMarkers();
    }
    this.updatePreviewLine(snapped);
  }

  private onCanvasTouchEnd(event: EventTouch): void {
    if (this.state !== 'BUILDING') {
      return;
    }
    const point = this.getLocalTouchPoint(event);
    if (!this.canHandleBuildInput(point)) {
      this.resetTouchInteraction();
      return;
    }
    const snapped = this.getSnappedPoint(point);
    this.updateSnapHighlight(snapped);
    if (!this.selectedPoint) {
      this.selectedPoint = snapped;
      this.showToast('选择第二个格点');
      this.redrawMarkers();
      this.updatePreviewLine(snapped);
      return;
    }
    const shouldCreate = this.touchStartHadSelection || this.touchMovedForDrag;
    if (shouldCreate) {
      const created = this.tryCreateSegment(this.selectedPoint, snapped);
      if (created) {
        this.selectedPoint = null;
        this.snapHighlightPoint = null;
        this.hidePreviewLine();
      } else {
        this.updatePreviewLine(snapped);
      }
    }
    this.resetTouchInteraction(false);
    this.redrawMarkers();
  }

  private onCanvasTouchMove(event: EventTouch): void {
    if (this.state !== 'BUILDING' || !this.selectedPoint) {
      return;
    }
    const point = this.getLocalTouchPoint(event);
    if (!this.canHandleBuildInput(point)) {
      this.hidePreviewLine();
      return;
    }
    const snapped = this.getSnappedPoint(point);
    this.updateSnapHighlight(snapped);
    if (this.touchStartPoint && Vec2.distance(this.touchStartPoint, snapped) > DRAG_CREATE_DISTANCE) {
      this.touchMovedForDrag = true;
    }
    this.updatePreviewLine(snapped);
  }

  private onCanvasTouchCancel(): void {
    this.resetTouchInteraction();
    this.snapHighlightPoint = null;
    this.redrawMarkers();
  }

  private tryCreateSegment(start: Vec2, end: Vec2): boolean {
    const canonicalStart = this.getCanonicalBuildPoint(start);
    const canonicalEnd = this.getCanonicalBuildPoint(end);
    const validation = this.validateSegment(canonicalStart, canonicalEnd);
    if (!validation.valid) {
      this.showToast(validation.message);
      return false;
    }
    const length = Vec2.distance(canonicalStart, canonicalEnd);
    const cost = this.getSegmentCost(length);
    const startBridgeNode = this.getOrCreateBridgeNode(canonicalStart, this.isPlatformAnchor(canonicalStart));
    const endBridgeNode = this.getOrCreateBridgeNode(canonicalEnd, this.isPlatformAnchor(canonicalEnd));
    const isDeck = this.isDeckSegment(startBridgeNode.point, endBridgeNode.point);
    const node = this.createBridgeSegmentNode(startBridgeNode.point, endBridgeNode.point, cost);
    if (!node) {
      this.showToast('创建杆件失败');
      return false;
    }
    const isSupport = !isDeck;
    this.budgetRemaining -= cost;
    this.segments.push({
      id: `Segment_${this.segmentSerial}`,
      startNodeId: startBridgeNode.id,
      endNodeId: endBridgeNode.id,
      start: startBridgeNode.point.clone(),
      end: endBridgeNode.point.clone(),
      cost,
      length,
      node,
      stress: 0,
      maxStress: this.getSegmentMaxStress(length, isDeck),
      isBroken: false,
      isDeck,
      isSupport,
      baseY: node.position.y,
    });
    this.refreshSnapPoints();
    this.showToast('点击或拖拽连接格点');
    this.refreshUI();
    return true;
  }

  private createBridgeSegmentNode(start: Vec2, end: Vec2, cost: number): Node | null {
    if (!this.ensureCoreLayers() || !this.isNodeUsable(this.bridgeLayer)) {
      console.warn('[SceneBootstrap] bridgeSegmentsLayer missing, cannot create bridge segment');
      return null;
    }
    const parent = this.bridgeLayer;
    const length = Vec2.distance(start, end);
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
    const isDriveDeck = Math.abs(angle) <= DRIVE_DECK_MAX_SLOPE;
    try {
      const node = this.getOrCreateNode(`BridgeSegment_${++this.segmentSerial}`, parent);
      node.setPosition(new Vec3(midX, midY, 10 + this.segments.length));
      node.angle = angle;
      this.ensureTransform(node, length, SEGMENT_VISUAL_HEIGHT);

      const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
      graphics.clear();
      this.drawBridgeSegmentGraphics(graphics, length, isDriveDeck);

      if (isDriveDeck) {
        this.createStaticBox(node, length, DRIVE_DECK_COLLIDER_THICKNESS, 1);
      } else {
        const collider = node.getComponent(BoxCollider2D);
        if (collider) {
          collider.destroy();
        }
        const body = node.getComponent(RigidBody2D);
        if (body) {
          body.destroy();
        }
      }
      const label = this.createLabel(`Cost_${cost}`, node, '', 1, new Color(255, 255, 255, 0), 1, 1);
      label.node.active = false;
      this.bringBridgeEditLayersToFront();
      return node;
    } catch (error) {
      console.warn('[SceneBootstrap] createBridgeSegmentNode failed', error);
      return null;
    }
  }

  private drawBridgeSegmentGraphics(graphics: Graphics, length: number, isDeck: boolean, stressRatio = 0): void {
    const left = -length / 2;
    const right = length / 2;
    const braceStep = Math.max(28, Math.min(42, length / Math.max(2, Math.ceil(length / 40))));
    const clampedStress = Math.min(1, Math.max(0, stressRatio));
    const trussColor = this.getStressColor(clampedStress);
    const trussEdgeColor = clampedStress >= this.gameplayConfig.stressVisual.dangerThreshold
      ? colorFromHex(this.gameplayConfig.stressVisual.dangerColor)
      : new Color(216, 158, 20, 255);
    const trussHighlightColor = clampedStress >= this.gameplayConfig.stressVisual.highThreshold
      ? new Color(255, 196, 110, 255)
      : new Color(255, 232, 110, 255);

    if (!isDeck) {
      this.setGraphicsStrokeColor(graphics, new Color(78, 60, 28, 230));
      graphics.lineWidth = 7;
      graphics.moveTo(left, 0);
      graphics.lineTo(right, 0);
      graphics.stroke();

      this.setGraphicsStrokeColor(graphics, trussEdgeColor);
      graphics.lineWidth = 5;
      graphics.moveTo(left, 0);
      graphics.lineTo(right, 0);
      graphics.stroke();

      this.setGraphicsStrokeColor(graphics, trussColor);
      graphics.lineWidth = 3.5;
      graphics.moveTo(left, 0);
      graphics.lineTo(right, 0);
      graphics.stroke();

      this.setGraphicsStrokeColor(graphics, trussHighlightColor);
      graphics.lineWidth = 1.4;
      graphics.moveTo(left + 4, -2);
      graphics.lineTo(right - 4, -2);
      graphics.stroke();

      const miniStep = Math.max(22, Math.min(32, length / Math.max(2, Math.ceil(length / 28))));
      this.setGraphicsStrokeColor(graphics, new Color(88, 65, 24, 180));
      graphics.lineWidth = 1.4;
      for (let x = left + miniStep; x < right - 4; x += miniStep) {
        graphics.moveTo(x - 8, -5);
        graphics.lineTo(x, 5);
        graphics.lineTo(x + 8, -5);
      }
      graphics.stroke();
      this.drawSegmentEndHub(graphics, left, 0, 5);
      this.drawSegmentEndHub(graphics, right, 0, 5);
      return;
    }

    const trussTop = -13;
    const trussBottom = -31;
    this.setGraphicsStrokeColor(graphics, new Color(78, 60, 28, 220));
    graphics.lineWidth = 7;
    graphics.moveTo(left, trussTop);
    graphics.lineTo(right, trussTop);
    graphics.moveTo(left, trussBottom);
    graphics.lineTo(right, trussBottom);
    graphics.stroke();

    this.setGraphicsStrokeColor(graphics, trussEdgeColor);
    graphics.lineWidth = 5;
    graphics.moveTo(left, trussTop);
    graphics.lineTo(right, trussTop);
    graphics.moveTo(left, trussBottom);
    graphics.lineTo(right, trussBottom);
    graphics.stroke();

    this.setGraphicsStrokeColor(graphics, trussColor);
    graphics.lineWidth = 3.5;
    graphics.moveTo(left, trussTop);
    graphics.lineTo(right, trussTop);
    graphics.moveTo(left, trussBottom);
    graphics.lineTo(right, trussBottom);
    for (let x = left; x < right - 1; x += braceStep) {
      const nextX = Math.min(x + braceStep, right);
      graphics.moveTo(x, trussBottom);
      graphics.lineTo(nextX, trussTop);
      graphics.lineTo(nextX, trussBottom);
    }
    graphics.stroke();

    this.setGraphicsStrokeColor(graphics, trussHighlightColor);
    graphics.lineWidth = 1.6;
    for (let x = left; x < right - 1; x += braceStep) {
      const nextX = Math.min(x + braceStep, right);
      graphics.moveTo(x + 3, trussBottom + 3);
      graphics.lineTo(nextX - 3, trussTop - 1);
    }
    graphics.stroke();

    const roadY = -7;
    const roadHeight = 20;
    const roadColor = clampedStress > this.gameplayConfig.stressVisual.dangerThreshold
      ? new Color(111, 74, 70, 255)
      : clampedStress > this.gameplayConfig.stressVisual.lowThreshold
        ? new Color(91, 82, 72, 255)
        : new Color(68, 74, 85, 255);
    this.setGraphicsFillColor(graphics, new Color(35, 39, 46, 175));
    graphics.roundRect(left - 2, roadY - 3, length + 4, roadHeight + 5, 5);
    graphics.fill();
    this.setGraphicsFillColor(graphics, roadColor);
    graphics.roundRect(left, roadY, length, roadHeight, 4);
    graphics.fill();
    this.setGraphicsFillColor(graphics, new Color(89, 96, 107, 255));
    graphics.fillRect(left, roadY + roadHeight - 4, length, 4);
    this.setGraphicsFillColor(graphics, new Color(242, 242, 242, 245));
    for (let x = left + 18; x < right - 12; x += 38) {
      graphics.fillRect(x, roadY + 9, 18, 3);
    }

    this.setGraphicsStrokeColor(graphics, new Color(201, 210, 219, 235));
    graphics.lineWidth = 2.5;
    graphics.moveTo(left + 4, roadY + roadHeight + 4);
    graphics.lineTo(right - 4, roadY + roadHeight + 4);
    graphics.stroke();
    graphics.lineWidth = 2;
    for (let x = left + 16; x < right; x += 32) {
      graphics.moveTo(x, roadY + roadHeight);
      graphics.lineTo(x, roadY + roadHeight + 9);
    }
    graphics.stroke();

    this.drawSegmentEndHub(graphics, left, 0, 7);
    this.drawSegmentEndHub(graphics, right, 0, 7);
  }

  private getStressColor(stressRatio: number): Color {
    const visual = this.gameplayConfig.stressVisual;
    if (!visual.enabled) {
      return colorFromHex(visual.normalColor);
    }
    if (stressRatio >= visual.dangerThreshold) {
      return colorFromHex(visual.dangerColor);
    }
    if (stressRatio >= visual.highThreshold) {
      return colorFromHex(visual.highStressColor);
    }
    if (stressRatio >= visual.lowThreshold) {
      return colorFromHex(visual.lowStressColor);
    }
    return colorFromHex(visual.normalColor);
  }

  private drawBrokenSegmentGraphics(graphics: Graphics, length: number, isDeck: boolean): void {
    const left = -length / 2;
    const right = length / 2;
    const mid = 0;
    const height = isDeck ? 22 : 12;
    this.setGraphicsStrokeColor(graphics, colorFromHex(this.gameplayConfig.stressVisual.brokenColor));
    graphics.lineWidth = isDeck ? 9 : 6;
    graphics.moveTo(left, -height / 2);
    graphics.lineTo(mid - 8, 0);
    graphics.moveTo(mid + 8, -2);
    graphics.lineTo(right, height / 2);
    graphics.stroke();
    this.setGraphicsStrokeColor(graphics, new Color(225, 74, 53, 255));
    graphics.lineWidth = isDeck ? 4 : 3;
    graphics.moveTo(left, -height / 2);
    graphics.lineTo(mid - 8, 0);
    graphics.moveTo(mid + 8, -2);
    graphics.lineTo(right, height / 2);
    graphics.stroke();
    this.drawSegmentEndHub(graphics, left, -height / 2, isDeck ? 7 : 5);
    this.drawSegmentEndHub(graphics, right, height / 2, isDeck ? 7 : 5);
  }

  private drawSegmentEndHub(graphics: Graphics, x: number, y: number, radius: number): void {
    this.setGraphicsFillColor(graphics, new Color(78, 50, 46, 190));
    graphics.circle(x + 1, y - 1, radius + 2);
    graphics.fill();
    this.setGraphicsFillColor(graphics, new Color(232, 76, 61, 255));
    graphics.circle(x, y, radius);
    graphics.fill();
    this.setGraphicsStrokeColor(graphics, new Color(255, 255, 255, 245));
    graphics.lineWidth = 1.5;
    graphics.circle(x, y, radius + 1.5);
    graphics.stroke();
  }

  private undoLastSegment(): void {
    if (this.state !== 'BUILDING') {
      return;
    }
    const segment = this.segments.pop();
    if (!segment) {
      this.showToast('没有可撤销的杆件');
      return;
    }
    this.budgetRemaining = Math.min(this.getCurrentLevel().budget, this.budgetRemaining + segment.cost);
    this.destroyNodeNow(segment.node);
    this.selectedPoint = null;
    this.resetTouchInteraction(false);
    this.hidePreviewLine();
    this.pruneUnusedBridgeNodes();
    this.refreshSnapPoints();
    this.redrawMarkers();
    this.showToast('已撤销');
    this.refreshUI();
  }

  private clearBridge(): void {
    if (this.state === 'TESTING') {
      return;
    }
    this.segments.forEach((segment: BridgeSegmentData) => this.destroyNodeNow(segment.node));
    this.segments.length = 0;
    this.resetBridgeNodesToAnchors();
    this.selectedPoint = null;
    this.resetTouchInteraction(false);
    this.budgetRemaining = this.getCurrentLevel().budget;
    this.destroyVehicleNodes();
    this.state = 'BUILDING';
    this.hideResultPopup();
    this.hidePreviewLine();
    this.refreshSnapPoints();
    this.redrawMarkers();
    this.showToast('已清空桥梁');
    this.refreshUI();
  }

  private startTest(): void {
    if (this.state !== 'BUILDING') {
      return;
    }
    const precheck = this.validateBeforeTest();
    if (precheck) {
      this.showFailureResult(precheck);
      this.showToast(this.getFailureMessage(precheck).message);
      return;
    }
    this.resetBridgeStress();
    this.breakCount = 0;
    this.vehiclesPassed = 0;
    this.vehicleSpawnCursor = 0;
    this.vehicleSpawnTimer = 0;
    this.buildVehicleQueue();
    this.state = 'TESTING';
    this.selectedPoint = null;
    this.resetTouchInteraction(false);
    this.hidePreviewLine();
    this.redrawMarkers();
    this.hideResultPopup();
    this.hideLevelObjective();
    if (!this.spawnNextVehicle()) {
      this.state = 'BUILDING';
      this.refreshUI();
      return;
    }
    this.showToast(this.segments.length > 0 ? '测试开始' : '没有桥梁，车辆会掉落');
    this.refreshUI();
  }

  private retryLevel(): void {
    this.destroyVehicleNodes();
    this.resetBridgeStress();
    this.levelManager?.restartCurrentLevel();
    this.breakCount = 0;
    this.maxSink = 0;
    this.vehiclesPassed = 0;
    this.vehicleSpawnCursor = 0;
    this.vehicleSpawnTimer = 0;
    this.vehicleQueue.length = 0;
    this.state = 'BUILDING';
    this.selectedPoint = null;
    this.resetTouchInteraction(false);
    this.hidePreviewLine();
    this.redrawMarkers();
    this.hideResultPopup();
    this.showToast('重新搭建');
    this.refreshUI();
  }

  private continueEditing(): void {
    if (this.state === 'TESTING') {
      this.destroyVehicleNodes();
      this.resetBridgeStress();
      this.state = 'BUILDING';
    }
    this.hideResultPopup();
    this.refreshUI();
  }

  private nextLevel(): void {
    if (this.state !== 'SUCCESS') {
      this.showToast('请先通过当前关');
      return;
    }
    if (!this.levelManager?.goNextLevel()) {
      this.showToast('已经是最后一关');
      return;
    }
    this.loadCurrentLevel();
  }

  private buildVehicleQueue(): void {
    this.vehicleQueue.length = 0;
    this.getCurrentLevel().vehicles.forEach((config: LevelVehicleConfig) => {
      const count = Math.max(1, Math.floor(config.count));
      for (let index = 0; index < count; index += 1) {
        this.vehicleQueue.push({ ...config, count: 1 });
      }
    });
    this.totalVehicles = this.vehicleQueue.length;
  }

  private validateBeforeTest(): FailureReason | null {
    if (this.segments.length <= 0) {
      return FailureReason.DeckNotConnected;
    }
    if (this.getUsedMaterial() > this.getCurrentLevel().budget) {
      return FailureReason.OverBudget;
    }
    if (!this.hasConnectedDeckPath()) {
      return FailureReason.DeckNotConnected;
    }
    return null;
  }

  private hasConnectedDeckPath(): boolean {
    const leftNode = this.findBridgeNodeNear(this.leftAnchor, NODE_DEDUPE_DISTANCE);
    const rightNode = this.findBridgeNodeNear(this.rightAnchor, NODE_DEDUPE_DISTANCE);
    if (!leftNode || !rightNode) {
      return false;
    }
    const adjacency = new Map<string, string[]>();
    this.segments.forEach((segment: BridgeSegmentData) => {
      if (!segment.isDeck || segment.isBroken) {
        return;
      }
      const startList = adjacency.get(segment.startNodeId) ?? [];
      startList.push(segment.endNodeId);
      adjacency.set(segment.startNodeId, startList);
      const endList = adjacency.get(segment.endNodeId) ?? [];
      endList.push(segment.startNodeId);
      adjacency.set(segment.endNodeId, endList);
    });
    const visited = new Set<string>();
    const queue: string[] = [leftNode.id];
    while (queue.length > 0) {
      const nodeId = queue.shift();
      if (!nodeId || visited.has(nodeId)) {
        continue;
      }
      if (nodeId === rightNode.id) {
        return true;
      }
      visited.add(nodeId);
      (adjacency.get(nodeId) ?? []).forEach((nextId: string) => {
        if (!visited.has(nextId)) {
          queue.push(nextId);
        }
      });
    }
    return false;
  }

  private spawnNextVehicle(): boolean {
    if (!this.ensureCoreLayers() || !this.isNodeUsable(this.vehicleLayer)) {
      console.warn('[SceneBootstrap] vehicleLayer missing, cannot spawn vehicle');
      this.showToast('车辆层级缺失');
      return false;
    }
    const config = this.vehicleQueue[this.vehicleSpawnCursor];
    if (!config) {
      return this.runtimeVehicles.length > 0;
    }
    try {
      const shape = this.getVehicleShape(config);
      const vehicleNode = this.getOrCreateNode(`Vehicle_${this.vehicleSpawnCursor + 1}`, this.vehicleLayer);
      vehicleNode.setPosition(new Vec3(this.startPoint.x, this.startPoint.y, 30));
      vehicleNode.angle = 0;
      this.ensureTransform(vehicleNode, shape.width, shape.height);
      this.drawVehicle(vehicleNode, config);

      const body = vehicleNode.getComponent(RigidBody2D) ?? vehicleNode.addComponent(RigidBody2D);
      body.type = ERigidBody2DType.Dynamic;
      body.gravityScale = 1;
      body.fixedRotation = true;
      body.linearDamping = 0.22;
      body.angularDamping = 4;
      body.bullet = true;

      const box = vehicleNode.getComponent(BoxCollider2D) ?? vehicleNode.addComponent(BoxCollider2D);
      box.size = new Size(shape.colliderWidth, shape.colliderHeight);
      box.friction = 1;
      box.restitution = 0.02;
      box.density = 1.1 * Math.max(0.5, config.weight);
      box.apply();

      this.runtimeVehicles.push({
        node: vehicleNode,
        body,
        config,
        lastX: vehicleNode.position.x,
        stuckTimer: 0,
      });
      this.vehicleSpawnCursor += 1;
      this.vehicleSpawnTimer = config.spawnInterval;
      return true;
    } catch (error) {
      console.warn('[SceneBootstrap] spawnNextVehicle failed', error);
      this.showToast('车辆生成失败');
      return false;
    }
  }

  private updateVehicle(deltaTime: number): void {
    if (this.vehicleSpawnCursor < this.vehicleQueue.length) {
      this.vehicleSpawnTimer -= deltaTime;
      if (this.vehicleSpawnTimer <= 0) {
        this.spawnNextVehicle();
      }
    }

    for (let index = this.runtimeVehicles.length - 1; index >= 0; index -= 1) {
      const vehicle = this.runtimeVehicles[index];
      if (!this.isNodeUsable(vehicle.node)) {
        this.runtimeVehicles.splice(index, 1);
        continue;
      }
      const pos = vehicle.node.position;
      vehicle.body.linearVelocity = new Vec2(vehicle.config.speed, vehicle.body.linearVelocity.y);
      this.updateBridgeStress(pos, deltaTime, vehicle.config);
      if (this.maxSink >= this.getDeckSinkForVehicle(vehicle.config.type) + 6) {
        this.finishFailed(FailureReason.DeckSinkTooMuch);
        return;
      }

      if (pos.x >= this.finishX) {
        this.vehiclesPassed += 1;
        this.destroyNodeNow(vehicle.node);
        this.runtimeVehicles.splice(index, 1);
        continue;
      }
      if (pos.y < FALL_Y || pos.x < -720 || pos.x > 760) {
        this.finishFailed(FailureReason.VehicleFell);
        return;
      }
      if (Math.abs(pos.x - vehicle.lastX) < 3) {
        vehicle.stuckTimer += deltaTime;
      } else {
        vehicle.stuckTimer = 0;
        vehicle.lastX = pos.x;
      }
      if (vehicle.stuckTimer > 5) {
        this.finishFailed(FailureReason.VehicleNotPassed);
        return;
      }
    }

    if (this.vehiclesPassed >= this.totalVehicles && this.totalVehicles > 0) {
      this.finishSuccess();
      return;
    }

    if (this.runtimeVehicles.length === 0 && this.vehicleSpawnCursor >= this.vehicleQueue.length) {
      this.finishFailed(FailureReason.VehicleNotPassed);
    }
  }

  private finishSuccess(): void {
    if (this.state !== 'TESTING') {
      return;
    }
    const result: LevelResult = {
      allVehiclesPass: this.vehiclesPassed >= this.totalVehicles,
      breakCount: this.breakCount,
      usedCost: this.getUsedMaterial(),
    };
    if (result.breakCount > this.getCurrentLevel().successCondition.maxBreakCount) {
      this.finishFailed(FailureReason.SegmentBroken);
      return;
    }
    const stars = this.levelManager?.completeCurrentLevel(result) ?? this.calculateStars(result);
    this.state = 'SUCCESS';
    this.stopVehicles();
    this.showSuccessResult(stars);
    this.showToast(`通关成功，获得 ${stars} 星`);
    this.refreshUI();
  }

  private finishFailed(reason: FailureReason): void {
    if (this.state !== 'TESTING') {
      return;
    }
    this.state = 'FAILED';
    this.stopVehicles();
    this.showFailureResult(reason);
    this.showToast(this.getFailureMessage(reason).message);
    this.refreshUI();
  }

  private failBridgeOverload(): void {
    if (this.state !== 'TESTING') {
      return;
    }
    this.state = 'FAILED';
    this.stopVehicles();
    this.showFailureResult(FailureReason.SegmentBroken);
    this.showToast('部分杆件受力过高');
    this.refreshUI();
  }

  private updateBridgeStress(vehiclePos: Readonly<Vec3>, deltaTime: number, vehicleConfig: LevelVehicleConfig): void {
    let overloaded = false;
    this.segments.forEach((segment: BridgeSegmentData) => {
      if (segment.isBroken || !this.isNodeUsable(segment.node)) {
        return;
      }
      const targetStress = this.getTargetStressForVehicle(segment, vehiclePos, vehicleConfig);
      segment.stress += (targetStress - segment.stress) * Math.min(1, deltaTime * 5);
      const stressRatio = segment.maxStress <= 0 ? 0 : segment.stress / segment.maxStress;
      this.applySegmentStressVisual(segment, stressRatio, vehicleConfig.type);
      if (stressRatio >= STRESS_BREAK_RATIO) {
        this.breakBridgeSegment(segment);
        overloaded = true;
      }
    });
    if (overloaded && this.breakCount > this.getCurrentLevel().successCondition.maxBreakCount) {
      this.failBridgeOverload();
    }
  }

  private isVehicleOnDeckSegment(vehiclePos: Readonly<Vec3>, segment: BridgeSegmentData): boolean {
    const minX = Math.min(segment.start.x, segment.end.x) - 18;
    const maxX = Math.max(segment.start.x, segment.end.x) + 18;
    return vehiclePos.x >= minX && vehiclePos.x <= maxX && vehiclePos.y > segment.baseY - 46 && vehiclePos.y < segment.baseY + 62;
  }

  private getTargetStressForVehicle(segment: BridgeSegmentData, vehiclePos: Readonly<Vec3>, vehicleConfig: LevelVehicleConfig): number {
    if (segment.isDeck && this.isVehicleOnDeckSegment(vehiclePos, segment)) {
      return this.calculateDeckStress(segment, vehicleConfig.weight);
    }
    if (segment.isSupport && this.isSupportNearVehicle(segment, vehiclePos)) {
      const supportFactor = this.isSupportConnectedToDeck(segment) ? 1 : 0.55;
      return Math.max(0, 18 + segment.length * 0.16 + vehicleConfig.weight * 20 * supportFactor);
    }
    return 0;
  }

  private isSupportNearVehicle(segment: BridgeSegmentData, vehiclePos: Readonly<Vec3>): boolean {
    const minX = Math.min(segment.start.x, segment.end.x) - 30;
    const maxX = Math.max(segment.start.x, segment.end.x) + 30;
    return vehiclePos.x >= minX && vehiclePos.x <= maxX && vehiclePos.y > Math.min(segment.start.y, segment.end.y) - 20;
  }

  private isSupportConnectedToDeck(segment: BridgeSegmentData): boolean {
    return this.segments.some((candidate: BridgeSegmentData) => {
      if (!candidate.isDeck || candidate.isBroken) {
        return false;
      }
      return candidate.startNodeId === segment.startNodeId
        || candidate.startNodeId === segment.endNodeId
        || candidate.endNodeId === segment.startNodeId
        || candidate.endNodeId === segment.endNodeId;
    });
  }

  private calculateDeckStress(segment: BridgeSegmentData, vehicleWeight: number): number {
    const unsupportedEnds = [segment.startNodeId, segment.endNodeId].filter((nodeId: string) => !this.isNodeSupported(nodeId)).length;
    const supportCount = this.getSupportCountForSegment(segment);
    const lengthStress = segment.length * 0.28;
    const unsupportedStress = unsupportedEnds * 34;
    const supportRelief = supportCount * 22;
    const weightStress = 34 * Math.max(0.5, vehicleWeight - 1);
    return Math.max(0, 46 + lengthStress + unsupportedStress + weightStress - supportRelief);
  }

  private isNodeSupported(nodeId: string): boolean {
    const node = this.bridgeNodes.find((bridgeNode: BridgeNodeData) => bridgeNode.id === nodeId);
    if (!node) {
      return false;
    }
    if (node.isAnchor) {
      return true;
    }
    return this.segments.some((segment: BridgeSegmentData) => {
      if (!segment.isSupport || segment.isBroken) {
        return false;
      }
      if (segment.startNodeId !== nodeId && segment.endNodeId !== nodeId) {
        return false;
      }
      const otherPoint = segment.startNodeId === nodeId ? segment.end : segment.start;
      return otherPoint.y < node.point.y - 16 || this.isPlatformAnchor(otherPoint);
    });
  }

  private getSupportCountForSegment(deckSegment: BridgeSegmentData): number {
    return this.segments.reduce((count: number, segment: BridgeSegmentData) => {
      if (!segment.isSupport || segment.isBroken) {
        return count;
      }
      const touchesDeck = segment.startNodeId === deckSegment.startNodeId
        || segment.startNodeId === deckSegment.endNodeId
        || segment.endNodeId === deckSegment.startNodeId
        || segment.endNodeId === deckSegment.endNodeId;
      return touchesDeck ? count + 1 : count;
    }, 0);
  }

  private applySegmentStressVisual(segment: BridgeSegmentData, stressRatio: number, vehicleType: LevelVehicleConfig['type'] = 'car'): void {
    const clamped = Math.min(1.35, Math.max(0, stressRatio));
    const maxDeckSink = this.getDeckSinkForVehicle(vehicleType);
    const sag = this.gameplayConfig.deckFeedback.enabled
      ? segment.isDeck
        ? Math.min(maxDeckSink + 8, clamped * clamped * maxDeckSink)
        : Math.min(6, clamped * 4)
      : 0;
    const shake = this.gameplayConfig.deckFeedback.shakeOnDanger && clamped >= this.gameplayConfig.stressVisual.dangerThreshold
      ? Math.sin(Date.now() / 55 + segment.length) * this.gameplayConfig.deckFeedback.shakeAmplitude
      : 0;
    this.maxSink = Math.max(this.maxSink, Math.abs(sag));
    const baseX = (segment.start.x + segment.end.x) / 2;
    segment.node.setPosition(new Vec3(baseX + shake, segment.baseY - sag, segment.node.position.z));
    const graphics = segment.node.getComponent(Graphics);
    if (!graphics) {
      return;
    }
    graphics.clear();
    this.drawBridgeSegmentGraphics(graphics, segment.length, segment.isDeck, clamped);
  }

  private getDeckSinkForVehicle(type: LevelVehicleConfig['type']): number {
    if (type === 'truck') {
      return this.gameplayConfig.deckFeedback.truckSink;
    }
    if (type === 'bus') {
      return this.gameplayConfig.deckFeedback.busSink;
    }
    if (type === 'heavyTruck') {
      return this.gameplayConfig.deckFeedback.heavyTruckSink;
    }
    return this.gameplayConfig.deckFeedback.carSink;
  }

  private breakBridgeSegment(segment: BridgeSegmentData): void {
    if (segment.isBroken) {
      return;
    }
    segment.isBroken = true;
    this.breakCount += 1;
    segment.node.angle += segment.end.y >= segment.start.y ? -7 : 7;
    segment.node.setPosition(new Vec3(segment.node.position.x, segment.node.position.y - 18, segment.node.position.z));
    const collider = segment.node.getComponent(BoxCollider2D);
    if (collider) {
      collider.destroy();
    }
    const body = segment.node.getComponent(RigidBody2D);
    if (body) {
      body.destroy();
    }
    const graphics = segment.node.getComponent(Graphics);
    if (graphics) {
      graphics.clear();
      this.drawBrokenSegmentGraphics(graphics, segment.length, segment.isDeck);
    }
  }

  private resetBridgeStress(): void {
    this.segments.forEach((segment: BridgeSegmentData) => {
      segment.stress = 0;
      segment.isBroken = false;
      if (this.isNodeUsable(segment.node)) {
        segment.node.angle = Math.atan2(segment.end.y - segment.start.y, segment.end.x - segment.start.x) * 180 / Math.PI;
        const baseX = (segment.start.x + segment.end.x) / 2;
        segment.node.setPosition(new Vec3(baseX, segment.baseY, segment.node.position.z));
        const graphics = segment.node.getComponent(Graphics);
        if (graphics) {
          graphics.clear();
          this.drawBridgeSegmentGraphics(graphics, segment.length, segment.isDeck, 0);
        }
        if (segment.isDeck) {
          this.createStaticBox(segment.node, segment.length, DRIVE_DECK_COLLIDER_THICKNESS, 1);
        }
      }
    });
  }

  private stopVehicles(): void {
    this.runtimeVehicles.forEach((vehicle: VehicleRuntime) => {
      vehicle.body.linearVelocity = new Vec2(0, 0);
      vehicle.body.angularVelocity = 0;
    });
  }

  private destroyVehicle(): void {
    this.runtimeVehicles.forEach((vehicle: VehicleRuntime) => {
      if (this.isNodeUsable(vehicle.node)) {
        this.destroyNodeNow(vehicle.node);
      }
    });
    this.runtimeVehicles.length = 0;
    if (this.carGraphics) {
      this.carGraphics = null;
    }
  }

  private destroyVehicleNodes(): void {
    if (!this.isNodeUsable(this.vehicleLayer)) {
      return;
    }
    this.vehicleLayer.children
      .filter((child: Node) => child.name.startsWith('Vehicle'))
      .forEach((child: Node) => this.destroyNodeNow(child));
    this.runtimeVehicles.length = 0;
    this.carGraphics = null;
  }

  private refreshSnapPoints(): void {
    this.snapPoints.length = 0;
    this.bridgeNodes.forEach((bridgeNode: BridgeNodeData) => this.addSnapPoint(bridgeNode.point));
  }

  private addSnapPoint(point: Vec2): void {
    const exists = this.snapPoints.some((existing: Vec2) => Vec2.distance(existing, point) < 1);
    if (!exists) {
      this.snapPoints.push(point.clone());
    }
  }

  private redrawMarkers(): void {
    if (!this.isNodeUsable(this.markerNode)) {
      this.createMarkerLayer();
    }
    if (!this.isNodeUsable(this.markerNode)) {
      return;
    }
    const graphics = this.markerNode.getComponent(Graphics) ?? this.markerNode.addComponent(Graphics);
    this.markerGraphics = graphics;
    graphics.clear();
    this.snapPoints.forEach((point: Vec2) => {
      const bridgeNode = this.findBridgeNodeNear(point, 1);
      const isPlatformAnchor = bridgeNode?.isAnchor ?? this.isPlatformAnchor(point);
      const radius = isPlatformAnchor ? 10 : 7;
      const outlineRadius = isPlatformAnchor ? 13 : 9.5;
      this.setGraphicsFillColor(graphics, new Color(232, 76, 61, 255));
      graphics.circle(point.x, point.y, radius);
      graphics.fill();
      this.setGraphicsStrokeColor(graphics, new Color(255, 255, 255, 245));
      graphics.lineWidth = 2;
      graphics.circle(point.x, point.y, outlineRadius);
      graphics.stroke();
    });
    if (this.selectedPoint) {
      this.setGraphicsFillColor(graphics, new Color(255, 210, 66, 255));
      graphics.circle(this.selectedPoint.x, this.selectedPoint.y, 9);
      graphics.fill();
      this.setGraphicsStrokeColor(graphics, new Color(80, 180, 255, 235));
      graphics.lineWidth = 3;
      graphics.circle(this.selectedPoint.x, this.selectedPoint.y, 15);
      graphics.stroke();
    }
    if (this.snapHighlightPoint && this.gameplayConfig.snap.showSnapHighlight) {
      this.setGraphicsStrokeColor(graphics, colorFromHex(this.gameplayConfig.snap.highlightColor, 245));
      graphics.lineWidth = 4;
      graphics.circle(this.snapHighlightPoint.x, this.snapHighlightPoint.y, 18);
      graphics.stroke();
      this.setGraphicsFillColor(graphics, colorFromHex(this.gameplayConfig.snap.highlightColor, 90));
      graphics.circle(this.snapHighlightPoint.x, this.snapHighlightPoint.y, 11);
      graphics.fill();
    }
  }

  private updatePreviewLine(endPoint: Vec2): void {
    if (!this.selectedPoint) {
      this.hidePreviewLine();
      return;
    }
    if (!this.previewNode || !this.isNodeUsable(this.previewNode)) {
      this.createPreviewLayer();
    }
    if (!this.previewNode || !this.isNodeUsable(this.previewNode)) {
      return;
    }
    const graphics = this.previewNode.getComponent(Graphics) ?? this.previewNode.addComponent(Graphics);
    this.previewGraphics = graphics;
    graphics.clear();
    const start = this.getCanonicalBuildPoint(this.selectedPoint);
    const end = this.getCanonicalBuildPoint(endPoint);
    if (Vec2.distance(start, end) < 1) {
      return;
    }
    const validation = this.validateSegment(start, end);
    const previewColor = validation.valid
      ? validation.warning
        ? colorFromHex(this.gameplayConfig.buildPreview.warningColor, 225)
        : colorFromHex(this.gameplayConfig.buildPreview.validColor, 225)
      : colorFromHex(this.gameplayConfig.buildPreview.invalidColor, 225);
    this.setGraphicsStrokeColor(graphics, previewColor);
    graphics.lineWidth = this.gameplayConfig.buildPreview.lineWidth;
    graphics.moveTo(start.x, start.y);
    graphics.lineTo(end.x, end.y);
    graphics.stroke();
    this.setGraphicsStrokeColor(graphics, validation.valid ? new Color(255, 255, 255, 180) : new Color(255, 225, 220, 180));
    graphics.lineWidth = 2;
    graphics.moveTo(start.x, start.y);
    graphics.lineTo(end.x, end.y);
    graphics.stroke();
    if (this.hintLabel && validation.message) {
      this.hintLabel.string = validation.message;
    }
  }

  private hidePreviewLine(): void {
    if (this.previewGraphics) {
      this.previewGraphics.clear();
    }
  }

  private resetTouchInteraction(clearSelected = true): void {
    this.touchStartPoint = null;
    this.touchStartHadSelection = false;
    this.touchMovedForDrag = false;
    if (clearSelected) {
      this.selectedPoint = null;
      this.snapHighlightPoint = null;
      this.hidePreviewLine();
    }
  }

  private bringBridgeEditLayersToFront(): void {
    if (!this.isNodeUsable(this.bridgeLayer)) {
      return;
    }
    if (this.isNodeUsable(this.previewNode)) {
      this.previewNode.setSiblingIndex(this.bridgeLayer.children.length - 1);
    }
    if (this.isNodeUsable(this.markerNode)) {
      this.markerNode.setSiblingIndex(this.bridgeLayer.children.length - 1);
    }
  }

  private bringGameplayOverlayLayersToFront(): void {
    if (!this.isNodeUsable(this.gameLayer)) {
      return;
    }
    if (this.isNodeUsable(this.bridgeLayer)) {
      this.bridgeLayer.setSiblingIndex(this.gameLayer.children.length - 1);
    }
    if (this.isNodeUsable(this.anchorLayer)) {
      this.anchorLayer.setSiblingIndex(this.gameLayer.children.length - 1);
    }
    if (this.isNodeUsable(this.vehicleLayer)) {
      this.vehicleLayer.setSiblingIndex(this.gameLayer.children.length - 1);
    }
  }

  private refreshUI(): void {
    if (this.titleLabel) {
      this.titleLabel.string = '桥梁大亨';
    }
    if (this.levelLabel) {
      const level = this.getCurrentLevel();
      this.levelLabel.string = `关卡：第 ${level.level} 关 ${level.name}`;
    }
    if (this.budgetLabel) {
      this.budgetLabel.string = `预算剩余：${this.budgetRemaining}`;
    }
    if (this.usedMaterialLabel) {
      this.usedMaterialLabel.string = `已用材料：${this.getUsedMaterial()}`;
    }
    if (this.modeLabel) {
      this.modeLabel.string = `当前模式：${this.getModeText()}`;
    }
    if (this.hintLabel) {
      this.hintLabel.string = this.getHintText();
    }
    this.updateButtonVisibility();
  }

  private updateButtonVisibility(): void {
    this.setButtonEnabled(this.startTestButton, this.state === 'BUILDING', new Color(101, 185, 62, 255));
    this.setButtonEnabled(this.undoButton, this.state === 'BUILDING' && this.segments.length > 0, new Color(245, 185, 59, 255));
    this.setButtonEnabled(this.clearButton, (this.state === 'BUILDING' || this.state === 'FAILED') && this.segments.length > 0, new Color(240, 100, 50, 255));
    this.setButtonEnabled(this.retryButton, this.state === 'TESTING' || this.state === 'SUCCESS' || this.state === 'FAILED', new Color(47, 133, 213, 255));
    this.setButtonEnabled(this.nextButton, this.state === 'SUCCESS', new Color(52, 73, 94, 255));
  }

  private createUI(): void {
    if (!this.uiRoot) {
      return;
    }
    this.clearLayer(this.uiRoot);
    this.uiBlockRects.length = 0;

    this.createTopHud();
    this.createHintRibbon();

    const bottomPanel = this.createGraphicsNode('BottomPanel', this.uiRoot, 1036, 96, new Color(0, 0, 0, 0));
    bottomPanel.setPosition(new Vec3(0, -302, 50));
    this.redrawPanel(bottomPanel, 1036, 96, new Color(8, 55, 95, 236), 18, new Color(27, 111, 165, 230), 4);
    this.addUiBlockRect(0, -302, 1080, 112);
    this.startTestButton = this.createButton('StartTestButton', this.uiRoot, '▶  开始测试', new Vec3(-410, -302, 51), new Color(101, 185, 62, 255), () => this.startTest());
    this.undoButton = this.createButton('UndoButton', this.uiRoot, '↶  撤销', new Vec3(-205, -302, 51), new Color(245, 185, 59, 255), () => this.undoLastSegment());
    this.clearButton = this.createButton('ClearButton', this.uiRoot, '清空', new Vec3(0, -302, 51), new Color(240, 100, 50, 255), () => this.clearBridge());
    this.retryButton = this.createButton('RetryButton', this.uiRoot, '↻  重试', new Vec3(205, -302, 51), new Color(47, 133, 213, 255), () => this.retryLevel());
    this.nextButton = this.createButton('NextButton', this.uiRoot, '»  下一关', new Vec3(410, -302, 51), new Color(52, 73, 94, 255), () => this.nextLevel());

    this.toastLabel = this.createLabel('ToastText', this.uiRoot, '', 30, new Color(255, 255, 255, 255), 620, 64);
    this.toastLabel.node.setPosition(new Vec3(0, 76, 60));
    this.toastLabel.node.active = false;

    this.resultPopup = this.createGraphicsNode('ResultPopup', this.uiRoot, 560, 270, new Color(22, 40, 58, 235));
    this.resultPopup.setPosition(new Vec3(0, 24, 70));
    this.resultTitleLabel = this.createLabel('ResultTitle', this.resultPopup, '', 36, new Color(255, 255, 255, 255), 500, 54);
    this.resultTitleLabel.node.setPosition(new Vec3(0, 82, 1));
    this.resultMessageLabel = this.createLabel('ResultMessage', this.resultPopup, '', 21, new Color(220, 240, 255, 255), 500, 118);
    this.resultMessageLabel.node.setPosition(new Vec3(0, -14, 1));
    this.createButton('ResultEditButton', this.resultPopup, '继续编辑', new Vec3(-108, -104, 1), new Color(47, 133, 213, 255), () => this.continueEditing());
    this.createButton('ResultRetryButton', this.resultPopup, '重试', new Vec3(108, -104, 1), new Color(245, 185, 59, 255), () => this.retryLevel());
    this.resultPopup.active = false;

    this.objectivePopup = this.createGraphicsNode('LevelObjectivePopup', this.uiRoot, 620, 300, new Color(18, 45, 66, 238));
    this.objectivePopup.setPosition(new Vec3(0, 12, 72));
    this.objectiveTitleLabel = this.createLabel('ObjectiveTitle', this.objectivePopup, '', 34, new Color(255, 255, 255, 255), 560, 56);
    this.objectiveTitleLabel.node.setPosition(new Vec3(0, 96, 1));
    this.objectiveMessageLabel = this.createLabel('ObjectiveMessage', this.objectivePopup, '', 22, new Color(222, 241, 255, 255), 540, 170);
    this.objectiveMessageLabel.horizontalAlign = HorizontalTextAlignment.LEFT;
    this.objectiveMessageLabel.node.setPosition(new Vec3(0, 10, 1));
    this.createButton('ObjectiveCloseButton', this.objectivePopup, '开始搭建', new Vec3(0, -110, 1), new Color(101, 185, 62, 255), () => this.hideLevelObjective());
    this.objectivePopup.active = false;
  }

  private createTopHud(): void {
    if (!this.uiRoot) {
      return;
    }
    const panel = this.createGraphicsNode('TopPanel', this.uiRoot, CANVAS_WIDTH, 104, new Color(0, 0, 0, 0));
    panel.setPosition(new Vec3(0, 310, 50));
    this.redrawPanel(panel, CANVAS_WIDTH, 104, new Color(8, 43, 79, 248), 22, new Color(20, 92, 145, 255), 4);
    this.addUiBlockRect(0, 310, CANVAS_WIDTH, 118);

    const icon = this.createGraphicsNode('BridgeIcon', this.uiRoot, 70, 70, new Color(0, 0, 0, 0));
    icon.setPosition(new Vec3(-560, 310, 52));
    this.drawBridgeHudIcon(icon);

    this.titleLabel = this.createLabel('TitleText', this.uiRoot, '桥梁大亨', 44, new Color(255, 255, 255, 255), 290, 62);
    this.titleLabel.isBold = true;
    this.titleLabel.node.setPosition(new Vec3(-410, 312, 52));

    const separator = this.createGraphicsNode('TopSeparator', this.uiRoot, 2, 60, new Color(255, 255, 255, 90));
    separator.setPosition(new Vec3(-245, 310, 52));

    this.levelLabel = this.createLabel('LevelText', this.uiRoot, '', 26, new Color(255, 255, 255, 255), 260, 44);
    this.levelLabel.isBold = true;
    this.levelLabel.node.setPosition(new Vec3(-90, 312, 52));
    this.budgetLabel = this.createLabel('BudgetText', this.uiRoot, '', 26, new Color(255, 217, 90, 255), 320, 44);
    this.budgetLabel.isBold = true;
    this.budgetLabel.node.setPosition(new Vec3(190, 312, 52));
    this.usedMaterialLabel = this.createLabel('UsedMaterialText', this.uiRoot, '', 26, new Color(255, 217, 90, 255), 320, 44);
    this.usedMaterialLabel.isBold = true;
    this.usedMaterialLabel.node.setPosition(new Vec3(470, 312, 52));

    const settings = this.createGraphicsNode('SettingsButtonVisual', this.uiRoot, 56, 56, new Color(0, 0, 0, 0));
    settings.setPosition(new Vec3(590, 310, 52));
    this.redrawPanel(settings, 56, 56, new Color(23, 65, 105, 210), 12, new Color(117, 170, 216, 170), 2);
    const gear = this.createLabel('GearIcon', settings, '⚙', 34, new Color(255, 255, 255, 245), 56, 56);
    gear.isBold = true;
  }

  private createHintRibbon(): void {
    if (!this.uiRoot) {
      return;
    }
    const ribbon = this.createGraphicsNode('HintRibbon', this.uiRoot, 430, 44, new Color(0, 0, 0, 0));
    ribbon.setPosition(new Vec3(0, 246, 51));
    this.redrawPanel(ribbon, 430, 44, new Color(11, 77, 136, 242), 10, new Color(57, 145, 218, 175), 2);
    this.addUiBlockRect(0, 246, 460, 54);
    this.hintLabel = this.createLabel('HintText', ribbon, '', 24, new Color(255, 255, 255, 255), 410, 38);
    this.hintLabel.isBold = true;
    this.modeLabel = this.createLabel('ModeText', this.uiRoot, '', 18, new Color(214, 236, 255, 230), 210, 28);
    this.modeLabel.node.setPosition(new Vec3(516, 246, 51));
  }

  private createButton(name: string, parent: Node, text: string, position: Vec3, color: Color, onClick: () => void): Node {
    const buttonNode = this.createGraphicsNode(name, parent, 184, 62, color);
    buttonNode.setPosition(position);
    this.redrawButton(buttonNode, 184, 62, color, true);
    const button = buttonNode.getComponent(Button) ?? buttonNode.addComponent(Button);
    button.interactable = true;
    buttonNode.off(Button.EventType.CLICK);
    buttonNode.on(Button.EventType.CLICK, onClick, this);
    const label = this.createLabel('Label', buttonNode, text, 26, new Color(255, 255, 255, 255), 184, 62);
    label.isBold = true;
    return buttonNode;
  }

  private drawVehicle(vehicleNode: Node, config: LevelVehicleConfig): void {
    const shape = this.getVehicleShape(config);
    const graphics = vehicleNode.getComponent(Graphics) ?? vehicleNode.addComponent(Graphics);
    this.carGraphics = graphics;
    graphics.clear();
    const halfWidth = shape.width / 2;
    const bodyWidth = shape.width - 10;
    const wheelOffset = Math.max(24, shape.width * 0.32);
    const bodyColor = this.getVehicleColor(config.type);
    graphics.fillColor = new Color(40, 44, 52, 70);
    graphics.roundRect(-halfWidth - 2, -shape.height / 2 - 4, shape.width + 4, 16, 8);
    graphics.fill();
    graphics.fillColor = bodyColor;
    graphics.roundRect(-bodyWidth / 2, -shape.height / 2 + 4, bodyWidth, shape.height - 8, 8);
    graphics.fill();
    graphics.fillColor = new Color(255, 204, 110, 255);
    if (config.type === 'truck' || config.type === 'heavyTruck') {
      graphics.roundRect(halfWidth - 36, 0, 22, 17, 4);
    } else if (config.type === 'bus') {
      for (let x = -halfWidth + 16; x < halfWidth - 24; x += 26) {
        graphics.roundRect(x, 2, 16, 14, 4);
      }
    } else {
      graphics.roundRect(-18, 3, 30, 17, 5);
    }
    graphics.fill();
    graphics.fillColor = new Color(32, 36, 42, 255);
    graphics.circle(-wheelOffset, -shape.height / 2, shape.wheelRadius);
    graphics.circle(wheelOffset, -shape.height / 2, shape.wheelRadius);
    graphics.fill();
  }

  private getVehicleShape(config: LevelVehicleConfig): { width: number; height: number; colliderWidth: number; colliderHeight: number; wheelRadius: number } {
    if (config.type === 'bus') {
      return { width: 112, height: 44, colliderWidth: 108, colliderHeight: 32, wheelRadius: 10 };
    }
    if (config.type === 'heavyTruck') {
      return { width: 104, height: 46, colliderWidth: 100, colliderHeight: 34, wheelRadius: 11 };
    }
    if (config.type === 'truck') {
      return { width: 94, height: 42, colliderWidth: 90, colliderHeight: 31, wheelRadius: 10 };
    }
    return { width: 78, height: 38, colliderWidth: 82, colliderHeight: 28, wheelRadius: 10 };
  }

  private getVehicleColor(type: LevelVehicleConfig['type']): Color {
    if (type === 'truck') {
      return new Color(235, 116, 52, 255);
    }
    if (type === 'heavyTruck') {
      return new Color(92, 101, 112, 255);
    }
    if (type === 'bus') {
      return new Color(245, 184, 56, 255);
    }
    return new Color(230, 67, 74, 255);
  }

  private createStaticBox(node: Node, width: number, height: number, friction: number): void {
    const body = node.getComponent(RigidBody2D) ?? node.addComponent(RigidBody2D);
    body.type = ERigidBody2DType.Static;
    const collider = node.getComponent(BoxCollider2D) ?? node.addComponent(BoxCollider2D);
    collider.size = new Size(width, height);
    collider.friction = friction;
    collider.restitution = 0.02;
    collider.apply();
  }

  private getLocalTouchPoint(event: EventTouch): Vec2 | null {
    const transform = this.node.getComponent(UITransform);
    if (!transform) {
      return null;
    }
    const uiPoint = event.getUILocation();
    const local = transform.convertToNodeSpaceAR(new Vec3(uiPoint.x, uiPoint.y, 0));
    return new Vec2(local.x, local.y);
  }

  private getSnappedPoint(point: Vec2): Vec2 {
    if (!this.gameplayConfig.snap.enabled) {
      return this.getNearestGridPoint(point);
    }
    let platformNearest: Vec2 | null = null;
    let platformDistance = this.gameplayConfig.snap.anchorSnapRadius;
    this.platformAnchorPoints.forEach((anchor: Vec2) => {
      const distance = Vec2.distance(point, anchor);
      if (distance < platformDistance) {
        platformDistance = distance;
        platformNearest = anchor;
      }
    });
    if (platformNearest) {
      return platformNearest.clone();
    }

    const bridgeNode = this.findBridgeNodeNear(point, this.gameplayConfig.snap.snapRadius);
    if (bridgeNode) {
      return bridgeNode.point.clone();
    }

    return this.getNearestGridPoint(point);
  }

  private updateSnapHighlight(point: Vec2): void {
    const anchor = this.platformAnchorPoints.find((candidate: Vec2) => Vec2.distance(candidate, point) < 2);
    const bridgeNode = this.findBridgeNodeNear(point, 2);
    this.snapHighlightPoint = anchor?.clone() ?? bridgeNode?.point.clone() ?? null;
    this.redrawMarkers();
  }

  private getCanonicalBuildPoint(point: Vec2): Vec2 {
    let platformNearest: Vec2 | null = null;
    let platformDistance = NODE_DEDUPE_DISTANCE;
    this.platformAnchorPoints.forEach((anchor: Vec2) => {
      const distance = Vec2.distance(point, anchor);
      if (distance < platformDistance) {
        platformDistance = distance;
        platformNearest = anchor;
      }
    });
    if (platformNearest) {
      return platformNearest.clone();
    }

    const existingNode = this.findBridgeNodeNear(point, NODE_DEDUPE_DISTANCE);
    if (existingNode) {
      return existingNode.point.clone();
    }
    return this.getNearestGridPoint(point);
  }

  private getNearestGridPoint(point: Vec2): Vec2 {
    const x = this.snapToGridValue(point.x, this.gridOriginX);
    const y = this.snapToGridValue(point.y, this.gridOriginY);
    return new Vec2(
      Math.min(this.buildAreaMaxX, Math.max(this.buildAreaMinX, x)),
      Math.min(this.buildAreaMaxY, Math.max(this.buildAreaMinY, y)),
    );
  }

  private snapToGridValue(value: number, origin: number): number {
    return origin + Math.round((value - origin) / GRID_SIZE) * GRID_SIZE;
  }

  private getOrCreateBridgeNode(point: Vec2, isAnchor: boolean): BridgeNodeData {
    const canonicalPoint = isAnchor ? point.clone() : this.getCanonicalBuildPoint(point);
    let existing = this.findBridgeNodeNear(canonicalPoint, NODE_DEDUPE_DISTANCE);
    if (!existing && isAnchor) {
      existing = this.bridgeNodes.find((bridgeNode: BridgeNodeData) => this.isSamePoint(bridgeNode.point, canonicalPoint)) ?? null;
    }
    if (existing) {
      existing.isAnchor = existing.isAnchor || isAnchor;
      return existing;
    }
    const bridgeNode: BridgeNodeData = {
      id: `Node_${++this.nodeSerial}`,
      x: canonicalPoint.x,
      y: canonicalPoint.y,
      point: canonicalPoint,
      isAnchor,
    };
    this.bridgeNodes.push(bridgeNode);
    return bridgeNode;
  }

  private findBridgeNodeNear(point: Vec2, distanceLimit: number): BridgeNodeData | null {
    let nearest: BridgeNodeData | null = null;
    let nearestDistance = distanceLimit;
    this.bridgeNodes.forEach((bridgeNode: BridgeNodeData) => {
      const distance = Vec2.distance(point, bridgeNode.point);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = bridgeNode;
      }
    });
    return nearest;
  }

  private resetBridgeNodesToAnchors(): void {
    this.bridgeNodes.length = 0;
    this.platformAnchorPoints.forEach((point: Vec2) => this.getOrCreateBridgeNode(point, true));
  }

  private pruneUnusedBridgeNodes(): void {
    const usedNodeIds = new Set<string>();
    this.segments.forEach((segment: BridgeSegmentData) => {
      usedNodeIds.add(segment.startNodeId);
      usedNodeIds.add(segment.endNodeId);
    });
    for (let index = this.bridgeNodes.length - 1; index >= 0; index -= 1) {
      const bridgeNode = this.bridgeNodes[index];
      if (!bridgeNode.isAnchor && !usedNodeIds.has(bridgeNode.id)) {
        this.bridgeNodes.splice(index, 1);
      }
    }
  }

  private isUiArea(point: Vec2): boolean {
    return this.isPointerInUIArea(point);
  }

  private isPointerInUIArea(point: Vec2): boolean {
    if (this.objectivePopup?.active || this.resultPopup?.active) {
      return true;
    }
    return point.y > 220 || point.y < -245 || this.isPointInUiBlock(point);
  }

  private isPointerInBuildArea(point: Vec2): boolean {
    if (this.isPointInBuildArea(point)) {
      return true;
    }
    return this.platformAnchorPoints.some((anchor: Vec2) => Vec2.distance(point, anchor) <= this.gameplayConfig.snap.anchorSnapRadius);
  }

  private canHandleBuildInput(point: Vec2 | null): point is Vec2 {
    if (this.state !== 'BUILDING' || !point) {
      return false;
    }
    if (this.isPointerInUIArea(point)) {
      return false;
    }
    return this.isPointerInBuildArea(point);
  }

  private getSegmentCost(length: number): number {
    return Math.max(1, Math.ceil(length / 10));
  }

  private isDeckSegment(start: Vec2, end: Vec2): boolean {
    const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
    return Math.abs(angle) <= DRIVE_DECK_MAX_SLOPE;
  }

  private getSegmentMaxStress(length: number, isDeck: boolean): number {
    const base = isDeck ? DECK_BASE_MAX_STRESS : SUPPORT_BASE_MAX_STRESS;
    const lengthPenalty = Math.max(0, length - GRID_SIZE * 2) * (isDeck ? 0.08 : 0.04);
    return Math.max(68, base - lengthPenalty);
  }

  private validateSegment(start: Vec2, end: Vec2): BuildValidationResult {
    const canonicalStart = this.getCanonicalBuildPoint(start);
    const canonicalEnd = this.getCanonicalBuildPoint(end);
    if (this.state !== 'BUILDING') {
      return this.createValidationResult(false, false, BuildInvalidReason.Testing, '测试中不能继续编辑');
    }
    if (!this.isPointInBuildArea(canonicalStart) || !this.isPointInBuildArea(canonicalEnd)) {
      return this.createValidationResult(false, false, BuildInvalidReason.OutOfBuildArea, '超出可搭建区域');
    }
    const startNode = this.findBridgeNodeNear(canonicalStart, NODE_DEDUPE_DISTANCE);
    const endNode = this.findBridgeNodeNear(canonicalEnd, NODE_DEDUPE_DISTANCE);
    if (startNode && endNode && startNode.id === endNode.id) {
      return this.createValidationResult(false, false, BuildInvalidReason.SameNode, '不能连接同一个节点');
    }
    const length = Vec2.distance(canonicalStart, canonicalEnd);
    if (length < this.gameplayConfig.buildPreview.minSegmentLength) {
      return this.createValidationResult(false, false, BuildInvalidReason.TooShort, '杆件太短');
    }
    if (length > this.gameplayConfig.buildPreview.maxSegmentLength) {
      return this.createValidationResult(false, false, BuildInvalidReason.TooLong, '杆件太长');
    }
    if (this.hasDuplicateSegment(canonicalStart, canonicalEnd)
      || (startNode && endNode && this.hasDuplicateSegmentByNode(startNode.id, endNode.id))) {
      return this.createValidationResult(false, false, BuildInvalidReason.DuplicateSegment, '这两个节点已经连接过');
    }
    if (this.budgetRemaining < this.getSegmentCost(length)) {
      return this.createValidationResult(false, false, BuildInvalidReason.NotEnoughBudget, '预算不足，无法建造');
    }
    const warning = length >= this.gameplayConfig.buildPreview.longSegmentWarningLength;
    return this.createValidationResult(true, warning, BuildInvalidReason.None, warning ? '杆件较长，成本较高' : '可以建造');
  }

  private createValidationResult(valid: boolean, warning: boolean, reason: BuildInvalidReason, message: string): BuildValidationResult {
    return { valid, warning, reason, message };
  }

  private updateToast(deltaTime: number): void {
    if (!this.toastLabel || !this.toastLabel.node.active) {
      return;
    }
    this.toastTimer -= deltaTime;
    if (this.toastTimer <= 0) {
      this.toastLabel.node.active = false;
    }
  }

  private showToast(message: string): void {
    if (!this.toastLabel) {
      console.log(`[SceneBootstrap] ${message}`);
      return;
    }
    this.toastLabel.string = message;
    this.toastLabel.node.active = true;
    this.toastTimer = 1.8;
  }

  private getCurrentLevel(): LevelConfig {
    return this.levelManager?.getCurrentLevel() ?? {
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
    };
  }

  private getModeText(): string {
    if (this.state === 'BUILDING') {
      return '搭建中';
    }
    if (this.state === 'TESTING') {
      return '测试中';
    }
    if (this.state === 'SUCCESS') {
      return '通关成功';
    }
    return '通关失败';
  }

  private getHintText(): string {
    if (this.state === 'BUILDING') {
      return this.selectedPoint ? '选择第二个格点' : this.getBuildHintText();
    }
    if (this.state === 'TESTING') {
      return `车辆正在通过桥梁（${this.vehiclesPassed}/${this.totalVehicles}）`;
    }
    if (this.state === 'SUCCESS') {
      return '通关成功，可以进入下一关';
    }
    return '通关失败，可以重试或重新搭建';
  }

  private getBuildHintText(): string {
    const level = this.getCurrentLevel();
    if (level.tips) {
      return level.tips;
    }
    if (this.getGuideStyle(level) === 'wide') {
      return '先横向连通桥面，再用双三角支撑';
    }
    if (this.getGuideStyle(level) === 'slope') {
      return '高差关：先铺可行驶桥面，再补斜撑';
    }
    return '先连通上方桥面，下面再搭三角支撑';
  }

  private getGuideStyle(level: LevelConfig): 'simple' | 'wide' | 'slope' {
    const left = level.anchorPoints[0];
    const right = level.anchorPoints[1];
    if (left && right && Math.abs(left.y - right.y) >= 24) {
      return 'slope';
    }
    if (level.spanWidth >= 460 || level.anchorPoints.length >= 4) {
      return 'wide';
    }
    return 'simple';
  }

  private calculateStars(result: LevelResult): number {
    if (!result.allVehiclesPass) {
      return 0;
    }
    const level = this.getCurrentLevel();
    if (result.breakCount > level.successCondition.maxBreakCount) {
      return 1;
    }
    return result.usedCost <= level.starCondition.threeStar.maxCost ? 3 : 2;
  }

  private isPointInBuildArea(point: Vec2): boolean {
    return point.x >= this.buildAreaMinX
      && point.x <= this.buildAreaMaxX
      && point.y >= this.buildAreaMinY
      && point.y <= this.buildAreaMaxY;
  }

  private hasDuplicateSegment(start: Vec2, end: Vec2): boolean {
    return this.segments.some((segment: BridgeSegmentData) => {
      return (this.isSamePoint(segment.start, start) && this.isSamePoint(segment.end, end))
        || (this.isSamePoint(segment.start, end) && this.isSamePoint(segment.end, start));
    });
  }

  private hasDuplicateSegmentByNode(startNodeId: string, endNodeId: string): boolean {
    return this.segments.some((segment: BridgeSegmentData) => {
      return (segment.startNodeId === startNodeId && segment.endNodeId === endNodeId)
        || (segment.startNodeId === endNodeId && segment.endNodeId === startNodeId);
    });
  }

  private isSamePoint(a: Vec2, b: Vec2): boolean {
    return Vec2.distance(a, b) < 2;
  }

  private getUsedMaterial(): number {
    return this.getCurrentLevel().budget - this.budgetRemaining;
  }

  private isPlatformAnchor(point: Vec2): boolean {
    return this.platformAnchorPoints.some((anchor: Vec2) => Vec2.distance(anchor, point) < 2);
  }

  private getFirstGridValue(minValue: number, spacing: number, origin: number): number {
    return origin + Math.ceil((minValue - origin) / spacing) * spacing;
  }

  private setButtonEnabled(node: Node | null, enabled: boolean, color: Color): void {
    if (!node) {
      return;
    }
    node.active = true;
    const button = node.getComponent(Button);
    if (button) {
      button.interactable = enabled;
    }
    this.redrawButton(node, 184, 62, enabled ? color : new Color(86, 102, 116, 255), enabled);
  }

  private showResultPopup(title: string, message: string, color: Color): void {
    if (!this.resultPopup || !this.resultTitleLabel || !this.resultMessageLabel) {
      return;
    }
    this.redrawRoundedRect(this.resultPopup, 560, 270, new Color(22, 40, 58, 238), 20);
    const graphics = this.resultPopup.getComponent(Graphics);
    if (graphics) {
      graphics.fillColor = color;
      graphics.roundRect(-230, 96, 460, 10, 5);
      graphics.fill();
    }
    this.resultTitleLabel.string = title;
    this.resultMessageLabel.string = message;
    this.resultPopup.active = true;
  }

  private showSuccessResult(stars: number): void {
    const result = this.createTestResult(true, FailureReason.None);
    const budget = Math.max(1, result.budget);
    const stability = Math.max(0, Math.round(100 - result.breakCount * 18 - result.maxSink * 3 - (result.usedCost / budget) * 10));
    this.showResultPopup(
      '通关成功！',
      [
        `星级：${'★'.repeat(stars)}${'☆'.repeat(Math.max(0, 3 - stars))}`,
        `用料：${result.usedCost} / ${result.budget}`,
        `桥梁稳定度：${stability}%`,
        `断裂数量：${result.breakCount}`,
        '按钮：重试刷星 / 下一关',
      ].join('\n'),
      new Color(92, 210, 132, 255),
    );
  }

  private showFailureResult(reason: FailureReason): void {
    const result = this.createTestResult(false, reason);
    const detail = this.getFailureMessage(reason);
    this.showResultPopup(
      '测试失败',
      [
        `失败原因：${detail.message}`,
        `优化建议：${detail.suggestion}`,
        `车辆：${result.passedVehicleCount} / ${result.totalVehicleCount}`,
        `断裂数量：${result.breakCount}`,
      ].join('\n'),
      new Color(255, 118, 106, 255),
    );
  }

  private createTestResult(success: boolean, failureReason: FailureReason): TestResult {
    return {
      success,
      failureReason,
      breakCount: this.breakCount,
      usedCost: this.getUsedMaterial(),
      budget: this.getCurrentLevel().budget,
      passedVehicleCount: this.vehiclesPassed,
      totalVehicleCount: Math.max(this.totalVehicles, this.getCurrentLevel().vehicles.reduce((count: number, vehicle: LevelVehicleConfig) => count + Math.max(1, Math.floor(vehicle.count)), 0)),
      maxSink: this.maxSink,
    };
  }

  private getFailureMessage(reason: FailureReason): { message: string; suggestion: string } {
    if (reason === FailureReason.DeckNotConnected) {
      return {
        message: '桥面没有完整连接，请先横向连通左右道路。',
        suggestion: '先搭一条连续桥面，再在下方增加三角支撑。',
      };
    }
    if (reason === FailureReason.DeckSinkTooMuch) {
      return {
        message: '桥梁中部下沉过大，建议增加三角支撑。',
        suggestion: '在桥面中部下方补斜撑，减少长杆悬空。',
      };
    }
    if (reason === FailureReason.SegmentBroken) {
      return {
        message: '部分杆件受力过高，建议减少长杆并增加斜撑。',
        suggestion: '把过长桥面拆成多段，并把端点连接到下方支点。',
      };
    }
    if (reason === FailureReason.OverBudget) {
      return {
        message: '预算不足，试试减少重复杆件或使用更短结构。',
        suggestion: '撤销多余杆件，优先保留关键桥面和三角结构。',
      };
    }
    if (reason === FailureReason.VehicleFell) {
      return {
        message: '车辆掉入水中，请加强桥面和下方支撑。',
        suggestion: '检查桥面是否断开，并加固车辆经过的中段。',
      };
    }
    return {
      message: '车辆没有成功通过，请检查桥面是否平整。',
      suggestion: '减少陡坡，保证车辆能稳定驶过整座桥。',
    };
  }

  private hideResultPopup(): void {
    if (this.resultPopup) {
      this.resultPopup.active = false;
    }
  }

  private showLevelObjective(level: LevelConfig): void {
    if (!this.objectivePopup || !this.objectiveTitleLabel || !this.objectiveMessageLabel) {
      return;
    }
    this.redrawRoundedRect(this.objectivePopup, 620, 300, new Color(18, 45, 66, 238), 20);
    this.objectiveTitleLabel.string = `第 ${level.level} 关：${level.name}`;
    this.objectiveMessageLabel.string = [
      `目标：${this.getLevelObjective(level)}`,
      `难点：${this.getLevelDifficultyPoint(level)}`,
      `提示：${level.tips}`,
      `预算：${level.budget}`,
      `车辆：${this.getVehicleSummary(level)}`,
    ].join('\n');
    this.objectivePopup.active = true;
  }

  private hideLevelObjective(): void {
    if (this.objectivePopup) {
      this.objectivePopup.active = false;
    }
  }

  private getLevelObjective(level: LevelConfig): string {
    return level.objective ?? '让所有车辆安全通过';
  }

  private getLevelDifficultyPoint(level: LevelConfig): string {
    if (level.difficultyPoint) {
      return level.difficultyPoint;
    }
    if (level.vehicles.some((vehicle: LevelVehicleConfig) => vehicle.type === 'bus' || vehicle.type === 'heavyTruck')) {
      return '车辆更重，需要加强桥面和三角支撑';
    }
    if (level.anchorPoints.length <= 2) {
      return '支点较少，需要使用完整桁架跨越';
    }
    if (level.buildArea.height <= 170) {
      return '可搭建空间受限，结构需要更紧凑';
    }
    if (level.spanWidth >= 520) {
      return '跨度更长，需要控制长杆并增加斜撑';
    }
    return '学习稳定桥面连接和基础支撑';
  }

  private getVehicleSummary(level: LevelConfig): string {
    if (level.vehicleSummary) {
      return level.vehicleSummary;
    }
    return level.vehicles.map((vehicle: LevelVehicleConfig) => {
      const name = this.getVehicleTypeName(vehicle.type);
      return `${name} x${vehicle.count}`;
    }).join('，');
  }

  private getVehicleTypeName(type: LevelVehicleConfig['type']): string {
    if (type === 'truck') {
      return '轻货车';
    }
    if (type === 'heavyTruck') {
      return '重货车';
    }
    if (type === 'bus') {
      return '巴士';
    }
    return '小汽车';
  }

  private redrawRoundedRect(node: Node, width: number, height: number, color: Color, radius: number): void {
    const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = color;
    graphics.roundRect(-width / 2, -height / 2, width, height, radius);
    graphics.fill();
    graphics.strokeColor = new Color(255, 255, 255, 70);
    graphics.lineWidth = 2;
    graphics.roundRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2, radius);
    graphics.stroke();
  }

  private redrawPanel(node: Node, width: number, height: number, color: Color, radius: number, borderColor: Color, borderWidth: number): void {
    const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(0, 17, 34, 88);
    graphics.roundRect(-width / 2 + 4, -height / 2 - 4, width, height, radius);
    graphics.fill();
    graphics.fillColor = color;
    graphics.roundRect(-width / 2, -height / 2, width, height, radius);
    graphics.fill();
    graphics.strokeColor = borderColor;
    graphics.lineWidth = borderWidth;
    graphics.roundRect(-width / 2 + borderWidth / 2, -height / 2 + borderWidth / 2, width - borderWidth, height - borderWidth, radius);
    graphics.stroke();
    graphics.strokeColor = new Color(255, 255, 255, 45);
    graphics.lineWidth = 1.5;
    graphics.roundRect(-width / 2 + 8, -height / 2 + 8, width - 16, height - 16, Math.max(2, radius - 5));
    graphics.stroke();
  }

  private redrawButton(node: Node, width: number, height: number, color: Color, enabled: boolean): void {
    const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(0, 16, 30, 100);
    graphics.roundRect(-width / 2 + 3, -height / 2 - 4, width, height, 12);
    graphics.fill();
    graphics.fillColor = color;
    graphics.roundRect(-width / 2, -height / 2, width, height, 12);
    graphics.fill();
    graphics.fillColor = enabled ? new Color(255, 255, 255, 42) : new Color(255, 255, 255, 18);
    graphics.roundRect(-width / 2 + 8, height / 2 - 19, width - 16, 11, 5);
    graphics.fill();
    graphics.strokeColor = enabled ? new Color(255, 255, 255, 75) : new Color(255, 255, 255, 35);
    graphics.lineWidth = 2;
    graphics.roundRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2, 12);
    graphics.stroke();
  }

  private drawBridgeHudIcon(node: Node): void {
    this.redrawPanel(node, 70, 70, new Color(43, 157, 237, 255), 9, new Color(121, 207, 255, 180), 2);
    const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
    graphics.strokeColor = new Color(255, 255, 255, 245);
    graphics.lineWidth = 4;
    graphics.moveTo(-25, -18);
    graphics.lineTo(-25, 19);
    graphics.moveTo(25, -18);
    graphics.lineTo(25, 19);
    graphics.moveTo(-32, -16);
    graphics.lineTo(32, -16);
    graphics.moveTo(-25, 12);
    graphics.quadraticCurveTo(0, -4, 25, 12);
    graphics.stroke();
    graphics.lineWidth = 3;
    for (let x = -16; x <= 16; x += 16) {
      graphics.moveTo(x, -16);
      graphics.lineTo(x, 2);
    }
    graphics.stroke();
  }

  private addUiBlockRect(x: number, y: number, width: number, height: number): void {
    this.uiBlockRects.push({ x, y, width, height });
  }

  private isPointInUiBlock(point: Vec2): boolean {
    return this.uiBlockRects.some((rect: UiBlockRect) => {
      return point.x >= rect.x - rect.width / 2
        && point.x <= rect.x + rect.width / 2
        && point.y >= rect.y - rect.height / 2
        && point.y <= rect.y + rect.height / 2;
    });
  }

  private createSky(): void {
    if (!this.backgroundLayer) {
      return;
    }
    const sky = this.ensureNode('Sky', this.backgroundLayer);
    const graphics = sky.getComponent(Graphics) ?? sky.addComponent(Graphics);
    graphics.clear();
    const bands = [
      new Color(118, 193, 232, 255),
      new Color(144, 210, 240, 255),
      new Color(180, 228, 248, 255),
      new Color(220, 242, 250, 255),
    ];
    const bandHeight = CANVAS_HEIGHT / bands.length;
    bands.forEach((color: Color, index: number) => {
      graphics.fillColor = color;
      graphics.fillRect(-CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - (index + 1) * bandHeight, CANVAS_WIDTH, bandHeight + 1);
    });
  }

  private createBuildings(name: string, startX: number, baseY: number, scale: number, tint: Color): void {
    if (!this.backgroundLayer) {
      return;
    }
    const layer = this.ensureNode(name, this.backgroundLayer);
    const graphics = layer.getComponent(Graphics) ?? layer.addComponent(Graphics);
    graphics.clear();
    const widths = [72, 96, 58, 110, 76, 84, 126, 66, 92, 72, 118, 86];
    const heights = [120, 170, 98, 210, 145, 185, 230, 125, 190, 150, 215, 165];
    let x = startX;
    widths.forEach((width: number, index: number) => {
      const buildingWidth = width * scale;
      const buildingHeight = heights[index] * scale;
      const palette = [
        tint,
        new Color(206, 214, 206, 255),
        new Color(155, 199, 196, 255),
        new Color(213, 202, 146, 255),
        new Color(95, 105, 112, 255),
      ];
      graphics.fillColor = palette[index % palette.length];
      graphics.fillRect(x, baseY, buildingWidth, buildingHeight);
      graphics.fillColor = new Color(235, 248, 250, 135);
      const windowStepX = 18 * scale;
      const windowStepY = 24 * scale;
      for (let wx = x + 12 * scale; wx < x + buildingWidth - 8 * scale; wx += windowStepX) {
        for (let wy = baseY + 16 * scale; wy < baseY + buildingHeight - 12 * scale; wy += windowStepY) {
          graphics.fillRect(wx, wy, 8 * scale, 12 * scale);
        }
      }
      x += buildingWidth + 10 * scale;
    });
  }

  private createTreesAndStreet(): void {
    if (!this.backgroundLayer) {
      return;
    }
    const street = this.ensureNode('TreesAndStreet', this.backgroundLayer);
    const graphics = street.getComponent(Graphics) ?? street.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(72, 77, 82, 255);
    graphics.fillRect(-CANVAS_WIDTH / 2, -78, CANVAS_WIDTH, 46);
    graphics.fillColor = new Color(230, 230, 210, 255);
    for (let x = -600; x < 620; x += 88) {
      graphics.fillRect(x, -56, 42, 3);
    }
    for (let x = -560; x <= 560; x += 140) {
      this.drawTree(graphics, x, -12, 0.85);
    }
    for (let x = -500; x <= 500; x += 250) {
      this.drawStreetLamp(graphics, x, -38);
    }
  }

  private drawTree(graphics: Graphics, x: number, y: number, scale: number): void {
    graphics.fillColor = new Color(116, 80, 50, 255);
    graphics.fillRect(x - 5 * scale, y - 44 * scale, 10 * scale, 42 * scale);
    graphics.fillColor = new Color(56, 132, 76, 255);
    graphics.circle(x - 18 * scale, y - 8 * scale, 22 * scale);
    graphics.circle(x + 2 * scale, y + 6 * scale, 26 * scale);
    graphics.circle(x + 23 * scale, y - 10 * scale, 21 * scale);
    graphics.fill();
  }

  private drawBackdropTree(graphics: Graphics, x: number, y: number): void {
    graphics.fillColor = new Color(104, 74, 48, 220);
    graphics.fillRect(x - 5, y - 36, 10, 42);
    graphics.fillColor = new Color(55, 128, 76, 210);
    graphics.circle(x - 18, y, 22);
    graphics.circle(x + 2, y + 12, 27);
    graphics.circle(x + 23, y - 2, 21);
    graphics.fill();
  }

  private drawStreetLamp(graphics: Graphics, x: number, y: number): void {
    graphics.strokeColor = new Color(220, 226, 220, 255);
    graphics.lineWidth = 4;
    graphics.moveTo(x, y);
    graphics.lineTo(x, y + 78);
    graphics.lineTo(x + 38, y + 78);
    graphics.stroke();
    graphics.fillColor = new Color(255, 245, 180, 210);
    graphics.circle(x + 42, y + 74, 8);
    graphics.fill();
  }

  private drawRiverDetails(): void {
    if (!this.backgroundLayer) {
      return;
    }
    const water = this.ensureNode('RiverDetails', this.backgroundLayer);
    const graphics = water.getComponent(Graphics) ?? water.addComponent(Graphics);
    graphics.clear();
    graphics.strokeColor = new Color(110, 190, 210, 130);
    graphics.lineWidth = 2;
    for (let y = -300; y < -130; y += 28) {
      for (let x = -580; x < 580; x += 130) {
        graphics.moveTo(x, y);
        graphics.quadraticCurveTo(x + 34, y + 8, x + 68, y);
        graphics.quadraticCurveTo(x + 96, y - 6, x + 124, y);
      }
    }
    graphics.stroke();
  }

  private createCloud(name: string, x: number, y: number, scale: number): void {
    if (!this.backgroundLayer) {
      return;
    }
    const cloud = this.ensureNode(name, this.backgroundLayer);
    cloud.setPosition(new Vec3(x, y, 4));
    const graphics = cloud.getComponent(Graphics) ?? cloud.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(255, 255, 255, 210);
    graphics.circle(-34 * scale, 0, 28 * scale);
    graphics.circle(-4 * scale, 12 * scale, 36 * scale);
    graphics.circle(34 * scale, 0, 26 * scale);
    graphics.roundRect(-54 * scale, -20 * scale, 108 * scale, 28 * scale, 14 * scale);
    graphics.fill();
  }

  private createAnchorDot(name: string, x: number, y: number): void {
    if (!this.ensureCoreLayers() || !this.isNodeUsable(this.anchorLayer)) {
      console.warn('[SceneBootstrap] anchorPointsLayer missing, cannot create anchor');
      return;
    }
    const dot = this.ensureNode(name, this.anchorLayer);
    dot.setPosition(new Vec3(x, y, 18));
    const graphics = dot.getComponent(Graphics) ?? dot.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(92, 68, 58, 175);
    graphics.circle(1, -1, 13);
    graphics.fill();
    graphics.fillColor = new Color(232, 76, 61, 255);
    graphics.circle(0, 0, 10);
    graphics.fill();
    graphics.strokeColor = new Color(255, 255, 255, 245);
    graphics.lineWidth = 2.5;
    graphics.circle(0, 0, 13);
    graphics.stroke();
  }

  private drawDashedLine(graphics: Graphics, start: Vec2, end: Vec2, dash: number, gap: number): void {
    const length = Vec2.distance(start, end);
    if (length <= 0) {
      return;
    }
    const dirX = (end.x - start.x) / length;
    const dirY = (end.y - start.y) / length;
    let distance = 0;
    while (distance < length) {
      const dashEnd = Math.min(distance + dash, length);
      graphics.moveTo(start.x + dirX * distance, start.y + dirY * distance);
      graphics.lineTo(start.x + dirX * dashEnd, start.y + dirY * dashEnd);
      distance += dash + gap;
    }
    graphics.stroke();
  }

  private createLabel(name: string, parent: Node, text: string, fontSize: number, color: Color, width: number, height: number): Label {
    const labelNode = this.ensureNode(name, parent);
    this.ensureTransform(labelNode, width, height);
    const label = labelNode.getComponent(Label) ?? labelNode.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.color = color;
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    return label;
  }

  private createGraphicsNode(name: string, parent: Node, width: number, height: number, color: Color): Node {
    const node = this.ensureNode(name, parent);
    this.ensureTransform(node, width, height);
    node.getComponent(Sprite) ?? node.addComponent(Sprite);
    const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = color;
    graphics.fillRect(-width / 2, -height / 2, width, height);
    return node;
  }

  private ensureCoreLayers(): boolean {
    try {
      this.backgroundLayer = this.getOrCreateNode('BackgroundLayer', this.node);
      this.gameLayer = this.getOrCreateNode('GameplayLayer', this.node);
      this.anchorLayer = this.getOrCreateNode('AnchorPoints', this.gameLayer);
      this.bridgeLayer = this.getOrCreateNode('BridgeSegments', this.gameLayer);
      this.vehicleLayer = this.getOrCreateNode('VehicleLayer', this.gameLayer);
      this.uiRoot = this.getOrCreateNode('UILayer', this.node);
      this.getOrCreateNode('GameManager', this.node);

      this.backgroundLayer.setSiblingIndex(1);
      this.gameLayer.setSiblingIndex(2);
      this.uiRoot.setSiblingIndex(3);
      return true;
    } catch (error) {
      console.warn('[SceneBootstrap] ensureCoreLayers failed', error);
      return false;
    }
  }

  private getOrCreateNode(name: string, parent: Node): Node {
    if (!this.isNodeUsable(parent)) {
      throw new Error(`[SceneBootstrap] getOrCreateNode failed: parent is null or invalid, child=${name}`);
    }
    let node = parent.getChildByName(name);
    if (!this.isNodeUsable(node)) {
      node = new Node(name);
      parent.addChild(node);
    }
    return node;
  }

  private ensureNode(name: string, parent: Node): Node {
    return this.getOrCreateNode(name, parent);
  }

  private ensureTransform(node: Node, width: number, height: number): UITransform {
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return transform;
  }

  private setGraphicsFillColor(graphics: Graphics, color: Color): void {
    const internals = graphics as unknown as { _fillColor?: Color | null };
    if (!internals._fillColor) {
      internals._fillColor = color.clone();
    }
    graphics.fillColor = color;
  }

  private setGraphicsStrokeColor(graphics: Graphics, color: Color): void {
    const internals = graphics as unknown as { _strokeColor?: Color | null };
    if (!internals._strokeColor) {
      internals._strokeColor = color.clone();
    }
    graphics.strokeColor = color;
  }

  private isNodeUsable(node: Node | null | undefined): node is Node {
    return isValid(node, true);
  }

  private destroyNodeNow(node: Node | null | undefined): void {
    if (!node) {
      return;
    }
    if (node.parent) {
      node.removeFromParent();
    }
    if (isValid(node, true)) {
      node.destroy();
    }
  }

  private clearLayer(layer: Node | null): void {
    if (!this.isNodeUsable(layer)) {
      return;
    }
    if (layer === this.gameLayer) {
      this.previewNode = null;
      this.previewGraphics = null;
      this.markerNode = null;
      this.markerGraphics = null;
      this.carGraphics = null;
    }
    layer.children.slice().forEach((child: Node) => this.destroyNodeNow(child));
  }
}
