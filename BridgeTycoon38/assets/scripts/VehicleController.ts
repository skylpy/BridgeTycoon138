// 单辆车控制器，负责车辆占位显示、移动和过桥奖励触发。
import {
  _decorator,
  Color,
  Component,
  Graphics,
  Label,
  Node,
  Sprite,
  UITransform,
  Vec3,
} from 'cc';
import { VehicleConfig } from './Types';
import { parseColorHex, safeNumber } from './Utils';

const { ccclass } = _decorator;

@ccclass('VehicleController')
export class VehicleController extends Component {
  private config: VehicleConfig | null = null;
  private startX = 0;
  private endX = 0;
  private bridgeCenterX = 0;
  private baseIncome = 0;
  private onReward: ((amount: number) => void) | null = null;
  private rewarded = false;
  private initialized = false;

  public init(
    config: VehicleConfig,
    startX: number,
    endX: number,
    bridgeCenterX: number,
    baseIncome: number,
    onReward: (amount: number) => void,
  ): void {
    this.config = config;
    this.startX = startX;
    this.endX = endX;
    this.bridgeCenterX = bridgeCenterX;
    this.baseIncome = Math.max(0, safeNumber(baseIncome, 0));
    this.onReward = onReward;
    this.rewarded = false;
    this.initialized = true;
    this.node.setPosition(new Vec3(this.startX, 0, 0));
    this.setupVisual();
  }

  public update(deltaTime: number): void {
    if (!this.initialized || !this.config) {
      return;
    }
    const currentPosition = this.node.position;
    const nextX = currentPosition.x + this.config.speed * deltaTime;
    this.node.setPosition(new Vec3(nextX, currentPosition.y, currentPosition.z));

    if (!this.rewarded && nextX >= this.bridgeCenterX) {
      this.rewarded = true;
      const amount = this.baseIncome * this.config.incomeMultiplier;
      if (this.onReward) {
        this.onReward(amount);
      }
    }

    if (nextX >= this.endX) {
      this.node.destroy();
    }
  }

  private setupVisual(): void {
    if (!this.config) {
      return;
    }
    const size = this.getVehicleSize(this.config.type);
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    transform.setContentSize(size.width, size.height);

    const sprite = this.node.getComponent(Sprite) ?? this.node.addComponent(Sprite);
    const color = this.config.color ? parseColorHex(this.config.color) : new Color(255, 255, 255, 255);
    sprite.color = color;

    const graphics = this.node.getComponent(Graphics) ?? this.node.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = color;
    graphics.fillRect(-size.width / 2, -size.height / 2, size.width, size.height);

    const labelNode = new Node('VehicleNameLabel');
    this.node.addChild(labelNode);
    const labelTransform = labelNode.addComponent(UITransform);
    labelTransform.setContentSize(size.width, size.height);
    const label = labelNode.addComponent(Label);
    label.string = this.config.name;
    label.fontSize = 18;
    label.color = new Color(30, 30, 30, 255);
  }

  private getVehicleSize(type: string): { width: number; height: number } {
    if (type === 'truck') {
      return { width: 80, height: 36 };
    }
    if (type === 'bus') {
      return { width: 90, height: 40 };
    }
    return { width: 60, height: 30 };
  }
}
