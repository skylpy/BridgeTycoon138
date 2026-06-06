// 激励广告 mock，后续可替换为微信小游戏真实广告能力。
import { _decorator, Component } from 'cc';
import { GameConfig } from './GameConfig';

const { ccclass } = _decorator;

@ccclass('AdManager')
export class AdManager extends Component {
  public showRewardAd(): Promise<boolean> {
    const successRate = GameConfig.getIncomeConfig().adMockSuccessRate;
    return new Promise<boolean>((resolve: (value: boolean) => void) => {
      this.scheduleOnce(() => {
        const success = Math.random() <= successRate;
        if (success) {
          console.log('[AdManager] 激励广告 mock 成功');
        } else {
          console.warn('[AdManager] 激励广告 mock 失败');
        }
        resolve(success);
      }, 1);
    });
  }
}

