// 桥梁控制器，负责等级状态和桥梁占位视觉刷新。
import { _decorator, Color, Component, Graphics, Label, Node, Sprite, UITransform } from 'cc';
import { EventBus } from './EventBus';
import { GameConfig } from './GameConfig';
import { BridgeLevelConfig, GAME_EVENTS } from './Types';
import { clamp } from './Utils';

const { ccclass, property } = _decorator;

@ccclass('BridgeController')
export class BridgeController extends Component {
  @property(Node)
  public bridgeVisual: Node | null = null;

  @property(Label)
  public bridgeNameVisualLabel: Label | null = null;

  private currentLevel = 1;

  public init(level: number): void {
    this.setLevel(level);
  }

  public getCurrentLevel(): number {
    return this.currentLevel;
  }

  public getCurrentConfig(): BridgeLevelConfig {
    return GameConfig.getBridgeConfig(this.currentLevel);
  }

  public canUpgrade(): boolean {
    return this.currentLevel < GameConfig.getMaxBridgeLevel();
  }

  public upgrade(): BridgeLevelConfig {
    if (this.canUpgrade()) {
      this.currentLevel += 1;
      this.refreshBridgeVisual();
      EventBus.emit<BridgeLevelConfig>(GAME_EVENTS.BRIDGE_LEVEL_CHANGED, this.getCurrentConfig());
    }
    return this.getCurrentConfig();
  }

  public setLevel(level: number): void {
    const maxLevel = GameConfig.getMaxBridgeLevel();
    this.currentLevel = clamp(Math.floor(level), 1, maxLevel);
    this.refreshBridgeVisual();
    EventBus.emit<BridgeLevelConfig>(GAME_EVENTS.BRIDGE_LEVEL_CHANGED, this.getCurrentConfig());
  }

  public refreshBridgeVisual(): void {
    const config = this.getCurrentConfig();
    const maxLevel = Math.max(1, GameConfig.getMaxBridgeLevel());
    const progress = maxLevel <= 1 ? 0 : (this.currentLevel - 1) / (maxLevel - 1);

    if (!this.bridgeVisual) {
      console.warn('[BridgeController] bridgeVisual 未绑定');
    } else {
      const transform = this.bridgeVisual.getComponent(UITransform) ?? this.bridgeVisual.addComponent(UITransform);
      const width = 220 + progress * 300;
      const height = 52 + progress * 26;
      transform.setContentSize(width, height);

      const sprite = this.bridgeVisual.getComponent(Sprite) ?? this.bridgeVisual.addComponent(Sprite);
      const red = Math.floor(120 + progress * 90);
      const green = Math.floor(86 + progress * 70);
      const blue = Math.floor(56 + progress * 110);
      const color = new Color(red, green, blue, 255);
      sprite.color = color;

      const graphics = this.bridgeVisual.getComponent(Graphics) ?? this.bridgeVisual.addComponent(Graphics);
      graphics.clear();
      graphics.fillColor = color;
      graphics.fillRect(-width / 2, -height / 2, width, height);
    }

    if (this.bridgeNameVisualLabel) {
      this.bridgeNameVisualLabel.string = config.name;
    }
  }
}
