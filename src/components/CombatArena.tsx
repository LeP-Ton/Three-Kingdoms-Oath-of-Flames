/**
 * 三国志·烈火之誓 - GBA 经典战斗交锋视窗 (Combat Duel Arena)
 * 完整还原 GBA 火纹经典 1v1 动画、血条消减、暴击特效、追击、经验条滚动
 */

import React, { useState, useEffect, useRef } from 'react';
import { Unit, CombatForecast, CombatAction, TerrainType, LevelUpGain } from '../types';
import { simulateCombat, rollLevelUp, applyLevelUp } from '../game/combatEngine';
import { getUnitSpriteUrl, getPortraitDataUrl } from '../graphics/pixelAssets';
import { audio } from '../audio/retroAudio';

interface CombatArenaProps {
  attacker: Unit;
  defender: Unit;
  distance: number;
  attackerTerrain?: TerrainType;
  defenderTerrain?: TerrainType;
  onFinishCombat: (result: {
    attacker: Unit;
    defender: Unit;
    attackerDied: boolean;
    defenderDied: boolean;
    levelUpGain: LevelUpGain | null;
  }) => void;
}

export const CombatArena: React.FC<CombatArenaProps> = ({
  attacker,
  defender,
  distance,
  attackerTerrain = TerrainType.Plains,
  defenderTerrain = TerrainType.Plains,
  onFinishCombat,
}) => {
  // 战斗模拟预结算
  const [simulationResult] = useState(() =>
    simulateCombat(attacker, defender, distance, defenderTerrain, attackerTerrain)
  );

  // 战斗实时状态
  const [attackerHp, setAttackerHp] = useState(attacker.stats.hp);
  const [defenderHp, setDefenderHp] = useState(defender.stats.hp);
  const [actionIndex, setActionIndex] = useState(-1);
  const [currentFloatingText, setCurrentFloatingText] = useState<{
    text: string;
    target: 'left' | 'right';
    isCrit?: boolean;
  } | null>(null);

  // 动画视觉特效
  const [screenShake, setScreenShake] = useState(false);
  const [flashWhite, setFlashWhite] = useState(false);
  const [attackerAnim, setAttackerAnim] = useState<'idle' | 'attack' | 'dodge' | 'hit'>('idle');
  const [defenderAnim, setDefenderAnim] = useState<'idle' | 'attack' | 'dodge' | 'hit'>('idle');

  // 经验结算阶段
  const [phase, setPhase] = useState<'combat' | 'exp' | 'done'>('combat');
  const [expBarCurrent, setExpBarCurrent] = useState(attacker.exp);
  const [expTarget, setExpTarget] = useState(attacker.exp);
  const [levelUpGain, setLevelUpGain] = useState<LevelUpGain | null>(null);

  const hasFinishedRef = useRef(false);

  // 自动播放战斗行动序列
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const actions = simulationResult.actions;

    if (actionIndex === -1) {
      // 战前开局微延时
      timer = setTimeout(() => {
        setActionIndex(0);
      }, 600);
      return () => clearTimeout(timer);
    }

    if (actionIndex < actions.length) {
      const act = actions[actionIndex];
      const isAttackerAction = act.isAttacker;

      // 1. 发动攻击动作
      if (isAttackerAction) {
        setAttackerAnim('attack');
        audio.playSwordSlash();
      } else {
        setDefenderAnim('attack');
        audio.playSwordSlash();
      }

      // 2. 命中/暴击与受击反馈
      const hitTimer = setTimeout(() => {
        if (act.isHit) {
          if (act.isCrit) {
            audio.playCritical();
            setScreenShake(true);
            setFlashWhite(true);
            setTimeout(() => {
              setScreenShake(false);
              setFlashWhite(false);
            }, 350);
          } else {
            audio.playHit();
          }

          if (isAttackerAction) {
            setDefenderAnim('hit');
            setDefenderHp(act.defenderHpRemaining);
            setCurrentFloatingText({
              text: act.isCrit ? `必杀! -${act.damage}` : `-${act.damage}`,
              target: 'right',
              isCrit: act.isCrit,
            });
          } else {
            setAttackerAnim('hit');
            setAttackerHp(act.attackerHpRemaining);
            setCurrentFloatingText({
              text: act.isCrit ? `必杀! -${act.damage}` : `-${act.damage}`,
              target: 'left',
              isCrit: act.isCrit,
            });
          }
        } else {
          // 未命中 / 闪避
          audio.playDodge();
          if (isAttackerAction) {
            setDefenderAnim('dodge');
            setCurrentFloatingText({ text: '回避!', target: 'right' });
          } else {
            setAttackerAnim('dodge');
            setCurrentFloatingText({ text: '回避!', target: 'left' });
          }
        }

        if (act.weaponBroke) {
          audio.playWeaponBreak();
        }

        // 重置姿态
        setTimeout(() => {
          setAttackerAnim('idle');
          setDefenderAnim('idle');
          setCurrentFloatingText(null);
        }, 500);
      }, 350);

      // 3. 推进到下一回合行动
      const nextTimer = setTimeout(() => {
        setActionIndex(actionIndex + 1);
      }, 1000);

      return () => {
        clearTimeout(hitTimer);
        clearTimeout(nextTimer);
      };
    } else {
      // 战斗行动全部结束，进入经验结算
      if (attacker.faction === 'player' && simulationResult.expGained > 0) {
        setPhase('exp');
        const nextTotalExp = attacker.exp + simulationResult.expGained;
        setExpTarget(nextTotalExp);
      } else {
        finishAndClose();
      }
    }
  }, [actionIndex]);

  // 经验条滚动动画
  useEffect(() => {
    if (phase !== 'exp') return;

    let current = expBarCurrent;
    const interval = setInterval(() => {
      if (current < expTarget) {
        current += 1;
        setExpBarCurrent(current);
        audio.playExpTick();

        // 达到 100 经验升级
        if (current >= 100 && !levelUpGain) {
          const gains = rollLevelUp(attacker);
          setLevelUpGain(gains);
          audio.playLevelUp();
        }
      } else {
        clearInterval(interval);
        setTimeout(() => {
          finishAndClose();
        }, 800);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [phase, expTarget, expBarCurrent, levelUpGain]);

  const finishAndClose = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    let updatedAttacker = {
      ...attacker,
      stats: { ...attacker.stats, hp: attackerHp },
      exp: expBarCurrent >= 100 ? expBarCurrent - 100 : expBarCurrent,
      isAlive: attackerHp > 0,
      hasActed: true,
    };

    if (levelUpGain) {
      updatedAttacker = applyLevelUp(updatedAttacker, levelUpGain);
    }

    const updatedDefender = {
      ...defender,
      stats: { ...defender.stats, hp: defenderHp },
      isAlive: defenderHp > 0,
    };

    onFinishCombat({
      attacker: updatedAttacker,
      defender: updatedDefender,
      attackerDied: attackerHp <= 0,
      defenderDied: defenderHp <= 0,
      levelUpGain,
    });
  };

  const atkWeapon = attacker.inventory[attacker.equippedWeaponIndex] || null;
  const defWeapon = defender.inventory[defender.equippedWeaponIndex] || null;

  return (
    <div
      id="combat-arena-screen"
      className={`fixed inset-0 z-50 flex flex-col bg-stone-950 text-stone-100 select-none overflow-hidden ${
        screenShake ? 'animate-shake' : ''
      }`}
    >
      {/* 暴击白光闪烁层 */}
      {flashWhite && <div className="absolute inset-0 bg-white z-50 pointer-events-none opacity-80" />}

      {/* 顶部快捷跳过按钮 (触控优先) */}
      <button
        id="quick-skip-combat-btn"
        onClick={finishAndClose}
        className="absolute top-2 right-2 z-30 px-3 py-1.5 min-h-[40px] text-xs font-bold text-amber-200 bg-amber-950/90 active:bg-amber-800 border border-amber-500/60 rounded shadow cursor-pointer active:scale-95"
      >
        跳过交锋 ▶
      </button>

      {/* 战斗舞台上部 (双人格斗场景) */}
      <div className="relative flex-1 bg-gradient-to-b from-stone-900 via-stone-800 to-amber-950/40 flex items-center justify-between px-3 sm:px-8 md:px-24 overflow-hidden">
        {/* 远景山川或古城背景图案 */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-700 via-stone-900 to-black" />

        {/* 战斗对决台地面基座 */}
        <div className="absolute bottom-6 left-8 right-8 h-12 bg-amber-950/80 border-t-2 border-amber-600/60 rounded-full blur-[1px] opacity-75" />

        {/* 左侧发起方 (玩家或敌方) */}
        <div className="relative flex flex-col items-center z-10">
          {/* 浮动伤害文本 */}
          {currentFloatingText && currentFloatingText.target === 'left' && (
            <div
              className={`absolute -top-12 text-2xl md:text-3xl font-black pixel-font animate-bounce ${
                currentFloatingText.isCrit ? 'text-yellow-300 scale-125' : 'text-red-400'
              }`}
            >
              {currentFloatingText.text}
            </div>
          )}
          {/* 单位精灵图形 */}
          <div
            className={`transition-transform duration-200 ${
              attackerAnim === 'attack'
                ? 'translate-x-12 scale-110'
                : attackerAnim === 'dodge'
                ? '-translate-x-8'
                : attackerAnim === 'hit'
                ? '-translate-x-4 opacity-75'
                : ''
            }`}
          >
            <img
              src={getUnitSpriteUrl(attacker.characterId, attacker.unitClass, attacker.faction, 1)}
              alt={attacker.name}
              className="w-24 h-24 md:w-32 md:h-32 object-contain pixelated drop-shadow-2xl"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="mt-2 text-sm font-bold text-amber-300 bg-black/60 px-3 py-0.5 rounded-full border border-amber-500/40">
            {attacker.name}
          </div>
        </div>

        {/* VS 徽记 */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="text-3xl md:text-4xl font-black text-amber-400 italic tracking-wider drop-shadow-lg pixel-font">
            VS
          </div>
          {phase === 'exp' && (
            <div className="text-xs text-green-400 font-bold mt-2 animate-pulse">
              获得经验 +{simulationResult.expGained}
            </div>
          )}
        </div>

        {/* 右侧防守方 */}
        <div className="relative flex flex-col items-center z-10">
          {currentFloatingText && currentFloatingText.target === 'right' && (
            <div
              className={`absolute -top-12 text-2xl md:text-3xl font-black pixel-font animate-bounce ${
                currentFloatingText.isCrit ? 'text-yellow-300 scale-125' : 'text-red-400'
              }`}
            >
              {currentFloatingText.text}
            </div>
          )}
          <div
            className={`transition-transform duration-200 ${
              defenderAnim === 'attack'
                ? '-translate-x-12 scale-110'
                : defenderAnim === 'dodge'
                ? 'translate-x-8'
                : defenderAnim === 'hit'
                ? 'translate-x-4 opacity-75'
                : ''
            }`}
          >
            <img
              src={getUnitSpriteUrl(defender.characterId, defender.unitClass, defender.faction, 1)}
              alt={defender.name}
              className="w-24 h-24 md:w-32 md:h-32 object-contain pixelated scale-x-[-1] drop-shadow-2xl"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="mt-2 text-sm font-bold text-amber-300 bg-black/60 px-3 py-0.5 rounded-full border border-amber-500/40">
            {defender.name}
          </div>
        </div>
      </div>

      {/* 战斗下部 - 汉代黑漆金边对决仪表盘 */}
      <div className="h-auto min-h-[110px] md:h-44 bg-[#140d09] border-t-2 border-amber-600/80 p-2 sm:p-3 grid grid-cols-2 gap-2 sm:gap-3 z-20">
        {/* 左侧攻方仪表板 */}
        <div className="gba-window p-2 sm:p-3 flex flex-col justify-between rounded-sm">
          <div className="flex items-center justify-between border-b border-amber-400/30 pb-1">
            <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
              <img
                src={getPortraitDataUrl(attacker.characterId, 'normal', attacker.faction)}
                alt={attacker.name}
                className="w-7 h-7 sm:w-8 sm:h-8 object-cover pixelated rounded border border-amber-400 bg-stone-950 shadow flex-shrink-0"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="min-w-0">
                <span className="font-bold text-amber-200 text-xs sm:text-sm md:text-base truncate block">
                  {attacker.name}
                </span>
                <span className="text-[10px] text-stone-300 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-500/30 font-mono">
                  Lv {attacker.level}
                </span>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs text-amber-300 truncate max-w-[80px] sm:max-w-[120px]">
              {atkWeapon ? `${atkWeapon.name} (${atkWeapon.uses})` : '无武器'}
            </span>
          </div>

          {/* 血条 */}
          <div className="my-1">
            <div className="flex justify-between text-[11px] sm:text-xs font-mono text-stone-200 mb-0.5">
              <span>HP</span>
              <span className="font-bold">
                {attackerHp} / {attacker.stats.maxHp}
              </span>
            </div>
            <div className="w-full h-2.5 sm:h-3 bg-stone-950 rounded-xs overflow-hidden border border-amber-500/40 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300"
                style={{ width: `${Math.max(0, (attackerHp / attacker.stats.maxHp) * 100)}%` }}
              />
            </div>
          </div>

          {/* 经验条 (若是玩家单位) */}
          {attacker.faction === 'player' && (
            <div className="text-[10px] sm:text-[11px] font-mono flex items-center justify-between text-stone-300">
              <span>EXP</span>
              <div className="w-3/4 h-1.5 sm:h-2 bg-stone-950 rounded-xs border border-amber-500/30 overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-100"
                  style={{ width: `${Math.min(100, expBarCurrent)}%` }}
                />
              </div>
              <span>{expBarCurrent % 100}</span>
            </div>
          )}
        </div>

        {/* 右侧守方仪表板 */}
        <div className="gba-window p-2 sm:p-3 flex flex-col justify-between rounded-sm">
          <div className="flex items-center justify-between border-b border-amber-400/30 pb-1">
            <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
              <img
                src={getPortraitDataUrl(defender.characterId, 'normal', defender.faction)}
                alt={defender.name}
                className="w-7 h-7 sm:w-8 sm:h-8 object-cover pixelated rounded border border-red-400 bg-stone-950 shadow flex-shrink-0"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="min-w-0">
                <span className="font-bold text-amber-200 text-xs sm:text-sm md:text-base truncate block">
                  {defender.name}
                </span>
                <span className="text-[10px] text-stone-300 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-500/30 font-mono">
                  Lv {defender.level}
                </span>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs text-amber-300 truncate max-w-[80px] sm:max-w-[120px]">
              {defWeapon ? `${defWeapon.name} (${defWeapon.uses})` : '无武器'}
            </span>
          </div>

          {/* 血条 */}
          <div className="my-1">
            <div className="flex justify-between text-[11px] sm:text-xs font-mono text-stone-200 mb-0.5">
              <span>HP</span>
              <span className="font-bold">
                {defenderHp} / {defender.stats.maxHp}
              </span>
            </div>
            <div className="w-full h-2.5 sm:h-3 bg-stone-950 rounded-xs overflow-hidden border border-amber-500/40 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-300"
                style={{ width: `${Math.max(0, (defenderHp / defender.stats.maxHp) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              id="skip-combat-btn"
              onClick={finishAndClose}
              className="text-[11px] text-stone-400 hover:text-amber-300 px-2 py-0.5 rounded border border-stone-700 hover:border-amber-400 cursor-pointer min-h-[30px]"
            >
              跳过 [Space]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
