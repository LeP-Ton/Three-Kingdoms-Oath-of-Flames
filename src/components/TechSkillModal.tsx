/**
 * 三国志·烈火之誓 - 未来智能战枢科技技能释放界面
 * 满足需求：玩家扮演未来智能机器人，技能设计具备未来科技特点（离子光刃、量子雷达、纳米修复、EMP等）
 */

import React, { useState } from 'react';
import { Unit, TechSkillId } from '../types';
import { TECH_SKILLS, getRankByMerits } from '../data/techSkillsData';
import { getDistance } from '../game/pathfinding';
import { audio } from '../audio/retroAudio';

interface TechSkillModalProps {
  actor: Unit;
  allUnits: Unit[];
  battleMerits: number;
  onExecuteSkill: (
    skillId: TechSkillId,
    targetUnit?: Unit,
    effectResult?: { message: string; soundType?: string }
  ) => void;
  onClose: () => void;
}

export function TechSkillModal({
  actor,
  allUnits,
  battleMerits,
  onExecuteSkill,
  onClose,
}: TechSkillModalProps) {
  const [selectedSkillId, setSelectedSkillId] = useState<TechSkillId>('plasma_slash');
  const [targetingSkill, setTargetingSkill] = useState<TechSkillId | null>(null);

  const energy = actor.energy ?? 60;
  const maxEnergy = actor.maxEnergy ?? 60;
  const currentRank = getRankByMerits(battleMerits);

  const selectedSkill = TECH_SKILLS[selectedSkillId];

  // 计算可选择的目标
  const getTargetsForSkill = (skillId: TechSkillId): Unit[] => {
    const skill = TECH_SKILLS[skillId];
    const living = allUnits.filter((u) => u.isAlive);

    if (skill.targetType === 'self') {
      return [actor];
    }
    if (skill.targetType === 'ally') {
      return living.filter(
        (u) =>
          (u.faction === 'player' || u.faction === 'ally') &&
          getDistance(actor.x, actor.y, u.x, u.y) <= skill.range
      );
    }
    if (skill.targetType === 'enemy') {
      return living.filter(
        (u) => u.faction === 'enemy' && getDistance(actor.x, actor.y, u.x, u.y) <= skill.range
      );
    }
    if (skill.targetType === 'area') {
      return [actor];
    }
    return [];
  };

  const handleStartTargeting = (skillId: TechSkillId) => {
    const skill = TECH_SKILLS[skillId];
    if (energy < skill.energyCost) {
      alert(`能量储备不足！当前能量 ${energy}，释放需要 ${skill.energyCost}！`);
      return;
    }
    if (currentRank.rankLevel < skill.unlockRank) {
      alert(`军阶未达标！需要晋升至【第 ${skill.unlockRank} 阶】方可解锁该战枢协议！`);
      return;
    }

    if (skill.targetType === 'self' || skill.targetType === 'area') {
      // 立即对自身或全域生效
      handleConfirmSkill(skillId, actor);
    } else {
      setTargetingSkill(skillId);
    }
  };

  const handleConfirmSkill = (skillId: TechSkillId, targetUnit?: Unit) => {
    const skill = TECH_SKILLS[skillId];
    audio.playLevelUp();

    let message = '';
    if (skillId === 'plasma_slash') {
      message = `【高频离子斩】超周波撕裂护甲！对 ${targetUnit?.name} 造成致命等离子伤害！`;
    } else if (skillId === 'tactical_radar') {
      message = `【量子战术雷达】全息启动！3格范围内全体友军命中率+25%、回避率+20%、必杀率+15%！`;
    } else if (skillId === 'nanite_repair') {
      message = `【纳米修复矩阵】自复制纳米集群生效！为 ${targetUnit?.name} 修复机体创伤，生命值+22！`;
    } else if (skillId === 'emp_shock') {
      message = `【电磁脉冲过载】微波EMP定向释放！${targetUnit?.name} 武器机能过载瘫痪，无法反击！`;
    } else if (skillId === 'kinetic_shield') {
      message = `【动能偏转护盾】蜂窝偏转力场充能完毕！生成可吸收25点伤害的光子护盾！`;
    } else if (skillId === 'orbital_strike') {
      message = `【轨道动能校准】轨道钨合金动能弹轰击！对目标及周围造成范围毁灭性打击！`;
    }

    onExecuteSkill(skillId, targetUnit, { message });
  };

  return (
    <div
      id="tech-skill-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 select-none animate-fade-in"
    >
      <div className="gba-window w-full max-w-2xl rounded-lg border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.35)] flex flex-col overflow-hidden bg-stone-950 text-stone-100 font-sans">
        {/* 顶部标题与能量状态 */}
        <div className="px-4 py-3 bg-gradient-to-r from-stone-950 via-cyan-950/90 to-stone-950 border-b border-cyan-500/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#06b6d4]" />
            <h2 className="text-base font-black text-cyan-300 pixel-font tracking-widest">
              时空战枢 · 未来科技战术协议
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-xs font-mono bg-black/60 px-3 py-1 rounded border border-cyan-500/40 flex items-center space-x-2">
              <span className="text-stone-400">等离子能源:</span>
              <span className="text-cyan-400 font-bold">
                {energy} / {maxEnergy}
              </span>
              <div className="w-14 h-2 bg-stone-900 rounded-full overflow-hidden border border-cyan-500/40">
                <div
                  className="h-full bg-cyan-400 transition-all"
                  style={{ width: `${(energy / maxEnergy) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => {
                audio.playMenuCancel();
                onClose();
              }}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-600 text-xs cursor-pointer"
            >
              取消 ✕
            </button>
          </div>
        </div>

        {/* 主体：目标选择模式 或 技能选择模式 */}
        {targetingSkill ? (
          <div className="p-4 space-y-4">
            <div className="text-xs font-bold text-cyan-300 flex items-center justify-between">
              <span>请选择【{TECH_SKILLS[targetingSkill].name}】的施放目标：</span>
              <button
                onClick={() => setTargetingSkill(null)}
                className="text-stone-400 hover:text-white text-xs underline cursor-pointer"
              >
                ◀ 返回技能列表
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto gba-scroll pr-1">
              {getTargetsForSkill(targetingSkill).length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-400 border border-stone-800 rounded bg-stone-900/50">
                  射程范围内没有符合条件的生效目标！
                </div>
              ) : (
                getTargetsForSkill(targetingSkill).map((target) => (
                  <div
                    key={target.id}
                    onClick={() => handleConfirmSkill(targetingSkill, target)}
                    className="p-3 rounded border border-cyan-500/40 hover:border-cyan-300 bg-stone-900 hover:bg-cyan-950/60 cursor-pointer flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-amber-200">{target.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-black/60 text-stone-300 border border-stone-700">
                        {target.title}
                      </span>
                      <span className="text-xs font-mono text-stone-400">
                        HP: {target.stats.hp}/{target.stats.maxHp}
                      </span>
                    </div>

                    <button className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs rounded border border-cyan-300 cursor-pointer">
                      锁定释放 ▶
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto gba-scroll">
            {Object.values(TECH_SKILLS).map((skill) => {
              const isUnlocked = currentRank.rankLevel >= skill.unlockRank;
              const hasEnergy = energy >= skill.energyCost;
              const isSelected = skill.id === selectedSkillId;

              return (
                <div
                  key={skill.id}
                  onClick={() => setSelectedSkillId(skill.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-stone-900/80 border-stone-800 hover:border-cyan-500/50'
                  } ${!isUnlocked ? 'opacity-50' : ''}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-cyan-200">{skill.name}</span>
                        <span className="text-[10px] text-stone-400 font-mono">({skill.nameEn})</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        消耗 {skill.energyCost} 能量
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-300 leading-snug mb-2">
                      {skill.description}
                    </div>

                    <div className="p-2 rounded bg-black/60 border border-cyan-500/30 text-[11px] text-cyan-300 font-mono leading-relaxed">
                      ★ 战术效果：{skill.techEffectText}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-800 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 font-mono">
                      射程: {skill.range === 0 ? '自身' : `${skill.range} 格`} · 需求品阶:{' '}
                      {skill.unlockRank}
                    </span>

                    <button
                      disabled={!isUnlocked || !hasEnergy}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartTargeting(skill.id);
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition-all border ${
                        isUnlocked && hasEnergy
                          ? 'bg-cyan-500 hover:bg-cyan-400 text-stone-950 border-cyan-200 shadow'
                          : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                      }`}
                    >
                      {!isUnlocked ? '品阶未达' : !hasEnergy ? '能源不足' : '激活释放 ▶'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 底部说明 */}
        <div className="px-4 py-2 bg-stone-900/90 border-t border-cyan-500/30 text-[11px] text-stone-400 flex items-center justify-between flex-shrink-0">
          <span>🤖 战枢机体每回合开始时自动回充 10 点等离子能源。</span>
          <span className="text-cyan-400 font-mono">MODEL: XUANXIAO CHRONOS-VII</span>
        </div>
      </div>
    </div>
  );
}
