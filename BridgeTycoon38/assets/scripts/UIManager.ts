// UI 管理器，负责刷新文本、弹窗、提示和按钮状态。
import { _decorator, Button, Component, Label, Node } from 'cc';
import { EventBus } from './EventBus';
import { FailureReason, TestResult } from './GameplayTypes';
import { LevelConfig } from './LevelTypes';
import { BridgeLevelConfig, GAME_EVENTS, OfflineRewardData } from './Types';
import { formatCoins, formatTime } from './Utils';

const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
  @property(Label)
  public coinLabel: Label | null = null;

  @property(Label)
  public bridgeLevelLabel: Label | null = null;

  @property(Label)
  public bridgeNameLabel: Label | null = null;

  @property(Label)
  public upgradeCostLabel: Label | null = null;

  @property(Label)
  public idleIncomeLabel: Label | null = null;

  @property(Label)
  public clickIncomeLabel: Label | null = null;

  @property(Button)
  public buildButton: Button | null = null;

  @property(Button)
  public upgradeButton: Button | null = null;

  @property(Button)
  public clearSaveButton: Button | null = null;

  @property(Node)
  public offlinePopup: Node | null = null;

  @property(Label)
  public offlineRewardLabel: Label | null = null;

  @property(Button)
  public claimOfflineButton: Button | null = null;

  @property(Button)
  public claimDoubleOfflineButton: Button | null = null;

  @property(Label)
  public toastLabel: Label | null = null;

  @property(Label)
  public levelInfoLabel: Label | null = null;

  @property(Label)
  public budgetInfoLabel: Label | null = null;

  @property(Label)
  public levelTipsLabel: Label | null = null;

  @property(Label)
  public levelResultLabel: Label | null = null;

  @property(Node)
  public guidePanel: Node | null = null;

  @property(Label)
  public guideLabel: Label | null = null;

  private warnedKeys: Set<string> = new Set<string>();
  private hideToastHandler = (): void => {
    if (this.toastLabel) {
      this.toastLabel.node.active = false;
    }
  };
  private handleToastEvent = (message?: string): void => {
    if (typeof message === 'string') {
      this.showToast(message);
    }
  };

  protected onLoad(): void {
    if (this.offlinePopup) {
      this.offlinePopup.active = false;
    }
    if (this.toastLabel) {
      this.toastLabel.node.active = false;
    }
    if (this.guidePanel) {
      this.guidePanel.active = false;
    }
    EventBus.on<string>(GAME_EVENTS.TOAST, this.handleToastEvent);
  }

  protected onDestroy(): void {
    EventBus.off<string>(GAME_EVENTS.TOAST, this.handleToastEvent);
    this.unschedule(this.hideToastHandler);
  }

  public refreshAll(coins: number, bridgeConfig: BridgeLevelConfig, maxLevel: number): void {
    this.refreshCoins(coins);
    this.refreshBridgeInfo(bridgeConfig, maxLevel);
  }

  public refreshCoins(coins: number): void {
    if (this.coinLabel) {
      this.coinLabel.string = `金币：${formatCoins(coins)}`;
    } else {
      this.warnOnce('coinLabel', '[UIManager] coinLabel 未绑定');
    }
  }

  public refreshBridgeInfo(config: BridgeLevelConfig, maxLevel: number): void {
    if (this.bridgeLevelLabel) {
      this.bridgeLevelLabel.string = `桥梁等级：${config.level}`;
    } else {
      this.warnOnce('bridgeLevelLabel', '[UIManager] bridgeLevelLabel 未绑定');
    }
    if (this.bridgeNameLabel) {
      this.bridgeNameLabel.string = config.name;
    } else {
      this.warnOnce('bridgeNameLabel', '[UIManager] bridgeNameLabel 未绑定');
    }
    if (this.upgradeCostLabel) {
      this.upgradeCostLabel.string = config.level >= maxLevel ? '升级费用：已满级' : `升级费用：${formatCoins(config.upgradeCost)}`;
    } else {
      this.warnOnce('upgradeCostLabel', '[UIManager] upgradeCostLabel 未绑定');
    }
    if (this.idleIncomeLabel) {
      this.idleIncomeLabel.string = `自动收益：${formatCoins(config.idleIncomePerSecond)}/秒`;
    } else {
      this.warnOnce('idleIncomeLabel', '[UIManager] idleIncomeLabel 未绑定');
    }
    if (this.clickIncomeLabel) {
      this.clickIncomeLabel.string = `点击收益：${formatCoins(config.clickIncome)}`;
    } else {
      this.warnOnce('clickIncomeLabel', '[UIManager] clickIncomeLabel 未绑定');
    }
    this.setUpgradeButtonInteractable(config.level < maxLevel);
  }

  public refreshLevelInfo(levelConfig: LevelConfig): void {
    if (this.levelInfoLabel) {
      this.levelInfoLabel.string = `关卡：第 ${levelConfig.level} 关 ${levelConfig.name}`;
    }
    this.refreshLevelTips(levelConfig.tips);
  }

  public refreshBudget(remainingBudget: number, usedMaterial: number): void {
    if (this.budgetInfoLabel) {
      this.budgetInfoLabel.string = `预算剩余：${remainingBudget}  已用材料：${usedMaterial}`;
    }
  }

  public refreshLevelTips(tips: string): void {
    if (this.levelTipsLabel) {
      this.levelTipsLabel.string = tips;
    }
  }

  public showLevelResult(stars: number): void {
    if (this.levelResultLabel) {
      this.levelResultLabel.string = stars > 0 ? `通关：${'★'.repeat(stars)}` : '通关失败';
      this.levelResultLabel.node.active = true;
    }
    if (stars > 0) {
      this.showToast(`获得 ${stars} 星`);
    }
  }

  public showFailurePopup(result: TestResult): void {
    this.showLevelResult(0);
    this.showToast(this.getFailureToast(result.failureReason), 2.2);
  }

  public showSuccessPopup(result: TestResult, stars: number): void {
    this.showLevelResult(stars);
    this.showToast(`通关成功：${'★'.repeat(stars)} 用料 ${result.usedCost}/${result.budget}`, 2.2);
  }

  public showLevelObjective(levelConfig: LevelConfig): void {
    this.refreshLevelInfo(levelConfig);
    const objective = levelConfig.objective ?? '让所有车辆安全通过';
    this.showToast(`目标：${objective}`, 2.2);
  }

  public showToast(message: string, duration = 1.6): void {
    if (!this.toastLabel) {
      this.warnOnce('toastLabel', '[UIManager] toastLabel 未绑定');
      console.warn(`[UIManager] Toast: ${message}`);
      return;
    }
    this.toastLabel.string = message;
    this.toastLabel.node.active = true;
    this.unschedule(this.hideToastHandler);
    this.scheduleOnce(this.hideToastHandler, duration);
  }

  public showOfflinePopup(offlineSeconds: number, rewardCoins: number): void {
    if (this.offlinePopup) {
      this.offlinePopup.active = true;
    } else {
      this.warnOnce('offlinePopup', '[UIManager] offlinePopup 未绑定');
    }
    if (this.offlineRewardLabel) {
      this.offlineRewardLabel.string = `离线 ${formatTime(offlineSeconds)}，获得 ${formatCoins(rewardCoins)} 金币`;
    } else {
      this.warnOnce('offlineRewardLabel', '[UIManager] offlineRewardLabel 未绑定');
    }
  }

  public hideOfflinePopup(): void {
    if (this.offlinePopup) {
      this.offlinePopup.active = false;
    } else {
      this.warnOnce('offlinePopup', '[UIManager] offlinePopup 未绑定');
    }
  }

  public showGuide(): void {
    if (this.guidePanel) {
      this.guidePanel.active = true;
    } else {
      this.warnOnce('guidePanel', '[UIManager] guidePanel 未绑定');
    }
    if (this.guideLabel) {
      this.guideLabel.string = '欢迎来到桥梁大亨！\n点击施工获得金币，升级桥梁后，车辆和离线收益都会提升。';
    } else {
      this.warnOnce('guideLabel', '[UIManager] guideLabel 未绑定');
    }
  }

  public hideGuide(): void {
    if (this.guidePanel) {
      this.guidePanel.active = false;
    } else {
      this.warnOnce('guidePanel', '[UIManager] guidePanel 未绑定');
    }
  }

  public setUpgradeButtonInteractable(canUpgrade: boolean): void {
    if (this.upgradeButton) {
      this.upgradeButton.interactable = canUpgrade;
    } else {
      this.warnOnce('upgradeButton', '[UIManager] upgradeButton 未绑定');
    }
  }

  private warnOnce(key: string, message: string): void {
    if (this.warnedKeys.has(key)) {
      return;
    }
    this.warnedKeys.add(key);
    console.warn(message);
  }

  private getFailureToast(reason: FailureReason): string {
    if (reason === FailureReason.DeckNotConnected) {
      return '桥面没有完整连接';
    }
    if (reason === FailureReason.SegmentBroken) {
      return '关键杆件断裂';
    }
    if (reason === FailureReason.VehicleFell) {
      return '车辆掉入水中';
    }
    return '车辆没有成功通过';
  }
}
