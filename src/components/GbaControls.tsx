/**
 * 三国志·烈火之誓 - 移动端与复古掌机触控操作板
 * 严格适配手机竖屏与横屏，具备大拇指舒适触达半径与古风青铜朱砂印玺质感
 */

import React from 'react';
import { audio } from '../audio/retroAudio';

interface GbaControlsProps {
  onDirection: (dx: number, dy: number) => void;
  onA: () => void;
  onB: () => void;
  onL: () => void;
  onR: () => void;
  onStart: () => void;
  onSelect: () => void;
}

export const GbaControls: React.FC<GbaControlsProps> = ({
  onDirection,
  onA,
  onB,
  onL,
  onR,
  onStart,
  onSelect,
}) => {
  return (
    <div
      id="gba-virtual-gamepad"
      className="w-full bg-[#120d09]/95 border-t-2 border-amber-600/50 px-2 py-2 select-none flex flex-col items-center justify-between text-stone-200 z-30 shadow-2xl flex-shrink-0"
    >
      {/* 顶部辅助操作栏 (L / R 虎符与 Select / Start 简策) */}
      <div className="w-full max-w-lg flex items-center justify-between px-2 mb-1.5 text-xs">
        <button
          onClick={() => {
            audio.playMenuConfirm();
            onL();
          }}
          className="px-2.5 py-1 min-h-[36px] bg-stone-900 active:bg-amber-800 border border-amber-600/60 rounded text-[11px] font-bold text-amber-200 shadow cursor-pointer active:scale-95"
          title="切换上一个待命武将"
        >
          虎符·L [我军]
        </button>

        <div className="flex space-x-2">
          <button
            onClick={() => {
              audio.playMenuConfirm();
              onSelect();
            }}
            className="px-2 py-1 min-h-[36px] bg-stone-900 active:bg-amber-700 border border-stone-700 rounded text-[10px] tracking-wider text-stone-300 font-bold cursor-pointer active:scale-95"
          >
            判敌 [Select]
          </button>
          <button
            onClick={() => {
              audio.playMenuConfirm();
              onStart();
            }}
            className="px-2 py-1 min-h-[36px] bg-amber-950 active:bg-amber-800 border border-amber-500/80 rounded text-[10px] tracking-wider text-amber-300 font-bold cursor-pointer active:scale-95"
          >
            军议 [Start]
          </button>
        </div>

        <button
          onClick={() => {
            audio.playMenuConfirm();
            onR();
          }}
          className="px-2.5 py-1 min-h-[36px] bg-stone-900 active:bg-red-900 border border-red-600/60 rounded text-[11px] font-bold text-red-300 shadow cursor-pointer active:scale-95"
          title="锁定最近敌军"
        >
          虎符·R [敌将]
        </button>
      </div>

      {/* 主操作区：左侧青铜十字键 + 右侧汉风印章 AB 键 */}
      <div className="w-full max-w-lg flex items-center justify-between px-3">
        {/* 左侧：青铜十字 D-Pad (紧凑适配手机单手拇指) */}
        <div className="relative w-28 h-28 bg-[#1a130e] rounded-full border-2 border-amber-800/80 flex items-center justify-center p-1 shadow-inner">
          {/* 上 */}
          <button
            onClick={() => onDirection(0, -1)}
            className="absolute top-1 w-9 h-10 min-h-[44px] bg-stone-800 active:bg-amber-600 border border-stone-600 rounded-t flex items-center justify-center text-amber-300 text-xs font-bold cursor-pointer active:scale-95 shadow"
            aria-label="向上移动"
          >
            ▲
          </button>
          {/* 下 */}
          <button
            onClick={() => onDirection(0, 1)}
            className="absolute bottom-1 w-9 h-10 min-h-[44px] bg-stone-800 active:bg-amber-600 border border-stone-600 rounded-b flex items-center justify-center text-amber-300 text-xs font-bold cursor-pointer active:scale-95 shadow"
            aria-label="向下移动"
          >
            ▼
          </button>
          {/* 左 */}
          <button
            onClick={() => onDirection(-1, 0)}
            className="absolute left-1 w-10 h-9 min-h-[44px] bg-stone-800 active:bg-amber-600 border border-stone-600 rounded-l flex items-center justify-center text-amber-300 text-xs font-bold cursor-pointer active:scale-95 shadow"
            aria-label="向左移动"
          >
            ◀
          </button>
          {/* 右 */}
          <button
            onClick={() => onDirection(1, 0)}
            className="absolute right-1 w-10 h-9 min-h-[44px] bg-stone-800 active:bg-amber-600 border border-stone-600 rounded-r flex items-center justify-center text-amber-300 text-xs font-bold cursor-pointer active:scale-95 shadow"
            aria-label="向右移动"
          >
            ▶
          </button>
          {/* 铜印中心旋钮 */}
          <div className="w-5 h-5 bg-amber-950 rounded-full border border-amber-600/70 pointer-events-none" />
        </div>

        {/* 掌机按键辅助说明 (电脑端显示，手机端紧凑) */}
        <div className="hidden sm:flex flex-col items-center text-[10px] text-stone-400 font-mono space-y-0.5">
          <span>键盘：WASD / 方向键移动</span>
          <span>Z：确认出征 | X：撤销返还</span>
          <span>直接点击/触碰地图亦可行动</span>
        </div>

        {/* 右侧：B 撤退印 与 A 征战印 (人体工学斜向排布，>=44px 触控标准) */}
        <div className="flex space-x-3 items-center">
          {/* B 键 (朱砂印玺：撤销/退却) */}
          <button
            onClick={() => {
              audio.playMenuCancel();
              onB();
            }}
            className="w-12 h-12 min-h-[48px] min-w-[48px] bg-gradient-to-br from-red-900 to-red-950 active:from-red-600 active:to-red-800 border-2 border-red-500 rounded-full flex flex-col items-center justify-center text-xs font-black shadow-lg cursor-pointer transform -translate-y-2 active:scale-95"
            aria-label="B按键：撤销"
          >
            <span className="text-red-200 text-sm">B</span>
            <span className="text-[8px] text-red-300 scale-90">退</span>
          </button>

          {/* A 键 (青铜碧玉印：出击/定夺) */}
          <button
            onClick={() => {
              audio.playMenuConfirm();
              onA();
            }}
            className="w-13 h-13 min-h-[52px] min-w-[52px] bg-gradient-to-br from-amber-700 to-amber-950 active:from-amber-500 active:to-amber-800 border-2 border-amber-400 rounded-full flex flex-col items-center justify-center text-sm font-black shadow-xl cursor-pointer transform translate-y-1 active:scale-95"
            aria-label="A按键：确认"
          >
            <span className="text-amber-100 text-base">A</span>
            <span className="text-[9px] text-amber-200 font-bold scale-90">定</span>
          </button>
        </div>
      </div>
    </div>
  );
};
