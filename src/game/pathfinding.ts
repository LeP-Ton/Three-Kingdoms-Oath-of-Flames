/**
 * 三国志·烈火之誓 - 寻路、移动范围与全图敌方危险区计算
 * 基于 Dijkstra / 广度优先搜索 (BFS) 与兵种地形消耗
 */

import { Unit, TerrainType, Item, Faction, WeaponType } from '../types';
import { getTerrainMoveCost } from '../data/classesData';

export interface ReachableTile {
  x: number;
  y: number;
  cost: number;
  path: { x: number; y: number }[];
}

export function getTileKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function parseTileKey(key: string): { x: number; y: number } {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

/**
 * 计算单位移动范围 (Reachable Tiles)
 */
export function calculateMovementRange(
  unit: Unit,
  mapWidth: number,
  mapHeight: number,
  terrainGrid: TerrainType[][],
  allUnits: Unit[]
): Map<string, ReachableTile> {
  const reachable = new Map<string, ReachableTile>();
  const startKey = getTileKey(unit.x, unit.y);

  // 队列元素: { x, y, remainingMov, path }
  const queue: { x: number; y: number; remainingMov: number; path: { x: number; y: number }[] }[] = [
    { x: unit.x, y: unit.y, remainingMov: unit.stats.mov, path: [{ x: unit.x, y: unit.y }] },
  ];

  reachable.set(startKey, {
    x: unit.x,
    y: unit.y,
    cost: 0,
    path: [{ x: unit.x, y: unit.y }],
  });

  // 建立坐标阻挡地图 (敌军完全阻挡，友军可以穿过但不可在同格停留)
  const unitMap = new Map<string, Unit>();
  for (const u of allUnits) {
    if (u.isAlive) {
      unitMap.set(getTileKey(u.x, u.y), u);
    }
  }

  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  while (queue.length > 0) {
    // 按剩余移动力最大优先出队
    queue.sort((a, b) => b.remainingMov - a.remainingMov);
    const current = queue.shift()!;

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      // 边界检查
      if (nx < 0 || nx >= mapWidth || ny < 0 || ny >= mapHeight) continue;

      const terrain = terrainGrid[ny]?.[nx] || TerrainType.Plains;
      const moveCost = getTerrainMoveCost(unit.unitClass, terrain);

      // 地形不可跨越
      if (moveCost >= 999) continue;

      const nextRemaining = current.remainingMov - moveCost;
      if (nextRemaining < 0) continue;

      const neighborKey = getTileKey(nx, ny);
      const occupyingUnit = unitMap.get(neighborKey);

      // 敌方单位阻挡行进路线 (ZOC 阻滞)
      if (occupyingUnit && (occupyingUnit.faction === Faction.Enemy) !== (unit.faction === Faction.Enemy)) {
        continue;
      }

      const totalCost = unit.stats.mov - nextRemaining;
      const existing = reachable.get(neighborKey);

      if (!existing || existing.cost > totalCost) {
        const nextPath = [...current.path, { x: nx, y: ny }];
        reachable.set(neighborKey, {
          x: nx,
          y: ny,
          cost: totalCost,
          path: nextPath,
        });

        queue.push({
          x: nx,
          y: ny,
          remainingMov: nextRemaining,
          path: nextPath,
        });
      }
    }
  }

  return reachable;
}

/**
 * 根据移动范围和装备武器计算攻击覆盖范围 (Attack Range Tiles)
 */
export function calculateAttackRange(
  reachableTiles: Map<string, ReachableTile>,
  weapon: Item | null,
  mapWidth: number,
  mapHeight: number
): Set<string> {
  const attackTiles = new Set<string>();
  if (!weapon || weapon.type === WeaponType.Staff || weapon.type === WeaponType.Item) {
    return attackTiles;
  }

  const minR = weapon.minRange;
  const maxR = weapon.maxRange;

  for (const [, tile] of reachableTiles) {
    for (let dx = -maxR; dx <= maxR; dx++) {
      for (let dy = -maxR; dy <= maxR; dy++) {
        const dist = Math.abs(dx) + Math.abs(dy);
        if (dist >= minR && dist <= maxR) {
          const tx = tile.x + dx;
          const ty = tile.y + dy;
          if (tx >= 0 && tx < mapWidth && ty >= 0 && ty < mapHeight) {
            attackTiles.add(getTileKey(tx, ty));
          }
        }
      }
    }
  }

  return attackTiles;
}

/**
 * 计算全图敌军威胁危险区 (Enemy Danger Zone / Red Overlay)
 */
export function calculateDangerZone(
  enemyUnits: Unit[],
  mapWidth: number,
  mapHeight: number,
  terrainGrid: TerrainType[][],
  allUnits: Unit[]
): Set<string> {
  const dangerTiles = new Set<string>();

  for (const enemy of enemyUnits) {
    if (!enemy.isAlive) continue;

    // 获取敌兵当前装备武器
    const weapon = enemy.inventory[enemy.equippedWeaponIndex] || null;
    if (!weapon || weapon.type === WeaponType.Staff || weapon.type === WeaponType.Item) {
      continue;
    }

    const reachable = calculateMovementRange(enemy, mapWidth, mapHeight, terrainGrid, allUnits);
    const attackable = calculateAttackRange(reachable, weapon, mapWidth, mapHeight);

    for (const key of attackable) {
      dangerTiles.add(key);
    }
  }

  return dangerTiles;
}

/**
 * 曼哈顿距离计算
 */
export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}
