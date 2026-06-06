// 车辆生成器，定时创建占位车辆并交给 VehicleController 移动。
import { _decorator, Component, Node } from 'cc';
import { GameConfig } from './GameConfig';
import { VehicleController } from './VehicleController';
import { VehicleConfig } from './Types';

const { ccclass, property } = _decorator;

@ccclass('VehicleSpawner')
export class VehicleSpawner extends Component {
  @property(Node)
  public vehicleLayer: Node | null = null;

  private getBaseVehicleIncome: (() => number) | null = null;
  private onVehicleReward: ((baseIncome: number, multiplier: number) => void) | null = null;
  private spawning = false;

  public init(getBaseVehicleIncome: () => number, onVehicleReward: (baseIncome: number, multiplier: number) => void): void {
    this.getBaseVehicleIncome = getBaseVehicleIncome;
    this.onVehicleReward = onVehicleReward;
  }

  public startSpawn(): void {
    if (this.spawning) {
      return;
    }
    this.spawning = true;
    this.spawnVehicle();
    const interval = GameConfig.getIncomeConfig().vehicleSpawnInterval;
    this.schedule(this.spawnVehicle, interval);
  }

  public stopSpawn(): void {
    this.spawning = false;
    this.unschedule(this.spawnVehicle);
  }

  public spawnVehicle(): void {
    try {
      const configs = GameConfig.getVehicleConfigs();
      if (configs.length <= 0) {
        console.warn('[VehicleSpawner] 车辆配置为空，无法生成车辆');
        return;
      }
      const config = configs[Math.floor(Math.random() * configs.length)];
      const parent = this.vehicleLayer ?? this.node;
      if (!this.vehicleLayer) {
        console.warn('[VehicleSpawner] vehicleLayer 未绑定，使用当前节点作为车辆父节点');
      }
      const vehicleNode = new Node(`Vehicle_${config.type}`);
      parent.addChild(vehicleNode);
      const controller = vehicleNode.addComponent(VehicleController);
      const baseIncome = this.getBaseVehicleIncome ? this.getBaseVehicleIncome() : 0;
      controller.init(config, -420, 420, 0, baseIncome, (amount: number) => {
        if (this.onVehicleReward) {
          const multiplier = baseIncome > 0 ? amount / baseIncome : config.incomeMultiplier;
          this.onVehicleReward(baseIncome, multiplier);
        }
      });
    } catch (error) {
      console.warn('[VehicleSpawner] 生成车辆失败', error);
    }
  }

  protected onDisable(): void {
    this.stopSpawn();
  }
}

