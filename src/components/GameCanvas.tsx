/**
 * 三国志·烈火之誓 - 战棋地图主画布渲染器 (Game Map Canvas & HUD)
 * 渲染真实像素地形、移动蓝格、攻击红格、危险区、单位呼吸动画与战术 HUD
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Unit,
  TerrainType,
  StageConfig,
  Faction,
  Item,
  WeaponType,
  VictoryCondition,
} from '../types';
import { getTerrainTileUrl, getUnitSpriteUrl, getPortraitDataUrl } from '../graphics/pixelAssets';
import { getTerrainBonus } from '../data/classesData';
import { ReachableTile } from '../game/pathfinding';
import { audio } from '../audio/retroAudio';

interface GameCanvasProps {
  stage: StageConfig;
  units: Unit[];
  selectedUnit: Unit | null;
  cursorPos: { x: number; y: number };
  movementRange: Map<string, ReachableTile>;
  attackRange: Set<string>;
  staffRange?: Set<string>;
  dangerZone: Set<string>;
  showDangerZone: boolean;
  onTileClick: (x: number, y: number) => void;
  onCursorChange: (x: number, y: number) => void;
}

const TILE_SIZE = 32; // 像素棋盘格尺寸

export const GameCanvas: React.FC<GameCanvasProps> = ({
  stage,
  units,
  selectedUnit,
  cursorPos,
  movementRange,
  attackRange,
  staffRange = new Set(),
  dangerZone,
  showDangerZone,
  onTileClick,
  onCursorChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [animFrame, setAnimFrame] = useState(0);

  // 动画帧循环 (每 400ms 切换行走/呼吸帧)
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimFrame((prev) => (prev === 0 ? 1 : 0));
    }, 380);
    return () => clearInterval(timer);
  }, []);

  // 绘制整张棋盘
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false; // 保持复古像素无模糊抗锯齿

    const width = stage.mapWidth;
    const height = stage.mapHeight;

    canvas.width = width * TILE_SIZE;
    canvas.height = height * TILE_SIZE;

    // 1. 绘制底层地形网格
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const terrain = stage.terrainGrid[y]?.[x] || TerrainType.Plains;
        const tileImg = new Image();
        tileImg.src = getTerrainTileUrl(terrain);
        ctx.drawImage(tileImg, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // 2. 绘制全图敌军危险区 (Danger Zone)
    if (showDangerZone) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
      for (const key of dangerZone) {
        const [tx, ty] = key.split(',').map(Number);
        ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        // 斜向警戒细纹
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tx * TILE_SIZE, ty * TILE_SIZE);
        ctx.lineTo((tx + 1) * TILE_SIZE, (ty + 1) * TILE_SIZE);
        ctx.stroke();
      }
    }

    // 3. 绘制选中单位的移动范围 (蓝色高亮)
    if (movementRange.size > 0) {
      for (const [, tile] of movementRange) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.42)';
        ctx.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tile.x * TILE_SIZE + 1, tile.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }
    }

    // 4. 绘制武器攻击范围 (红色高亮)
    if (attackRange.size > 0) {
      for (const key of attackRange) {
        // 如果不在自身移动范围内才画，或纯攻击外圈
        const [tx, ty] = key.split(',').map(Number);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = 'rgba(252, 165, 165, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx * TILE_SIZE + 1, ty * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }
    }

    // 5. 绘制治愈之杖范围 (绿色高亮)
    if (staffRange.size > 0) {
      for (const key of staffRange) {
        const [tx, ty] = key.split(',').map(Number);
        ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
        ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = 'rgba(134, 239, 172, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx * TILE_SIZE + 1, ty * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }
    }

    const objectiveTarget = stage.victoryCondition === VictoryCondition.Escape ? stage.escapeTarget
      : stage.victoryCondition === VictoryCondition.Seize ? stage.seizeTarget : null;
    if (objectiveTarget) {
      const px = objectiveTarget.x * TILE_SIZE;
      const py = objectiveTarget.y * TILE_SIZE;
      ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 3;
      ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      ctx.fillStyle = '#ecfeff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(stage.victoryCondition === VictoryCondition.Escape ? '撤' : '占', px + 10, py + 21);
    }

    // 6. 绘制所有存活单位
    for (const unit of units) {
      if (!unit.isAlive) continue;

      const px = unit.x * TILE_SIZE;
      const py = unit.y * TILE_SIZE;

      // 阵营光晕基底
      const ringColor =
        unit.faction === Faction.Player
          ? 'rgba(59, 130, 246, 0.5)'
          : unit.faction === Faction.Enemy
          ? 'rgba(239, 68, 68, 0.6)'
          : 'rgba(34, 197, 94, 0.5)';

      ctx.fillStyle = ringColor;
      ctx.beginPath();
      ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 6, TILE_SIZE / 2.8, 0, Math.PI * 2);
      ctx.fill();

      // 单位精灵绘制 (含行动完毕灰显与选中跳跃)
      const isSelected = selectedUnit?.id === unit.id;
      const bounceOffset = isSelected ? (animFrame === 0 ? -4 : -6) : animFrame === 0 ? 0 : -1;

      const spriteImg = new Image();
      spriteImg.src = getUnitSpriteUrl(unit.characterId, unit.unitClass, unit.faction, animFrame);

      if (unit.hasActed && unit.faction === Faction.Player) {
        ctx.filter = 'grayscale(100%) brightness(65%)';
      } else {
        ctx.filter = 'none';
      }

      ctx.drawImage(spriteImg, px, py + bounceOffset, TILE_SIZE, TILE_SIZE);
      ctx.filter = 'none';

      // Boss 徽标
      if (unit.isBoss) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('B', px + 2, py + 10);
      }

      // 单位简易迷你血条
      const hpPercent = Math.max(0, unit.stats.hp / unit.stats.maxHp);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(px + 4, py + TILE_SIZE - 4, TILE_SIZE - 8, 3);
      ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444';
      ctx.fillRect(px + 4, py + TILE_SIZE - 4, (TILE_SIZE - 8) * hpPercent, 3);
    }

    // 7. 绘制经典 GBA 金黄色四角定位光标 (Target Cursor)
    const cx = cursorPos.x * TILE_SIZE;
    const cy = cursorPos.y * TILE_SIZE;
    const cursorPulse = animFrame === 0 ? 0 : 2;

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;

    // 左上角
    ctx.beginPath();
    ctx.moveTo(cx - cursorPulse, cy + 8 - cursorPulse);
    ctx.lineTo(cx - cursorPulse, cy - cursorPulse);
    ctx.lineTo(cx + 8 - cursorPulse, cy - cursorPulse);
    ctx.stroke();

    // 右上角
    ctx.beginPath();
    ctx.moveTo(cx + TILE_SIZE - 8 + cursorPulse, cy - cursorPulse);
    ctx.lineTo(cx + TILE_SIZE + cursorPulse, cy - cursorPulse);
    ctx.lineTo(cx + TILE_SIZE + cursorPulse, cy + 8 - cursorPulse);
    ctx.stroke();

    // 左下角
    ctx.beginPath();
    ctx.moveTo(cx - cursorPulse, cy + TILE_SIZE - 8 + cursorPulse);
    ctx.lineTo(cx - cursorPulse, cy + TILE_SIZE + cursorPulse);
    ctx.lineTo(cx + 8 - cursorPulse, cy + TILE_SIZE + cursorPulse);
    ctx.stroke();

    // 右下角
    ctx.beginPath();
    ctx.moveTo(cx + TILE_SIZE - 8 + cursorPulse, cy + TILE_SIZE + cursorPulse);
    ctx.lineTo(cx + TILE_SIZE + cursorPulse, cy + TILE_SIZE + cursorPulse);
    ctx.lineTo(cx + TILE_SIZE + cursorPulse, cy + TILE_SIZE - 8 + cursorPulse);
    ctx.stroke();
  }, [
    stage,
    units,
    selectedUnit,
    cursorPos,
    movementRange,
    attackRange,
    staffRange,
    dangerZone,
    showDangerZone,
    animFrame,
  ]);

  // 点击画布格子
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor(((e.clientX - rect.left) * scaleX) / TILE_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / TILE_SIZE);

    if (x >= 0 && x < stage.mapWidth && y >= 0 && y < stage.mapHeight) {
      onCursorChange(x, y);
      onTileClick(x, y);
    }
  };

  // 悬停/选中的地形与单位数据
  const currentTerrain = stage.terrainGrid[cursorPos.y]?.[cursorPos.x] || TerrainType.Plains;
  const terrainBonus = getTerrainBonus(currentTerrain);
  const unitAtCursor = units.find((u) => u.isAlive && u.x === cursorPos.x && u.y === cursorPos.y);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-1 sm:p-2 select-none overflow-hidden">
      {/* 棋盘主渲染容器 (适配手机竖屏最大高度) */}
      <div className="relative overflow-auto max-w-full max-h-[56vh] sm:max-h-[66vh] md:max-h-[75vh] border-3 sm:border-4 border-amber-900/90 rounded shadow-2xl bg-stone-950 gba-scroll">
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          className="cursor-crosshair block"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* 底部 HUD 浮动指示面板 (GBA 左下地形信息 / 右下角色卡片) */}
      <div className="w-full max-w-4xl flex justify-between items-end mt-1.5 px-1 sm:px-2 pointer-events-none text-stone-100">
        {/* 左侧地形面板 */}
        <div className="gba-window p-1.5 sm:p-2 rounded text-[11px] sm:text-xs pointer-events-auto min-w-[125px] sm:min-w-[150px] shadow-lg">
          <div className="flex justify-between items-center border-b border-amber-500/30 pb-0.5 mb-1 font-bold text-amber-300">
            <span>{terrainBonus.name}</span>
            <span className="text-[10px] text-stone-400 font-mono">
              ({cursorPos.x}, {cursorPos.y})
            </span>
          </div>
          <div className="flex space-x-2 sm:space-x-3 text-[10px] sm:text-[11px] font-mono text-stone-300">
            <span>防: +{terrainBonus.def}</span>
            <span>回: +{terrainBonus.avoid}%</span>
            {terrainBonus.heal > 0 && <span className="text-green-400">愈: +{terrainBonus.heal}%</span>}
          </div>
        </div>

        {/* 右侧单位状态卡片 */}
        {unitAtCursor && (
          <div className="gba-window p-1.5 sm:p-2.5 rounded pointer-events-auto flex items-center space-x-2 sm:space-x-3 shadow-lg max-w-[180px] sm:max-w-xs">
            <img
              src={getPortraitDataUrl(unitAtCursor.characterId, 'normal', unitAtCursor.faction)}
              alt={unitAtCursor.name}
              className="w-9 h-9 sm:w-12 sm:h-12 object-cover pixelated rounded border border-amber-400 bg-stone-950 flex-shrink-0"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="text-[11px] sm:text-xs min-w-0">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="font-bold text-amber-200 truncate">{unitAtCursor.name}</span>
                <span className="text-[10px] text-stone-400 font-mono flex-shrink-0">Lv {unitAtCursor.level}</span>
                {unitAtCursor.isBoss && (
                  <span className="text-[9px] bg-red-950 text-red-300 px-1 rounded border border-red-800 font-bold">
                    BOSS
                  </span>
                )}
              </div>
              <div className="font-mono text-stone-300 mt-0.5">
                HP: <span className="text-green-400 font-bold">{unitAtCursor.stats.hp}</span> / {unitAtCursor.stats.maxHp}
              </div>
              <div className="text-[10px] sm:text-[11px] text-amber-300 truncate max-w-[110px] sm:max-w-[140px]">
                {unitAtCursor.inventory[unitAtCursor.equippedWeaponIndex]?.name || '空手'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
