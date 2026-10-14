/**
 * 三国志·烈火之誓 - 开发者与测试秘籍控制台 (Debug & Testing Console)
 * 支持 30 关任意跳转、全神兵获取、全满级属性、关卡秒胜与模式切换
 */

import React from 'react';
import { ALL_STAGES } from '../data/stagesData';
import { Unit, StageConfig } from '../types';
import { ITEMS_DATABASE } from '../data/itemsData';
import { audio } from '../audio/retroAudio';

interface DebugPanelProps {
  currentStage: StageConfig;
  party: Unit[];
  gold: number;
  casualMode: boolean;
  onClose: () => void;
  onJumpStage: (stage: StageConfig) => void;
  onWinStage: () => void;
  onUpdateParty: (newParty: Unit[]) => void;
  onUpdateGold: (newGold: number) => void;
  onToggleCasualMode: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  currentStage,
  party,
  gold,
  casualMode,
  onClose,
  onJumpStage,
  onWinStage,
  onUpdateParty,
  onUpdateGold,
  onToggleCasualMode,
}) => {
  // 全神兵赋予
  const giveAllDivineWeapons = () => {
    audio.playLevelUp();
    const divineKeys = [
      'green_dragon_blade',
      'snake_spear',
      'twin_swords',
      'fangtian_halberd',
      'qinggang_sword',
      'taiping_secret',
      'elixir',
      'master_seal',
    ];
    const newItems = divineKeys.map((k) => ({ ...ITEMS_DATABASE[k] }));

    const updatedParty = party.map((u) => ({
      ...u,
      inventory: [...newItems.slice(0, 4)],
    }));
    onUpdateParty(updatedParty);
  };

  // 全员满属性升天
  const maxStatsAll = () => {
    audio.playLevelUp();
    const updatedParty = party.map((u) => ({
      ...u,
      level: 20,
      stats: {
        hp: 60,
        maxHp: 60,
        str: 30,
        mag: 30,
        skl: 30,
        spd: 30,
        lck: 30,
        def: 30,
        res: 30,
        con: 15,
        mov: 8,
      },
    }));
    onUpdateParty(updatedParty);
  };

  return (
    <div
      id="debug-panel-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none"
      onClick={onClose}
    >
      <div
        className="gba-window w-full max-w-3xl p-5 rounded-md border-2 border-red-500 max-h-[85vh] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b border-red-500/40 mb-3">
          <h2 className="text-lg font-bold text-red-400 pixel-font flex items-center space-x-2">
            <span>⚙ 开发者秘籍与全关卡跳转调试台</span>
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 text-sm font-bold cursor-pointer"
          >
            ✕ 退出控制台
          </button>
        </div>

        {/* 快捷秘籍按钮 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs">
          <button
            onClick={onWinStage}
            className="p-2 bg-emerald-900 hover:bg-emerald-800 text-emerald-100 font-bold rounded border border-emerald-500 cursor-pointer"
          >
            ★ 立即胜利当前关卡
          </button>
          <button
            onClick={() => onUpdateGold(gold + 10000)}
            className="p-2 bg-amber-900 hover:bg-amber-800 text-amber-100 font-bold rounded border border-amber-500 cursor-pointer"
          >
            +10000 军资赏金
          </button>
          <button
            onClick={giveAllDivineWeapons}
            className="p-2 bg-purple-900 hover:bg-purple-800 text-purple-100 font-bold rounded border border-purple-500 cursor-pointer"
          >
            赋予全武将神兵利器
          </button>
          <button
            onClick={maxStatsAll}
            className="p-2 bg-blue-900 hover:bg-blue-800 text-blue-100 font-bold rounded border border-blue-500 cursor-pointer"
          >
            全员属性一键封顶 (30)
          </button>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-stone-900 rounded border border-stone-800 mb-3 text-xs">
          <span className="text-stone-300">游戏模式 (当前: {casualMode ? '轻松不死人' : '经典火纹倒下永久退场'})</span>
          <button
            onClick={onToggleCasualMode}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold rounded border border-amber-500/40 cursor-pointer"
          >
            切换模式
          </button>
        </div>

        {/* 30 关自由选关跳转 */}
        <div className="flex-1 overflow-y-auto pr-1 gba-scroll border border-stone-800 rounded p-2 bg-stone-950/60">
          <div className="text-xs text-amber-300 font-bold mb-2">跳转直达全部 30 战役关卡:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {ALL_STAGES.map((stg) => {
              const isCurrent = stg.id === currentStage.id;
              return (
                <button
                  key={stg.id}
                  onClick={() => {
                    audio.playMenuConfirm();
                    onJumpStage(stg);
                    onClose();
                  }}
                  className={`p-2 rounded text-left border transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-amber-400 bg-amber-950 text-amber-200 font-bold'
                      : 'border-stone-800 bg-stone-900/80 hover:bg-stone-800 text-stone-300'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-bold text-amber-300">{stg.title}</span>
                    {stg.isSecret && (
                      <span className="text-[10px] bg-red-950 text-red-300 px-1 rounded border border-red-800">
                        隐藏
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] truncate mt-0.5 text-stone-400">{stg.subtitle}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
