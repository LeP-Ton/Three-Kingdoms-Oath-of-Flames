/**
 * 三国志·烈火之誓 - GBA 风格 Web Audio 音效与配乐引擎
 * 模拟 GBA 音源 (Square/Triangle/Noise/PCM)
 */

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private currentBgmNode: { stop: () => void } | null = null;
  private currentBgmName: string | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.currentBgmNode) {
      this.currentBgmNode.stop();
      this.currentBgmNode = null;
    } else if (!muted && this.currentBgmName) {
      this.playBgm(this.currentBgmName);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public startBgm(theme: string) {
    this.playBgm(theme);
  }

  public playSwordSlash() {
    this.playAttackSwing();
  }

  public playAttack() {
    this.playAttackSwing();
  }

  public playMenuSelect() {
    this.playCursorMove();
  }

  public playHit() {
    this.playHitImpact();
  }

  public playCritical() {
    this.playCritHit();
  }

  public playExpTick() {
    this.playStatDing();
  }

  public playPhaseChange() {
    this.playLevelUp();
  }

  public playVictory() {
    this.playLevelUp();
  }

  public playGameOver() {
    this.playWeaponBreak();
  }

  public playUnitSelect() {
    this.playCursorMove();
  }

  public playMoveStep() {
    this.playCursorMove();
  }

  public playItemUse() {
    this.playHeal();
  }

  // --- 音效 (SFX) ---

  // 光标移动 (清脆短暂高频哔声)
  public playCursorMove() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime); // E5
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.04); // A5

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // 菜单确认/选中 (双重清亮音)
  public playMenuConfirm() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'square';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.setValueAtTime(783.99, now + 0.06); // G5
    osc2.frequency.setValueAtTime(1046.50, now + 0.06); // C6

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.06);
    osc1.stop(now + 0.2);
    osc2.stop(now + 0.2);
  }

  // 取消/返回
  public playMenuCancel() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 武器挥舞 (呼啸声)
  public playAttackSwing() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // 白色噪声缓冲
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  // 普通击中 (金属碰撞与肉体打击声)
  public playHitImpact() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // 必杀暴击 (激烈炸裂与震击)
  public playCritHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // 冲击
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);

    // 伴随清脆必杀闪光音
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;
      const bell = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();
      bell.type = 'triangle';
      bell.frequency.setValueAtTime(1318.5, t); // E6
      bell.frequency.exponentialRampToValueAtTime(1760, t + 0.2);
      bellGain.gain.setValueAtTime(0.3, t);
      bellGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      bell.connect(bellGain);
      bellGain.connect(this.ctx.destination);
      bell.start(t);
      bell.stop(t + 0.25);
    }, 50);
  }

  // 回避闪躲 (轻灵拂过)
  public playDodge() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // 升级音效 (经典火纹三段琶音+号角)
  public playLevelUp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.12 }, // G5
      { f: 1046.5, d: 0.35 }, // C6
    ];

    let t = this.ctx.currentTime;
    notes.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(n.f, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + n.d);
      t += n.d * 0.85;
    });
  }

  // 升级单项属性增加 (清脆 Ding)
  public playStatDing() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1174.66, now); // D6
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // 恢复杖/治愈魔法
  public playHeal() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const arpeggio = [659.25, 830.61, 987.77, 1318.51]; // E maj
    let t = this.ctx.currentTime;
    arpeggio.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.2);
      t += 0.05;
    });
  }

  // 武器损毁
  public playWeaponBreak() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // 对话字打字机声音
  public playTypewriter() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440 + Math.random() * 40, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  // --- 背景音乐 (BGM) 循环合成器 ---

  public playBgm(theme: string) {
    this.currentBgmName = theme;
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // 停止当前BGM
    if (this.currentBgmNode) {
      this.currentBgmNode.stop();
      this.currentBgmNode = null;
    }

    let isPlaying = true;
    let timerId: number | null = null;

    // 旋律音符序列生成 (三国英雄主题五声音阶与GBA火纹律动)
    let melody: { note: number; dur: number }[] = [];
    let tempo = 140; // BPM

    if (theme === 'heroic' || theme === 'chinese' || theme === 'peace') {
      // 豪情壮志 / 涿县聚义 (宫商角徵羽 D, E, F#, A, B)
      tempo = 132;
      melody = [
        { note: 293.66, dur: 0.5 }, // D4
        { note: 329.63, dur: 0.5 }, // E4
        { note: 369.99, dur: 1.0 }, // F#4
        { note: 440.00, dur: 0.5 }, // A4
        { note: 369.99, dur: 0.5 }, // F#4
        { note: 493.88, dur: 1.0 }, // B4
        { note: 440.00, dur: 1.5 }, // A4
        { note: 369.99, dur: 0.5 }, // F#4
        { note: 329.63, dur: 1.0 }, // E4
        { note: 293.66, dur: 2.0 }, // D4
      ];
    } else if (theme === 'battle' || theme === 'boss') {
      // 激战 / 宛城白门楼决战 (紧凑八分音符与低音贝斯)
      tempo = 155;
      melody = [
        { note: 220.00, dur: 0.25 }, // A3
        { note: 220.00, dur: 0.25 },
        { note: 261.63, dur: 0.5 },  // C4
        { note: 293.66, dur: 0.5 },  // D4
        { note: 329.63, dur: 0.25 }, // E4
        { note: 293.66, dur: 0.25 }, // D4
        { note: 261.63, dur: 0.5 },  // C4
        { note: 246.94, dur: 0.5 },  // B3
        { note: 220.00, dur: 1.0 },  // A3
      ];
    } else {
      // 营地 / 战前整备 (舒缓小调)
      tempo = 110;
      melody = [
        { note: 392.00, dur: 1.0 }, // G4
        { note: 440.00, dur: 0.5 }, // A4
        { note: 523.25, dur: 1.0 }, // C5
        { note: 440.00, dur: 0.5 }, // A4
        { note: 392.00, dur: 1.5 }, // G4
        { note: 329.63, dur: 1.5 }, // E4
      ];
    }

    let noteIndex = 0;
    const playNextNote = () => {
      if (!isPlaying || !this.ctx || this.isMuted) return;
      const cur = melody[noteIndex];
      const noteDurSec = (cur.dur * 60) / tempo;

      const now = this.ctx.currentTime;
      // 主旋律方波
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(cur.note, now);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + noteDurSec * 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + noteDurSec);

      // 低音贝斯伴奏三角波
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(cur.note / 2, now);
      bassGain.gain.setValueAtTime(0.04, now);
      bassGain.gain.exponentialRampToValueAtTime(0.005, now + noteDurSec * 0.85);

      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + noteDurSec);

      noteIndex = (noteIndex + 1) % melody.length;
      timerId = window.setTimeout(playNextNote, noteDurSec * 1000);
    };

    playNextNote();

    this.currentBgmNode = {
      stop: () => {
        isPlaying = false;
        if (timerId !== null) {
          clearTimeout(timerId);
        }
      },
    };
  }

  public stopBgm() {
    if (this.currentBgmNode) {
      this.currentBgmNode.stop();
      this.currentBgmNode = null;
    }
    this.currentBgmName = null;
  }
}

export const audio = new RetroAudioEngine();
