/**
 * 三国志·烈火之誓 - GBA 经典角色升级弹窗 (Level Up Modal)
 * 完美还原火焰纹章“铛铛铛”属性摇点音效与闪烁增长
 */

import React, { useEffect } from 'react';
import { Unit, LevelUpGain } from '../types';
import { getPortraitDataUrl } from '../graphics/pixelAssets';
import { audio } from '../audio/retroAudio';

interface LevelUpModalProps {
  unit: Unit;
  gain: LevelUpGain;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ unit, gain, onClose }) => {
  useEffect(() => {
    audio.playLevelUp();
  }, []);

  const statEntries = [
    { label: '最大 HP', value: unit.stats.maxHp, gained: gain.hp },
    { label: '力量 (力)', value: unit.stats.str, gained: gain.str },
    { label: '魔力 (魔)', value: unit.stats.mag, gained: gain.mag },
    { label: '技巧 (技)', value: unit.stats.skl, gained: gain.skl },
    { label: '速度 (速)', value: unit.stats.spd, gained: gain.spd },
    { label: '幸运 (运)', value: unit.stats.lck, gained: gain.lck },
    { label: '守备 (防)', value: unit.stats.def, gained: gain.def },
    { label: '魔防 (抗)', value: unit.stats.res, gained: gain.res },
  ];

  return (
    <div
      id="level-up-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none"
      onClick={onClose}
    >
      <div
        className="gba-window w-full max-w-md p-5 rounded-md shadow-2xl border-4 border-amber-400 relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部标题 */}
        <div className="text-center pb-3 border-b-2 border-amber-500/40 mb-4">
          <h2 className="text-2xl font-black text-amber-300 pixel-font tracking-wider drop-shadow-md animate-pulse">
            ★ LEVEL UP ! ★
          </h2>
        </div>

        {/* 角色信息与立绘 */}
        <div className="flex items-center space-x-4 mb-4 bg-stone-900/80 p-2.5 rounded border border-amber-500/30">
          <img
            src={getPortraitDataUrl(unit.characterId, 'smile', unit.faction)}
            alt={unit.name}
            className="w-16 h-16 object-cover pixelated rounded border border-amber-400 bg-stone-950"
            style={{ imageRendering: 'pixelated' }}
          />
          <div>
            <div className="text-lg font-bold text-amber-100">{unit.name}</div>
            <div className="text-xs text-amber-400/80">{unit.title}</div>
            <div className="text-sm text-green-400 font-mono mt-1 font-semibold">
              Lv {unit.level - 1} ➔ <span className="text-amber-300 text-base font-bold">Lv {unit.level}</span>
            </div>
          </div>
        </div>

        {/* 8大属性成长列表 */}
        <div className="grid grid-cols-2 gap-2 my-4">
          {statEntries.map((stat, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between px-3 py-1.5 rounded text-sm font-mono border ${
                stat.gained > 0
                  ? 'bg-amber-950/70 border-amber-400/60 text-amber-200'
                  : 'bg-stone-900/50 border-stone-800 text-stone-400'
              }`}
            >
              <span>{stat.label}</span>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-stone-100">{stat.value}</span>
                {stat.gained > 0 && (
                  <span className="text-green-400 font-bold animate-bounce text-xs">
                    +{stat.gained}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 底部按钮 */}
        <button
          id="confirm-level-up-btn"
          onClick={onClose}
          className="w-full mt-2 py-2 gba-btn font-bold text-amber-100 text-sm tracking-widest cursor-pointer"
        >
          确定 [按任意键继续]
        </button>
      </div>
    </div>
  );
};
