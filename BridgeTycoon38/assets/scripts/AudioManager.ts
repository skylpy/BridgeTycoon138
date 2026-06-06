// 音频管理 mock，当前不引入真实音频资源，仅保留可扩展接口。
import { _decorator, Component } from 'cc';

const { ccclass } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
  private soundEnabled = true;

  public init(soundEnabled: boolean): void {
    this.soundEnabled = soundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public playClick(): void {
    this.playMock('click');
  }

  public playUpgrade(): void {
    this.playMock('upgrade');
  }

  public playCoin(): void {
    this.playMock('coin');
  }

  private playMock(name: string): void {
    if (!this.soundEnabled) {
      return;
    }
    console.log(`[AudioManager] 播放音效 mock: ${name}`);
  }
}

