/**
 * 三国志·烈火之誓 - 直属小队整编与战功授印晋阶界面
 * 满足需求：玩家扮演未来智能机器人，初始无直属部队，通过获得战功升职招揽更多直属下属！
 */

import React from 'react';
import { Unit } from '../types';
import { MILITARY_RANKS, getRankByMerits, SQUAD_CANDIDATES, DirectSquadCandidate } from '../data/techSkillsData';
import { getPortraitDataUrl } from '../graphics/pixelAssets';
import { audio } from '../audio/retroAudio';

interface DirectSquadModalProps {
  battleMerits: number;
  gold: number;
  party: Unit[];
  onUpdateParty: (newParty: Unit[]) => void;
  onUpdateGold: (newGold: number) => void;
  onClose: () => void;
}

export function DirectSquadModal({
  battleMerits,
  gold,
  party,
  onUpdateParty,
  onUpdateGold,
  onClose,
}: DirectSquadModalProps) {
  // 当前军阶
  const currentRank = getRankByMerits(battleMerits);
  const nextRank = MILITARY_RANKS.find((r) => r.rankLevel === currentRank.rankLevel + 1);

  // 当前直属小队成员 (非主角且标记为 isDirectSquad)
  const currentDirectSquad = party.filter((u) => u.isDirectSquad);
  const directSquadCount = currentDirectSquad.length;
  const squadCap = currentRank.squadCap;

  // 晋升进度百分比
  const progressPercent = nextRank
    ? Math.min(
        100,
        Math.floor(
          ((battleMerits - currentRank.requiredMerits) /
            (nextRank.requiredMerits - currentRank.requiredMerits)) *
            100
        )
      )
    : 100;

  // 招揽新直属卫士
  const handleRecruitCandidate = (candidate: DirectSquadCandidate) => {
    if (directSquadCount >= squadCap) {
      alert(`当前军阶【${currentRank.title}】的直属部队编制上限为 ${squadCap} 人！需获得更高战功晋升后扩编！`);
      return;
    }
    if (gold < candidate.costGold) {
      alert(`军饷不足！招募该兵种需要 ${candidate.costGold} 铜钱！`);
      return;
    }

    try {
      audio.playLevelUp();
    } catch (e) {
      console.warn(e);
    }

    const newUnit = candidate.createUnit();
    onUpdateGold(gold - candidate.costGold);
    onUpdateParty([...party, newUnit]);
  };

  // 遣散直属卫士
  const handleDismissUnit = (unitId: string) => {
    const unitToDismiss = party.find((u) => u.id === unitId);
    if (!unitToDismiss) return;

    if (confirm(`确定要遣散直属下属【${unitToDismiss.name}】吗？`)) {
      audio.playMenuCancel();
      onUpdateParty(party.filter((u) => u.id !== unitId));
    }
  };

  return (
    <div
      id="direct-squad-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 select-none animate-fade-in"
    >
      <div className="gba-window w-full max-w-4xl max-h-[92vh] rounded-lg border-2 border-amber-500/80 shadow-[0_0_35px_rgba(245,158,11,0.3)] flex flex-col overflow-hidden bg-stone-950 text-stone-100">
        {/* 标题栏 */}
        <div className="px-4 py-3 bg-gradient-to-r from-stone-900 via-cyan-950/80 to-stone-900 border-b border-amber-500/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#06b6d4]" />
            <h2 className="text-base sm:text-lg font-black text-amber-300 pixel-font tracking-widest">
              直属战术小队整编与战功授印司
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-amber-300 bg-black/50 px-2 py-0.5 rounded border border-amber-500/30">
              军饷: <span className="font-bold text-yellow-400">{gold}</span> 金
            </span>
            <button
              onClick={() => {
                audio.playMenuCancel();
                onClose();
              }}
              className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-amber-200 rounded border border-amber-500/40 text-xs font-bold cursor-pointer"
            >
              返回 ✕
            </button>
          </div>
        </div>

        {/* 战功与官阶核心信息卡 */}
        <div className="p-4 bg-gradient-to-b from-stone-900/90 to-stone-950/90 border-b border-amber-500/30 flex-shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-stone-400">当前战功与官职：</span>
                <span className="text-base sm:text-lg font-black text-amber-300 pixel-font">
                  【{currentRank.title}】
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500 text-cyan-300 font-mono">
                  品阶 {currentRank.rankLevel} / 6
                </span>
              </div>
              <div className="text-xs text-stone-300 mt-1">{currentRank.description}</div>
            </div>

            <div className="flex items-center gap-3 bg-stone-950/80 px-3 py-2 rounded border border-amber-500/40">
              <div className="text-center">
                <div className="text-[10px] text-stone-400">累积战功</div>
                <div className="text-base font-black text-amber-400 font-mono">{battleMerits}</div>
              </div>
              <div className="w-[1px] h-6 bg-stone-700" />
              <div className="text-center">
                <div className="text-[10px] text-stone-400">直属编制</div>
                <div className="text-base font-black text-cyan-400 font-mono">
                  {directSquadCount} / {squadCap} 人
                </div>
              </div>
            </div>
          </div>

          {/* 晋阶进度条 */}
          {nextRank ? (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-stone-300">
                  距离晋升【{nextRank.title}】（编制上限扩增至 {nextRank.squadCap} 人）:
                </span>
                <span className="text-amber-400 font-bold">
                  {battleMerits} / {nextRank.requiredMerits} 战功 ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-stone-900 rounded-full overflow-hidden border border-amber-500/30 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-[10px] text-amber-300/80">
                ★ 升职奖励：{nextRank.rankReward}
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-300 font-bold">
              ★ 功勋卓著！已达成东汉最高军阶【前军大都督】，直属卫队已达 5 人最大编制上限！
            </div>
          )}
        </div>

        {/* 左右分栏：当前直属编制 VS 可招揽兵种 */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-3 gap-3">
          {/* 左侧：已编入的直属卫士 */}
          <div className="w-full md:w-1/2 flex flex-col bg-stone-900/60 rounded border border-amber-500/30 overflow-hidden">
            <div className="px-3 py-2 bg-stone-900 border-b border-amber-500/30 flex justify-between items-center text-xs font-bold text-amber-300">
              <span>当前直属小队成员 ({directSquadCount} / {squadCap})</span>
              <span className="text-[10px] text-cyan-400">战术协同护卫</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 gba-scroll">
              {currentDirectSquad.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-stone-400">
                  <div className="text-3xl mb-2">🛡️</div>
                  <div className="text-xs font-bold text-amber-300 mb-1">
                    当前暂无直属编制部队
                  </div>
                  <div className="text-[11px] text-stone-400 max-w-xs leading-relaxed">
                    初始机体以客卿身份独身协助刘备。请通过参战获得战功升职，右侧招募直属卫士随同战枢出征！
                  </div>
                </div>
              ) : (
                currentDirectSquad.map((unit) => (
                  <div
                    key={unit.id}
                    className="p-2.5 rounded bg-stone-950/80 border border-amber-500/30 flex items-center justify-between gap-3 shadow"
                  >
                    <div className="flex items-center space-x-2.5">
                      <img
                        src={getPortraitDataUrl(unit.portraitId, 'normal')}
                        alt={unit.name}
                        className="w-11 h-11 object-cover pixelated rounded border border-amber-500/50 bg-stone-900 shadow"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-amber-200">{unit.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono">
                            {unit.squadRole || '直属卫士'}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                          Lv.{unit.level} · HP:{unit.stats.hp}/{unit.stats.maxHp} · 力:{unit.stats.str} · 防:{unit.stats.def} · 技:{unit.stats.skl}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDismissUnit(unit.id)}
                      className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-200 rounded border border-red-800 text-[10px] font-bold cursor-pointer"
                    >
                      遣散
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 右侧：可招揽的直属兵种候补 */}
          <div className="w-full md:w-1/2 flex flex-col bg-stone-900/60 rounded border border-amber-500/30 overflow-hidden">
            <div className="px-3 py-2 bg-stone-900 border-b border-amber-500/30 flex justify-between items-center text-xs font-bold text-amber-300">
              <span>可招募直属特种编制</span>
              <span className="text-[10px] text-amber-400 font-mono">战功达标自动解锁</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 gba-scroll">
              {SQUAD_CANDIDATES.map((cand) => {
                const isUnlocked = currentRank.rankLevel >= cand.requiredRank;
                const canAfford = gold >= cand.costGold;
                const hasCapacity = directSquadCount < squadCap;

                return (
                  <div
                    key={cand.id}
                    className={`p-2.5 rounded border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      isUnlocked
                        ? 'bg-stone-950/80 border-amber-500/40 shadow-sm'
                        : 'bg-stone-950/40 border-stone-800 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-amber-200">{cand.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 border border-stone-700">
                          {cand.role}
                        </span>
                        {!isUnlocked && (
                          <span className="text-[10px] text-red-400 font-mono">
                            [需官阶 {cand.requiredRank}]
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-400 mt-1 leading-snug">
                        {cand.description}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-yellow-400">
                        {cand.costGold} 金
                      </span>
                      <button
                        disabled={!isUnlocked || !canAfford || !hasCapacity}
                        onClick={() => handleRecruitCandidate(cand)}
                        className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition-all border ${
                          isUnlocked && canAfford && hasCapacity
                            ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-300 shadow'
                            : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                        }`}
                      >
                        {!isUnlocked
                          ? '官阶未达'
                          : !hasCapacity
                          ? '编制已满'
                          : !canAfford
                          ? '铜钱不足'
                          : '招募入伍'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-2.5 bg-stone-900 border-t border-amber-500/30 flex items-center justify-between text-xs text-stone-400 flex-shrink-0">
          <div className="flex items-center space-x-1.5">
            <span className="text-amber-400 font-bold">★ 战功获取途径：</span>
            <span>击败敌兵 (+15)、斩杀敌将 (+50~100)、战役全胜 (+200)、无人阵亡 (+100)。</span>
          </div>

          <button
            onClick={() => {
              audio.playMenuConfirm();
              onClose();
            }}
            className="px-4 py-1 gba-btn font-bold text-amber-100 text-xs cursor-pointer"
          >
            整编完毕
          </button>
        </div>
      </div>
    </div>
  );
}
