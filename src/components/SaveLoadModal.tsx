/**
 * 三国志·烈火之誓 - 5 槽位存档与读档系统 (Save & Load Modal)
 * 数据持久化于本地 LocalStorage，记录关卡、回合数、金钱、队伍与剧情进度
 */

import React, { useState, useEffect } from 'react';
import { Unit, StageConfig } from '../types';
import { getPortraitDataUrl } from '../graphics/pixelAssets';
import { audio } from '../audio/retroAudio';

export interface SaveSlotData {
  slotId: number;
  timestamp: string;
  stageId: string;
  chapterTitle: string;
  stageSubtitle: string;
  turnNumber: number;
  gold: number;
  party: Unit[];
  leaderPortraitId: string;
}

interface SaveLoadModalProps {
  mode: 'save' | 'load';
  currentStage: StageConfig;
  currentTurn: number;
  currentGold: number;
  currentParty: Unit[];
  onClose: () => void;
  onLoadData: (saveData: SaveSlotData) => void;
}

const STORAGE_PREFIX = 'sanguo_fire_emblem_slot_';

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  mode,
  currentStage,
  currentTurn,
  currentGold,
  currentParty,
  onClose,
  onLoadData,
}) => {
  const [slots, setSlots] = useState<(SaveSlotData | null)[]>([null, null, null, null, null]);

  // 加载已有存档
  const reloadSlots = () => {
    const loadedSlots: (SaveSlotData | null)[] = [];
    for (let i = 1; i <= 5; i++) {
      try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${i}`);
        if (raw) {
          loadedSlots.push(JSON.parse(raw));
        } else {
          loadedSlots.push(null);
        }
      } catch (err) {
        loadedSlots.push(null);
      }
    }
    setSlots(loadedSlots);
  };

  useEffect(() => {
    reloadSlots();
  }, []);

  const handleSaveToSlot = (slotIndex: number) => {
    audio.playMenuConfirm();
    const leader = currentParty[0] || { characterId: 'liubei' };
    const saveData: SaveSlotData = {
      slotId: slotIndex + 1,
      timestamp: new Date().toLocaleString(),
      stageId: currentStage.id,
      chapterTitle: currentStage.title,
      stageSubtitle: currentStage.subtitle,
      turnNumber: currentTurn,
      gold: currentGold,
      party: currentParty,
      leaderPortraitId: leader.characterId,
    };

    localStorage.setItem(`${STORAGE_PREFIX}${slotIndex + 1}`, JSON.stringify(saveData));
    reloadSlots();
  };

  const handleLoadFromSlot = (slotData: SaveSlotData | null) => {
    if (!slotData) return;
    audio.playMenuConfirm();
    onLoadData(slotData);
    onClose();
  };

  const handleDeleteSlot = (slotIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    audio.playMenuCancel();
    localStorage.removeItem(`${STORAGE_PREFIX}${slotIndex + 1}`);
    reloadSlots();
  };

  return (
    <div
      id="save-load-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none"
      onClick={onClose}
    >
      <div
        className="gba-window w-full max-w-2xl p-5 rounded-md shadow-2xl border-2 border-amber-400"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b border-amber-500/40 mb-4">
          <h2 className="text-xl font-bold text-amber-300 pixel-font">
            {mode === 'save' ? '记录军机档案 (存档)' : '调阅往昔战卷 (读档)'}
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-amber-200 text-sm font-bold px-2 py-1 cursor-pointer"
          >
            ✕ 关闭
          </button>
        </div>

        {/* 5 个存档槽位列表 */}
        <div className="space-y-2.5">
          {slots.map((slot, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (mode === 'save') {
                  handleSaveToSlot(idx);
                } else if (slot) {
                  handleLoadFromSlot(slot);
                }
              }}
              className={`p-3 rounded border transition-all flex items-center justify-between cursor-pointer ${
                slot
                  ? 'bg-stone-900/90 border-amber-500/40 hover:border-amber-300 hover:bg-stone-800'
                  : 'bg-stone-900/40 border-stone-800 hover:border-stone-600'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-sm font-bold text-amber-400 font-mono w-14">
                  槽位 {idx + 1}
                </span>

                {slot ? (
                  <div className="flex items-center space-x-3">
                    <img
                      src={getPortraitDataUrl(slot.leaderPortraitId, 'normal', 'player' as any)}
                      alt="主将"
                      className="w-10 h-10 object-cover pixelated rounded border border-amber-400 bg-stone-950"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <div>
                      <div className="text-sm font-bold text-amber-200">
                        {slot.chapterTitle} · {slot.stageSubtitle}
                      </div>
                      <div className="text-xs text-stone-400">
                        第 {slot.turnNumber} 回合 · 军资 {slot.gold} 金 · 队伍 {slot.party.length} 人
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono">{slot.timestamp}</div>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-stone-500 italic">-- 空白存档槽位 --</span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {mode === 'save' && (
                  <button className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-amber-100 text-xs font-bold rounded cursor-pointer">
                    覆写记录
                  </button>
                )}
                {mode === 'load' && slot && (
                  <button className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-amber-100 text-xs font-bold rounded cursor-pointer">
                    读取进军
                  </button>
                )}
                {slot && (
                  <button
                    onClick={(e) => handleDeleteSlot(idx, e)}
                    className="px-2 py-1 bg-red-950 hover:bg-red-800 text-red-300 text-xs rounded border border-red-800 cursor-pointer"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
