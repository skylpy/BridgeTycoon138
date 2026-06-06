// 收益控制器，统一管理金币增加、消耗和各类收益计算。
import { _decorator, Component } from 'cc';
import { EventBus } from './EventBus';
import { GAME_EVENTS } from './Types';
import { safeNumber } from './Utils';

const { ccclass } = _decorator;

@ccclass('IncomeController')
export class IncomeController extends Component {
  private coins = 0;

  public init(initialCoins: number): void {
    this.setCoins(initialCoins);
  }

  public getCoins(): number {
    return this.coins;
  }

  public setCoins(value: number): void {
    this.coins = Math.max(0, safeNumber(value, 0));
    EventBus.emit<number>(GAME_EVENTS.COINS_CHANGED, this.coins);
  }

  public addCoins(value: number, reason = 'unknown'): void {
    const amount = Math.max(0, safeNumber(value, 0));
    if (amount <= 0) {
      return;
    }
    this.coins += amount;
    console.log(`[IncomeController] 增加金币 ${amount}，来源：${reason}，当前金币：${this.coins}`);
    EventBus.emit<number>(GAME_EVENTS.COINS_CHANGED, this.coins);
  }

  public spendCoins(value: number): boolean {
    const amount = Math.max(0, safeNumber(value, 0));
    if (this.coins < amount) {
      return false;
    }
    this.coins -= amount;
    EventBus.emit<number>(GAME_EVENTS.COINS_CHANGED, this.coins);
    return true;
  }

  public hasEnoughCoins(value: number): boolean {
    return this.coins >= Math.max(0, safeNumber(value, 0));
  }

  public applyClickIncome(clickIncome: number): number {
    const amount = Math.max(0, safeNumber(clickIncome, 0));
    this.addCoins(amount, 'click');
    return amount;
  }

  public applyVehicleIncome(baseIncome: number, multiplier: number): number {
    const amount = Math.max(0, safeNumber(baseIncome, 0) * safeNumber(multiplier, 1));
    this.addCoins(amount, 'vehicle');
    return amount;
  }

  public applyIdleIncome(idleIncomePerSecond: number): number {
    const amount = Math.max(0, safeNumber(idleIncomePerSecond, 0));
    this.addCoins(amount, 'idle');
    return amount;
  }
}

