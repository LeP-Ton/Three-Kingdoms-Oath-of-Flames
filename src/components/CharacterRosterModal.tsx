/**
 * 三国志·烈火之誓 - 三国群英名将大典与全人物立绘检视器
 * 满足用户需求：在首页列出所有人物资料，方便逐一仔细检查每位人物的专属立绘效果、风格统一性与纯净度
 */

import React, { useState, useMemo } from 'react';
import { ALL_CHARACTERS_ROSTER, CharacterDossier } from '../data/charactersData';
import { getPortraitDataUrl } from '../graphics/pixelAssets';
import { audio } from '../audio/retroAudio';

interface CharacterRosterModalProps {
  onClose: () => void;
  initialSelectedId?: string;
}

export function CharacterRosterModal({ onClose, initialSelectedId }: CharacterRosterModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'cyber' | 'shu' | 'wei' | 'wu' | 'qun'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharId, setSelectedCharId] = useState<string>(
    initialSelectedId || ALL_CHARACTERS_ROSTER[0].id
  );
  const [zoomPortrait, setZoomPortrait] = useState<string | null>(null);

  // 过滤名将列表
  const filteredCharacters = useMemo(() => {
    return ALL_CHARACTERS_ROSTER.filter((c) => {
      const matchFilter = selectedFilter === 'all' || c.factionKey === selectedFilter;
      const matchSearch =
        searchQuery === '' ||
        c.name.includes(searchQuery) ||
        c.courtesyName.includes(searchQuery) ||
        c.title.includes(searchQuery) ||
        c.unitClass.includes(searchQuery);
      return matchFilter && matchSearch;
    });
  }, [selectedFilter, searchQuery]);

  // 当前选中的人物详情
  const selectedChar = useMemo(() => {
    return (
      ALL_CHARACTERS_ROSTER.find((c) => c.id === selectedCharId) ||
      filteredCharacters[0] ||
      ALL_CHARACTERS_ROSTER[0]
    );
  }, [selectedCharId, filteredCharacters]);

  const handleSelectChar = (id: string) => {
    audio.playMenuSelect();
    setSelectedCharId(id);
  };

  const getFactionBadgeStyle = (factionKey: string) => {
    switch (factionKey) {
      case 'cyber':
        return 'bg-cyan-900/90 text-cyan-300 border-cyan-500/80';
      case 'shu':
        return 'bg-emerald-950/90 text-emerald-300 border-emerald-500/80';
      case 'wei':
        return 'bg-purple-950/90 text-purple-300 border-purple-500/80';
      case 'wu':
        return 'bg-red-950/90 text-red-300 border-red-500/80';
      case 'qun':
      default:
        return 'bg-amber-950/90 text-amber-300 border-amber-500/80';
    }
  };

  return (
    <div
      id="character-roster-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 select-none animate-fade-in"
    >
      <div className="gba-window w-full max-w-5xl h-[94vh] max-h-[820px] rounded-lg border-2 border-amber-500/80 shadow-[0_0_35px_rgba(245,158,11,0.25)] flex flex-col overflow-hidden bg-stone-950 text-stone-100">
        {/* 顶部标题栏 */}
        <div className="px-4 py-3 bg-gradient-to-r from-stone-900 via-amber-950/80 to-stone-900 border-b border-amber-500/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]" />
            <h2 className="text-base sm:text-lg font-black text-amber-300 pixel-font tracking-widest">
              三国群英立绘大典 · 全名将资料库
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-500/30 hidden sm:inline-block">
              共收录 {ALL_CHARACTERS_ROSTER.length} 位三国名将与战枢机体
            </span>
          </div>

          <button
            onClick={() => {
              audio.playMenuCancel();
              onClose();
            }}
            className="px-3 py-1 bg-stone-800 hover:bg-red-900/80 text-amber-200 hover:text-white rounded border border-amber-500/40 text-xs font-bold transition-colors cursor-pointer"
          >
            关闭 (ESC) ✕
          </button>
        </div>

        {/* 筛选与搜索栏 */}
        <div className="p-3 bg-stone-900/90 border-b border-amber-500/30 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          {/* 阵营标签 */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {[
              { key: 'all', label: '全部英豪' },
              { key: 'cyber', label: '未来战枢/卫队' },
              { key: 'shu', label: '蜀汉' },
              { key: 'wei', label: '曹魏' },
              { key: 'wu', label: '东吴' },
              { key: 'qun', label: '群雄/仙道' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  audio.playMenuSelect();
                  setSelectedFilter(tab.key as any);
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer transition-all border whitespace-nowrap ${
                  selectedFilter === tab.key
                    ? 'bg-amber-600 text-amber-50 border-amber-300 shadow'
                    : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-amber-500/50 hover:text-amber-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 搜索框 */}
          <div className="relative w-full sm:w-56">
            <input
              type="text"
              placeholder="搜索名将/字号/称号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-950 border border-amber-500/40 rounded px-2.5 py-1 text-xs text-amber-100 placeholder-stone-500 focus:outline-none focus:border-amber-400 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1.5 text-stone-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 主体左右分栏布局 */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* 左侧：人物立绘网格列表 (供快速检视与对比) */}
          <div className="w-full md:w-5/12 h-64 md:h-auto overflow-y-auto p-3 border-b md:border-b-0 md:border-r border-amber-500/30 gba-scroll bg-stone-950/60">
            <div className="text-[11px] text-stone-400 mb-2 flex justify-between items-center px-1">
              <span>点击名将查看专属像素立绘与详尽演义资料：</span>
              <span className="text-amber-400 font-mono">({filteredCharacters.length} 人)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredCharacters.map((char) => {
                const isSelected = char.id === selectedChar.id;
                return (
                  <div
                    key={char.id}
                    onClick={() => handleSelectChar(char.id)}
                    className={`p-2 rounded border cursor-pointer transition-all flex flex-col items-center group relative ${
                      isSelected
                        ? 'bg-amber-950/80 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)] scale-[1.02]'
                        : 'bg-stone-900/70 border-stone-800 hover:border-amber-500/60 hover:bg-stone-800/80'
                    }`}
                  >
                    {/* 立绘微缩窗 */}
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded overflow-hidden border border-amber-500/40 bg-stone-950 shadow-inner">
                      <img
                        src={getPortraitDataUrl(char.portraitId, 'normal')}
                        alt={char.name}
                        className="w-full h-full object-cover pixelated group-hover:scale-105 transition-transform"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      {/* 阵营角标 */}
                      <span
                        className={`absolute top-0 right-0 px-1 text-[9px] font-bold border-l border-b rounded-bl ${getFactionBadgeStyle(
                          char.factionKey
                        )}`}
                      >
                        {char.faction.slice(0, 1)}
                      </span>
                    </div>

                    <div className="mt-1 text-center w-full">
                      <div className="text-xs font-bold text-amber-200 truncate">{char.name}</div>
                      <div className="text-[10px] text-stone-400 truncate">{char.title}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右侧：单人高精大图检视与完整档案 */}
          <div className="w-full md:w-7/12 flex-1 overflow-y-auto p-4 gba-scroll bg-stone-950/90">
            {selectedChar && (
              <div className="space-y-4 animate-fade-in">
                {/* 顶栏信息与高清立绘展示卡 */}
                <div className="flex flex-col sm:flex-row gap-4 p-3 rounded-lg bg-stone-900/90 border border-amber-500/40 shadow-lg">
                  {/* 高清立绘特写视窗 (支持点击放大检查像素画风) */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      onClick={() => setZoomPortrait(getPortraitDataUrl(selectedChar.portraitId, 'normal'))}
                      className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-lg border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] overflow-hidden cursor-zoom-in bg-stone-950 group"
                      title="点击全屏放大检查 16-bit GBA 像素细节"
                    >
                      <img
                        src={getPortraitDataUrl(selectedChar.portraitId, 'normal')}
                        alt={selectedChar.name}
                        className="w-full h-full object-cover pixelated transition-transform group-hover:scale-110"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] bg-black/80 px-2 py-0.5 rounded text-amber-300 border border-amber-400 font-mono">
                          🔍 点击放大
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-400/80 mt-1.5 font-mono">
                      16-bit GBA 专属立绘
                    </span>
                  </div>

                  {/* 身份基本档案 */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl sm:text-2xl font-black text-amber-300 pixel-font tracking-wide">
                        {selectedChar.name}
                      </span>
                      {selectedChar.courtesyName && (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-950 border border-amber-600/50 text-amber-200">
                          字 {selectedChar.courtesyName}
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-bold border ${getFactionBadgeStyle(
                          selectedChar.factionKey
                        )}`}
                      >
                        {selectedChar.faction}
                      </span>
                    </div>

                    <div className="text-xs text-amber-200/90 font-bold">
                      称号：<span className="text-stone-200">{selectedChar.title}</span>
                    </div>

                    <div className="text-xs text-stone-300">
                      兵种职业：<span className="text-amber-300 font-mono">{selectedChar.unitClass}</span>
                    </div>

                    <div className="text-xs text-stone-300">
                      配属武器：<span className="text-emerald-400">{selectedChar.weaponType}</span>
                    </div>

                    <div className="text-xs text-stone-300">
                      独门特技：<span className="text-cyan-300">{selectedChar.signatureSkill}</span>
                    </div>

                    {/* 经典演义名言 */}
                    <div className="p-2 rounded bg-stone-950/80 border-l-2 border-amber-500 text-xs italic text-amber-200/90 leading-relaxed font-serif">
                      {selectedChar.quote}
                    </div>
                  </div>
                </div>

                {/* 战斗基础属性面板 */}
                <div className="p-3 rounded-lg bg-stone-900/80 border border-amber-500/30">
                  <div className="text-xs font-bold text-amber-400 mb-2.5 flex items-center justify-between">
                    <span>⚔️ 基础战斗属性 (GBA SRPG 标准参数)</span>
                    <span className="text-[10px] text-stone-400 font-mono">移动力: {selectedChar.stats.mov} 格</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-1.5 rounded bg-stone-950 border border-stone-800 flex justify-between">
                      <span className="text-stone-400">生命 HP:</span>
                      <span className="text-green-400 font-bold">{selectedChar.stats.hp}</span>
                    </div>
                    <div className="p-1.5 rounded bg-stone-950 border border-stone-800 flex justify-between">
                      <span className="text-stone-400">力量 STR:</span>
                      <span className="text-red-400 font-bold">{selectedChar.stats.str}</span>
                    </div>
                    <div className="p-1.5 rounded bg-stone-950 border border-stone-800 flex justify-between">
                      <span className="text-stone-400">魔力 MAG:</span>
                      <span className="text-purple-400 font-bold">{selectedChar.stats.mag}</span>
                    </div>
                    <div className="p-1.5 rounded bg-stone-950 border border-stone-800 flex justify-between">
                      <span className="text-stone-400">技巧 SKL:</span>
                      <span className="text-blue-400 font-bold">{selectedChar.stats.skl}</span>
                    </div>
                    <div className="p-1.5 rounded bg-stone-950 border border-stone-800 flex justify-between">
                      <span className="text-stone-400">速度 SPD:</span>
                      <span className="text-cyan-400 font-bold">{selectedChar.stats.spd}</span>
                    </div>
                    <div className="p-1.5 rounded bg-stone-950 border border-stone-800 flex justify-between">
                      <span className="text-stone-400">幸运 LCK:</span>
                      <span className="text-amber-400 font-bold">{selectedChar.stats.lck}</span>
                    </div>
                    <div className="p-1.5 rounded bg-stone-950 border border-stone-800 flex justify-between">
                      <span className="text-stone-400">物防 DEF:</span>
                      <span className="text-yellow-400 font-bold">{selectedChar.stats.def}</span>
                    </div>
                    <div className="p-1.5 rounded bg-stone-950 border border-stone-800 flex justify-between">
                      <span className="text-stone-400">魔防 RES:</span>
                      <span className="text-pink-400 font-bold">{selectedChar.stats.res}</span>
                    </div>
                  </div>
                </div>

                {/* 《三国演义》人物生平与考据 */}
                <div className="p-3 rounded-lg bg-stone-900/80 border border-amber-500/30">
                  <div className="text-xs font-bold text-amber-400 mb-1.5 flex items-center space-x-1.5">
                    <span>📜 《三国演义》原著生平考据与战役表现</span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed text-justify font-sans">
                    {selectedChar.historicalBio}
                  </p>
                </div>

                {/* 科技战法与协同特技说明 */}
                <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/40 text-xs text-cyan-200">
                  <div className="font-bold text-cyan-300 mb-1">
                    🤖 战枢协同与战场战法：
                  </div>
                  <div className="text-stone-300 text-[11px] leading-relaxed">
                    在战役中，该人物在【天工·玄霄】的【量子战术雷达】或科技光环范围内时，可获得精准弹道修正与战术回避加成；若其为自主行动友军，将依据性格与战场态势自行索敌歼敌。
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部功能条 */}
        <div className="px-4 py-2.5 bg-stone-900/95 border-t border-amber-500/30 flex items-center justify-between text-xs text-stone-400 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-amber-400">★ 提示：</span>
            <span>所有立绘严格遵循 16-bit GBA 规范，画风对标吕布高规格，无任何对话框文字干扰。</span>
          </div>

          <button
            onClick={() => {
              audio.playAttack();
            }}
            className="px-3 py-1 bg-amber-900/40 hover:bg-amber-900 text-amber-300 rounded border border-amber-500/40 font-bold cursor-pointer"
          >
            🔊 音效试听
          </button>
        </div>
      </div>

      {/* 放大特写检视弹窗 (Zoom Overlay) */}
      {zoomPortrait && (
        <div
          onClick={() => setZoomPortrait(null)}
          className="fixed inset-0 z-60 flex flex-col items-center justify-center bg-black/95 p-4 cursor-zoom-out animate-scale-up"
        >
          <div className="relative max-w-sm sm:max-w-md w-full bg-stone-950 p-4 rounded-xl border-4 border-amber-400 text-center shadow-[0_0_50px_rgba(245,158,11,0.5)]">
            <div className="text-sm font-bold text-amber-300 mb-2 pixel-font">
              {selectedChar.name} · 16-bit GBA 独立像素立绘特写
            </div>
            <div className="w-64 h-64 sm:w-72 sm:h-72 mx-auto rounded overflow-hidden border-2 border-amber-500/80 bg-black">
              <img
                src={zoomPortrait}
                alt="Zoomed Portrait"
                className="w-full h-full object-cover pixelated"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="mt-3 text-xs text-stone-300 leading-relaxed">
              画面纯净度 100% · 无对话框文字杂质 · 严格对齐 16-bit GBA 像素调色板与高精光影
            </div>
            <div className="mt-3 text-[11px] text-amber-400/80 font-mono">
              [ 点击任意位置关闭放大预览 ]
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
