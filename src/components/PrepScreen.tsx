/**
 * 三国志·烈火之誓 - 战前整备界面 (Preparation Screen)
 * 支持部队编成、军资商店、整备装备、竞技场赌战与支援对话
 */

import React, { useState } from 'react';
import { Unit, Item, StageConfig, WeaponType } from '../types';
import { ITEMS_DATABASE } from '../data/itemsData';
import { getPortraitDataUrl } from '../graphics/pixelAssets';
import { audio } from '../audio/retroAudio';

interface PrepScreenProps {
  stage: StageConfig;
  party: Unit[];
  gold: number;
  onUpdateParty: (newParty: Unit[]) => void;
  onUpdateGold: (newGold: number) => void;
  onStartBattle: (selectedUnits: Unit[]) => void;
}

type TabType = 'deploy' | 'shop' | 'inventory' | 'arena' | 'support';

export const PrepScreen: React.FC<PrepScreenProps> = ({
  stage,
  party,
  gold,
  onUpdateParty,
  onUpdateGold,
  onStartBattle,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('deploy');
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>(() =>
    party.slice(0, stage.playerSpawnPoints.length).map((u) => u.id)
  );
  const [focusedUnit, setFocusedUnit] = useState<Unit>(party[0] || null);

  // 竞技场状态
  const [arenaBet, setArenaBet] = useState(100);
  const [arenaLog, setArenaLog] = useState<string>('欢迎光临军中校场！押注金钱，挑战勇士！');

  const maxDeploy = stage.playerSpawnPoints.length;

  const toggleDeploy = (unitId: string) => {
    audio.playMenuConfirm();
    if (selectedUnitIds.includes(unitId)) {
      if (selectedUnitIds.length > 1) {
        setSelectedUnitIds(selectedUnitIds.filter((id) => id !== unitId));
      }
    } else {
      if (selectedUnitIds.length < maxDeploy) {
        setSelectedUnitIds([...selectedUnitIds, unitId]);
      }
    }
  };

  // 商店购买物品
  const buyItem = (itemKey: string) => {
    const item = ITEMS_DATABASE[itemKey];
    if (!item) return;

    if (gold < item.cost) {
      audio.playMenuCancel();
      return;
    }

    if (!focusedUnit || focusedUnit.inventory.length >= 5) {
      audio.playMenuCancel();
      return;
    }

    audio.playMenuConfirm();
    onUpdateGold(gold - item.cost);

    const updatedUnit = {
      ...focusedUnit,
      inventory: [...focusedUnit.inventory, { ...item }],
    };

    const newParty = party.map((u) => (u.id === focusedUnit.id ? updatedUnit : u));
    onUpdateParty(newParty);
    setFocusedUnit(updatedUnit);
  };

  // 竞技场赌战结算
  const handleArenaFight = () => {
    if (gold < arenaBet || !focusedUnit) {
      audio.playMenuCancel();
      setArenaLog('军饷不足或未选定参赛武将！');
      return;
    }

    onUpdateGold(gold - arenaBet);
    audio.playSwordSlash();

    const winChance = 0.5 + (focusedUnit.level * 0.03);
    const isWin = Math.random() < winChance;

    if (isWin) {
      const prize = arenaBet * 2;
      onUpdateGold(gold - arenaBet + prize);
      audio.playLevelUp();
      setArenaLog(`【大捷】${focusedUnit.name} 挑落校场擂主！赢得赏金 ${prize} 金与大量武艺心得！`);
    } else {
      audio.playHit();
      setArenaLog(`【惜败】${focusedUnit.name} 不敌校场高手，损失押金 ${arenaBet} 金！`);
    }
  };

  const handleStart = () => {
    audio.playMenuConfirm();
    const deployed = party.filter((u) => selectedUnitIds.includes(u.id));
    onStartBattle(deployed);
  };

  return (
    <div id="prep-screen" className="fixed inset-0 z-40 bg-stone-950 flex flex-col select-none text-stone-100">
      {/* 顶部标题栏 */}
      <header className="gba-window px-3 py-2.5 sm:px-6 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-amber-500/50 gap-2">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-black text-amber-300 pixel-font">
            战前军议 · {stage.title}
          </h1>
          <p className="text-xs text-amber-200/80">{stage.subtitle} - {stage.description}</p>
        </div>
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end space-x-3 text-xs sm:text-sm font-mono">
          <span className="text-amber-400 font-bold bg-stone-900/90 px-2.5 py-1 rounded border border-amber-500/40">
            💰 军资: {gold} 金
          </span>
          <button
            id="start-chapter-btn"
            onClick={handleStart}
            className="px-4 py-2 sm:px-6 sm:py-2.5 gba-btn font-bold text-amber-100 text-xs sm:text-sm tracking-wider cursor-pointer animate-pulse min-h-[40px]"
          >
            起兵出征 ▶
          </button>
        </div>
      </header>

      {/* 选项卡导航 (支持移动端水平滑动) */}
      <nav className="flex space-x-1 px-2 sm:px-4 pt-2 bg-[#140e0a] border-b border-amber-600/40 overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: 'deploy', label: '出击编成' },
          { id: 'inventory', label: '物品装备' },
          { id: 'shop', label: '随军商铺' },
          { id: 'arena', label: '军中校场' },
          { id: 'support', label: '名将情谊' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              audio.playMenuConfirm();
              setActiveTab(tab.id as TabType);
            }}
            className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-t cursor-pointer transition-colors flex-shrink-0 min-h-[38px] ${
              activeTab === tab.id
                ? 'bg-amber-950 text-amber-200 border-t-2 border-x-2 border-amber-400'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 主工作区 */}
      <div className="flex-1 flex flex-col md:flex-row p-2 sm:p-4 gap-3 sm:gap-4 overflow-y-auto md:overflow-hidden">
        {/* 左侧人员名单 */}
        <div className="w-full md:w-80 flex flex-col gba-box p-3 rounded-md overflow-hidden max-h-60 md:max-h-none flex-shrink-0">
          <div className="text-xs text-amber-300 font-bold mb-2 flex justify-between">
            <span>全军将领 ({party.length})</span>
            <span>已选: {selectedUnitIds.length} / {maxDeploy}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 gba-scroll">
            {party.map((unit) => {
              const isSelected = selectedUnitIds.includes(unit.id);
              const isFocused = focusedUnit?.id === unit.id;
              return (
                <div
                  key={unit.id}
                  onClick={() => {
                    setFocusedUnit(unit);
                    audio.playMenuConfirm();
                  }}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer border transition-all ${
                    isFocused
                      ? 'border-amber-400 bg-amber-950/80 shadow-md'
                      : 'border-stone-800 bg-stone-900/60 hover:bg-stone-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={getPortraitDataUrl(unit.characterId, 'normal', unit.faction)}
                      alt={unit.name}
                      className="w-10 h-10 object-cover pixelated rounded border border-amber-500/40 bg-stone-950"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <div>
                      <div className="text-sm font-bold text-amber-200">{unit.name}</div>
                      <div className="text-[11px] text-stone-400">
                        Lv {unit.level} · HP {unit.stats.hp}/{unit.stats.maxHp}
                      </div>
                    </div>
                  </div>

                  {/* 出击复选框 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDeploy(unit.id);
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-600 border-amber-300 text-stone-950'
                        : 'bg-stone-800 border-stone-600 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {isSelected ? '出击' : '休整'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧面板详情 */}
        <div className="flex-1 gba-window p-4 rounded-md flex flex-col justify-between overflow-y-auto gba-scroll">
          {activeTab === 'deploy' && focusedUnit && (
            <div>
              <div className="flex items-center space-x-4 mb-4 border-b border-amber-500/30 pb-3">
                <img
                  src={getPortraitDataUrl(focusedUnit.characterId, 'normal', focusedUnit.faction)}
                  alt={focusedUnit.name}
                  className="w-20 h-20 object-cover pixelated rounded border-2 border-amber-400 bg-stone-950 shadow-xl"
                  style={{ imageRendering: 'pixelated' }}
                />
                <div>
                  <h2 className="text-xl font-bold text-amber-300">
                    {focusedUnit.name}
                  </h2>
                  <div className="text-xs text-amber-500 font-semibold tracking-wide">
                    {focusedUnit.title} · {focusedUnit.unitClass}
                  </div>
                  <div className="text-xs text-stone-300 mt-1">
                    等级: <span className="text-amber-300 font-bold">Lv {focusedUnit.level}</span> · 经验: <span className="text-amber-300 font-bold">{focusedUnit.exp}/100</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono mb-4">
                <div className="p-2 bg-stone-900 rounded border border-stone-800">HP: {focusedUnit.stats.hp}/{focusedUnit.stats.maxHp}</div>
                <div className="p-2 bg-stone-900 rounded border border-stone-800">力量 (力): {focusedUnit.stats.str}</div>
                <div className="p-2 bg-stone-900 rounded border border-stone-800">魔力 (魔): {focusedUnit.stats.mag}</div>
                <div className="p-2 bg-stone-900 rounded border border-stone-800">技巧 (技): {focusedUnit.stats.skl}</div>
                <div className="p-2 bg-stone-900 rounded border border-stone-800">速度 (速): {focusedUnit.stats.spd}</div>
                <div className="p-2 bg-stone-900 rounded border border-stone-800">幸运 (运): {focusedUnit.stats.lck}</div>
                <div className="p-2 bg-stone-900 rounded border border-stone-800">守备 (防): {focusedUnit.stats.def}</div>
                <div className="p-2 bg-stone-900 rounded border border-stone-800">魔防 (抗): {focusedUnit.stats.res}</div>
              </div>

              <h3 className="text-xs font-bold text-amber-300 mb-2">随身背囊 ({focusedUnit.inventory.length}/5)</h3>
              <div className="space-y-1.5">
                {focusedUnit.inventory.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-stone-900/80 rounded border border-amber-500/20 text-xs">
                    <span className="font-bold text-amber-200">
                      {idx === focusedUnit.equippedWeaponIndex ? '★ ' : ''}{item.name}
                    </span>
                    <span className="text-stone-400 font-mono">
                      耐久: {item.uses}/{item.maxUses} · 威力 {item.might} · 命中 {item.hit}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'shop' && (
            <div>
              <h2 className="text-lg font-bold text-amber-300 mb-3 border-b border-amber-500/30 pb-1">
                随军行商 · 铁匠铺与医馆
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  'iron_sword', 'steel_sword', 'killing_edge',
                  'iron_lance', 'steel_lance', 'killer_lance',
                  'iron_axe', 'steel_axe', 'killer_axe',
                  'iron_bow', 'steel_bow',
                  'fire_tome', 'thunder_tome',
                  'heal_staff', 'mend_staff',
                  'vulnerary', 'elixir', 'master_seal'
                ].map((itemKey) => {
                  const item = ITEMS_DATABASE[itemKey];
                  if (!item) return null;
                  return (
                    <div key={itemKey} className="flex items-center justify-between p-2.5 bg-stone-900 rounded border border-stone-800">
                      <div>
                        <div className="font-bold text-amber-200">{item.name}</div>
                        <div className="text-[11px] text-stone-400">{item.description}</div>
                      </div>
                      <button
                        onClick={() => buyItem(itemKey)}
                        disabled={gold < item.cost}
                        className="px-3 py-1 bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-amber-100 font-bold rounded cursor-pointer text-xs"
                      >
                        {item.cost} 金 购买
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'arena' && (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <h2 className="text-xl font-bold text-amber-300 mb-2">军中演武校场</h2>
              <p className="text-xs text-stone-400 max-w-md mb-6">
                选定一名战将入场押注比武，胜利可斩获翻倍军资与极高历练值！
              </p>
              <div className="bg-stone-900/90 p-4 rounded-md border border-amber-500/40 w-full max-w-md mb-4">
                <div className="text-sm font-bold text-amber-200 mb-2">
                  参战武将: {focusedUnit ? focusedUnit.name : '未选定'} (Lv {focusedUnit?.level})
                </div>
                <div className="flex items-center justify-center space-x-3 my-3">
                  <span className="text-xs text-stone-300">押注金:</span>
                  {[50, 100, 200, 500].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setArenaBet(amount)}
                      className={`px-2.5 py-1 text-xs rounded font-bold cursor-pointer ${
                        arenaBet === amount ? 'bg-amber-600 text-stone-950' : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
                <button
                  id="arena-challenge-btn"
                  onClick={handleArenaFight}
                  className="w-full py-2 bg-red-800 hover:bg-red-700 text-amber-100 font-bold rounded cursor-pointer text-sm shadow-md"
                >
                  登上擂台挑战！
                </button>
              </div>
              <div className="p-3 bg-black/60 rounded border border-stone-800 text-xs text-amber-300/90 font-mono w-full max-w-md">
                {arenaLog}
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div>
              <h2 className="text-lg font-bold text-amber-300 mb-3 border-b border-amber-500/30 pb-1">
                义结金兰 · 战将羁绊与支援
              </h2>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-stone-900 rounded border border-amber-500/20 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-200 text-sm">刘备 & 关羽</span>
                    <p className="text-stone-400 mt-0.5">桃园结义之契：同阵相邻时命中 +10，回避 +10，必杀 +5</p>
                  </div>
                  <span className="text-green-400 font-bold border border-green-500/40 px-2 py-0.5 rounded">
                    支援等级 A
                  </span>
                </div>
                <div className="p-3 bg-stone-900 rounded border border-amber-500/20 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-200 text-sm">关羽 & 张飞</span>
                    <p className="text-stone-400 mt-0.5">万夫莫当之势：同阵相邻时攻击 +2，必杀 +10</p>
                  </div>
                  <span className="text-green-400 font-bold border border-green-500/40 px-2 py-0.5 rounded">
                    支援等级 A
                  </span>
                </div>
                <div className="p-3 bg-stone-900 rounded border border-amber-500/20 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-200 text-sm">少主 & 诸葛亮</span>
                    <p className="text-stone-400 mt-0.5">如鱼得水之谋：同阵相邻时魔防 +3，回避 +15</p>
                  </div>
                  <span className="text-amber-400 font-bold border border-amber-500/40 px-2 py-0.5 rounded">
                    支援等级 B
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
