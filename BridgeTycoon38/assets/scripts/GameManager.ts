// 游戏总入口，串联配置、存档、收益、桥梁、车辆、UI、广告和音频。
import { _decorator, Component } from 'cc';
import { AdManager } from './AdManager';
import { AudioManager } from './AudioManager';
import { BridgeController } from './BridgeController';
import { EventBus } from './EventBus';
import { GameConfig } from './GameConfig';
import { IncomeController } from './IncomeController';
import { LevelManager } from './LevelManager';
import { SaveManager } from './SaveManager';
import { GAME_EVENTS, GameSaveData, OfflineRewardData } from './Types';
import { UIManager } from './UIManager';
import { VehicleSpawner } from './VehicleSpawner';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
  @property(SaveManager)
  public saveManager: SaveManager | null = null;

  @property(LevelManager)
  public levelManager: LevelManager | null = null;

  @property(IncomeController)
  public incomeController: IncomeController | null = null;

  @property(BridgeController)
  public bridgeController: BridgeController | null = null;

  @property(VehicleSpawner)
  public vehicleSpawner: VehicleSpawner | null = null;

  @property(UIManager)
  public uiManager: UIManager | null = null;

  @property(AdManager)
  public adManager: AdManager | null = null;

  @property(AudioManager)
  public audioManager: AudioManager | null = null;

  private currentSave: GameSaveData | null = null;
  private pendingOfflineReward: OfflineRewardData | null = null;
  private initialized = false;

  private handleCoinsChanged = (coins?: number): void => {
    if (typeof coins !== 'number') {
      return;
    }
    this.uiManager?.refreshCoins(coins);
    this.refreshUpgradeButton();
  };

  private handleBridgeLevelChanged = (): void => {
    this.refreshUI();
  };

  private handleAutoIncome = (): void => {
    if (!this.initialized || !this.incomeController || !this.bridgeController) {
      return;
    }
    const config = this.bridgeController.getCurrentConfig();
    const amount = this.incomeController.applyIdleIncome(config.idleIncomePerSecond);
    if (amount > 0) {
      this.audioManager?.playCoin();
    }
  };

  private handleAutoSave = (): void => {
    if (!this.initialized) {
      return;
    }
    this.saveCurrentData(false);
  };

  protected onLoad(): void {
    this.resolveComponentRefs();
  }

  protected async start(): Promise<void> {
    await GameConfig.loadAllConfigs();

    const save = this.saveManager ? this.saveManager.loadSave() : this.createDefaultSave();
    this.currentSave = save;
    await this.levelManager?.loadLevels();
    this.levelManager?.setCurrentLevel(save.currentLevel);
    this.incomeController?.init(save.coins);
    this.bridgeController?.init(save.bridgeLevel);
    this.audioManager?.init(save.soundEnabled);

    this.calculateOfflineReward(save);
    this.registerEvents();
    this.refreshUI();

    this.vehicleSpawner?.init(
      () => this.bridgeController?.getCurrentConfig().vehicleIncome ?? 0,
      (baseIncome: number, multiplier: number) => {
        this.handleVehicleReward(baseIncome, multiplier);
      },
    );
    this.vehicleSpawner?.startSpawn();

    const incomeConfig = GameConfig.getIncomeConfig();
    this.schedule(this.handleAutoIncome, incomeConfig.autoIncomeInterval);
    this.schedule(this.handleAutoSave, incomeConfig.autoSaveInterval);

    if (!save.guideViewed) {
      this.uiManager?.showGuide();
    }

    this.initialized = true;
  }

  protected onDisable(): void {
    this.shutdown();
  }

  protected onDestroy(): void {
    this.shutdown();
    this.unregisterEvents();
  }

  public onClickBuild(): void {
    if (!this.incomeController || !this.bridgeController) {
      console.warn('[GameManager] 施工失败，IncomeController 或 BridgeController 缺失');
      return;
    }
    const config = this.bridgeController.getCurrentConfig();
    this.incomeController.applyClickIncome(config.clickIncome);
    this.audioManager?.playClick();
    this.refreshUI();
    this.saveCurrentData(false);
  }

  public onClickUpgradeBridge(): void {
    if (!this.incomeController || !this.bridgeController) {
      console.warn('[GameManager] 升级失败，IncomeController 或 BridgeController 缺失');
      return;
    }
    if (!this.bridgeController.canUpgrade()) {
      this.showToast('桥梁已满级');
      return;
    }
    const currentConfig = this.bridgeController.getCurrentConfig();
    if (!this.incomeController.hasEnoughCoins(currentConfig.upgradeCost)) {
      this.showToast('金币不足，继续施工或等待车辆收益');
      return;
    }
    if (!this.incomeController.spendCoins(currentConfig.upgradeCost)) {
      this.showToast('金币不足，继续施工或等待车辆收益');
      return;
    }
    this.bridgeController.upgrade();
    this.audioManager?.playUpgrade();
    this.refreshUI();
    this.saveCurrentData(false);
  }

  public onClickClearSave(): void {
    this.vehicleSpawner?.stopSpawn();
    this.unschedule(this.handleAutoIncome);
    this.unschedule(this.handleAutoSave);
    this.saveManager?.clearSave();

    const save = this.saveManager ? this.saveManager.getDefaultSave() : this.createDefaultSave();
    this.currentSave = save;
    this.pendingOfflineReward = null;
    this.incomeController?.init(save.coins);
    this.bridgeController?.init(save.bridgeLevel);
    this.audioManager?.init(save.soundEnabled);
    this.uiManager?.hideOfflinePopup();
    this.uiManager?.showGuide();
    this.refreshUI();
    this.saveCurrentData(false);

    const incomeConfig = GameConfig.getIncomeConfig();
    this.schedule(this.handleAutoIncome, incomeConfig.autoIncomeInterval);
    this.schedule(this.handleAutoSave, incomeConfig.autoSaveInterval);
    this.vehicleSpawner?.startSpawn();
    this.showToast('存档已清空');
  }

  public onClaimOfflineReward(): void {
    if (!this.pendingOfflineReward || !this.incomeController) {
      this.uiManager?.hideOfflinePopup();
      return;
    }
    this.incomeController.addCoins(this.pendingOfflineReward.rewardCoins, 'offline');
    this.audioManager?.playCoin();
    this.pendingOfflineReward = null;
    this.uiManager?.hideOfflinePopup();
    this.refreshUI();
    this.saveCurrentData(false);
  }

  public async onClaimDoubleOfflineReward(): Promise<void> {
    if (!this.pendingOfflineReward || !this.incomeController) {
      this.uiManager?.hideOfflinePopup();
      return;
    }
    const success = this.adManager ? await this.adManager.showRewardAd() : true;
    if (!success) {
      this.showToast('广告未完整观看，未获得翻倍收益');
      return;
    }
    this.incomeController.addCoins(this.pendingOfflineReward.rewardCoins * 2, 'offline_double');
    this.audioManager?.playCoin();
    this.pendingOfflineReward = null;
    this.uiManager?.hideOfflinePopup();
    this.refreshUI();
    this.saveCurrentData(false);
  }

  public onCloseGuide(): void {
    if (!this.currentSave) {
      this.currentSave = this.createDefaultSave();
    }
    this.currentSave.guideViewed = true;
    this.uiManager?.hideGuide();
    this.saveCurrentData(false);
  }

  private resolveComponentRefs(): void {
    this.saveManager = this.saveManager ?? this.node.getComponentInChildren(SaveManager);
    this.levelManager = this.levelManager ?? this.node.getComponentInChildren(LevelManager);
    this.incomeController = this.incomeController ?? this.node.getComponentInChildren(IncomeController);
    this.bridgeController = this.bridgeController ?? this.node.getComponentInChildren(BridgeController);
    this.vehicleSpawner = this.vehicleSpawner ?? this.node.getComponentInChildren(VehicleSpawner);
    this.uiManager = this.uiManager ?? this.node.getComponentInChildren(UIManager);
    this.adManager = this.adManager ?? this.node.getComponentInChildren(AdManager);
    this.audioManager = this.audioManager ?? this.node.getComponentInChildren(AudioManager);

    this.warnMissing('SaveManager', this.saveManager);
    this.warnMissing('LevelManager', this.levelManager);
    this.warnMissing('IncomeController', this.incomeController);
    this.warnMissing('BridgeController', this.bridgeController);
    this.warnMissing('VehicleSpawner', this.vehicleSpawner);
    this.warnMissing('UIManager', this.uiManager);
    this.warnMissing('AdManager', this.adManager);
    this.warnMissing('AudioManager', this.audioManager);
  }

  private registerEvents(): void {
    EventBus.on<number>(GAME_EVENTS.COINS_CHANGED, this.handleCoinsChanged);
    EventBus.on(GAME_EVENTS.BRIDGE_LEVEL_CHANGED, this.handleBridgeLevelChanged);
  }

  private unregisterEvents(): void {
    EventBus.off<number>(GAME_EVENTS.COINS_CHANGED, this.handleCoinsChanged);
    EventBus.off(GAME_EVENTS.BRIDGE_LEVEL_CHANGED, this.handleBridgeLevelChanged);
  }

  private calculateOfflineReward(save: GameSaveData): void {
    if (!this.bridgeController) {
      return;
    }
    const now = Date.now();
    const offlineSeconds = Math.max(0, Math.floor((now - save.lastExitTime) / 1000));
    if (offlineSeconds < 30) {
      return;
    }
    const incomeConfig = GameConfig.getIncomeConfig();
    const effectiveSeconds = Math.min(offlineSeconds, incomeConfig.offlineMaxSeconds);
    const rewardCoins = effectiveSeconds * this.bridgeController.getCurrentConfig().idleIncomePerSecond;
    if (rewardCoins <= 0) {
      return;
    }
    this.pendingOfflineReward = {
      offlineSeconds: effectiveSeconds,
      rewardCoins,
    };
    this.uiManager?.showOfflinePopup(effectiveSeconds, rewardCoins);
  }

  private handleVehicleReward(baseIncome: number, multiplier: number): void {
    if (!this.incomeController) {
      console.warn('[GameManager] 车辆收益失败，IncomeController 缺失');
      return;
    }
    this.incomeController.applyVehicleIncome(baseIncome, multiplier);
    this.audioManager?.playCoin();
    this.refreshUI();
  }

  private refreshUI(): void {
    if (!this.incomeController || !this.bridgeController || !this.uiManager) {
      return;
    }
    this.uiManager.refreshAll(
      this.incomeController.getCoins(),
      this.bridgeController.getCurrentConfig(),
      GameConfig.getMaxBridgeLevel(),
    );
    if (this.levelManager) {
      this.uiManager.refreshLevelInfo(this.levelManager.getCurrentLevel());
    }
    this.refreshUpgradeButton();
  }

  private refreshUpgradeButton(): void {
    if (!this.incomeController || !this.bridgeController || !this.uiManager) {
      return;
    }
    const config = this.bridgeController.getCurrentConfig();
    const canUpgrade = this.bridgeController.canUpgrade() && this.incomeController.hasEnoughCoins(config.upgradeCost);
    this.uiManager.setUpgradeButtonInteractable(canUpgrade);
  }

  private saveCurrentData(markExitTime: boolean): void {
    if (!this.saveManager || !this.incomeController || !this.bridgeController) {
      return;
    }
    const baseSave = this.currentSave ?? this.saveManager.getDefaultSave();
    const nextSave: GameSaveData = {
      coins: this.incomeController.getCoins(),
      bridgeLevel: this.bridgeController.getCurrentLevel(),
      lastExitTime: baseSave.lastExitTime,
      soundEnabled: this.audioManager?.isSoundEnabled() ?? baseSave.soundEnabled,
      guideViewed: baseSave.guideViewed,
      currentLevel: this.levelManager?.getCurrentLevelIndex() ?? baseSave.currentLevel,
      unlockedLevel: this.levelManager?.getUnlockedLevel() ?? baseSave.unlockedLevel,
      levelStars: baseSave.levelStars,
    };
    this.currentSave = markExitTime ? this.saveManager.markExitTime(nextSave) : nextSave;
    this.saveManager.saveData(this.currentSave);
  }

  private shutdown(): void {
    this.unschedule(this.handleAutoIncome);
    this.unschedule(this.handleAutoSave);
    this.vehicleSpawner?.stopSpawn();
    this.saveCurrentData(true);
  }

  private showToast(message: string): void {
    EventBus.emit<string>(GAME_EVENTS.TOAST, message);
  }

  private warnMissing(name: string, value: Component | null): void {
    if (!value) {
      console.warn(`[GameManager] ${name} 未绑定，也未在子节点中找到`);
    }
  }

  private createDefaultSave(): GameSaveData {
    return {
      coins: 0,
      bridgeLevel: 1,
      lastExitTime: Date.now(),
      soundEnabled: true,
      guideViewed: false,
      currentLevel: 1,
      unlockedLevel: 1,
      levelStars: {},
    };
  }
}
