/**
 * 三国志·烈火之誓 - 敌方 AI 战术决策引擎
 * 支持进攻型、守卫型、Boss驻守型、回复辅助型与援军触发
 */

import { Unit, TerrainType, Faction, WeaponType } from '../types';
import {
  calculateMovementRange,
  getTileKey,
  getDistance,
  ReachableTile,
} from './pathfinding';
import { getCombatForecast } from './combatEngine';

export interface AiAction {
  unit: Unit;
  destination: { x: number; y: number };
  actionType: 'attack' | 'heal' | 'wait';
  targetUnit?: Unit;
}

export function computeAiTurn(
  enemyUnit: Unit,
  mapWidth: number,
  mapHeight: number,
  terrainGrid: TerrainType[][],
  allUnits: Unit[]
): AiAction {
  // 仅对存活的敌方单位决策
  if (!enemyUnit.isAlive || enemyUnit.faction !== Faction.Enemy) {
    return { unit: enemyUnit, destination: { x: enemyUnit.x, y: enemyUnit.y }, actionType: 'wait' };
  }

  const aiType = enemyUnit.aiType || (enemyUnit.isBoss ? 'boss' : 'attack');
  const livingUnits = allUnits.filter((u) => u.isAlive);
  const playerUnits = livingUnits.filter((u) => u.faction === Faction.Player || u.faction === Faction.Ally);
  const enemyUnits = livingUnits.filter((u) => u.faction === Faction.Enemy);

  const weapon = enemyUnit.inventory[enemyUnit.equippedWeaponIndex] || null;

  // 1. 回复型 AI (有杖且友方有伤员)
  if (aiType === 'healer' && weapon?.type === WeaponType.Staff) {
    const woundedAllies = enemyUnits.filter((u) => u.stats.hp < u.stats.maxHp);
    if (woundedAllies.length > 0) {
      // 寻找伤势最重的友军
      woundedAllies.sort((a, b) => a.stats.hp / a.stats.maxHp - b.stats.hp / b.stats.maxHp);
      const target = woundedAllies[0];

      // 计算可达范围
      const reachable = calculateMovementRange(enemyUnit, mapWidth, mapHeight, terrainGrid, livingUnits);
      let bestMove = { x: enemyUnit.x, y: enemyUnit.y };
      let minDis = 999;

      for (const [, tile] of reachable) {
        const d = getDistance(tile.x, tile.y, target.x, target.y);
        if (d <= weapon.maxRange && d >= weapon.minRange) {
          return { unit: enemyUnit, destination: { x: tile.x, y: tile.y }, actionType: 'heal', targetUnit: target };
        }
        if (d < minDis) {
          minDis = d;
          bestMove = { x: tile.x, y: tile.y };
        }
      }
      return { unit: enemyUnit, destination: bestMove, actionType: 'wait' };
    }
  }

  // 2. Boss 驻守型 AI (稳守王座/城池，绝不擅离据点，但对进入射程的目标予以致命打击)
  if (aiType === 'boss') {
    if (!weapon || weapon.type === WeaponType.Item || weapon.type === WeaponType.Staff) {
      return { unit: enemyUnit, destination: { x: enemyUnit.x, y: enemyUnit.y }, actionType: 'wait' };
    }

    // 检查据点射程内是否有玩家目标
    let bestTarget: Unit | null = null;
    let maxDamage = -1;

    for (const player of playerUnits) {
      const dist = getDistance(enemyUnit.x, enemyUnit.y, player.x, player.y);
      if (dist >= weapon.minRange && dist <= weapon.maxRange) {
        const forecast = getCombatForecast(enemyUnit, player, dist);
        if (forecast.attackerDamage > maxDamage) {
          maxDamage = forecast.attackerDamage;
          bestTarget = player;
        }
      }
    }

    if (bestTarget) {
      return {
        unit: enemyUnit,
        destination: { x: enemyUnit.x, y: enemyUnit.y },
        actionType: 'attack',
        targetUnit: bestTarget,
      };
    }
    return { unit: enemyUnit, destination: { x: enemyUnit.x, y: enemyUnit.y }, actionType: 'wait' };
  }

  // 3. 进攻型 (Attack) 与 巡逻守卫型 (Guard)
  const reachable = calculateMovementRange(enemyUnit, mapWidth, mapHeight, terrainGrid, livingUnits);

  // 评估所有可攻击的目标与站位
  let bestScore = -99999;
  let bestDestination = { x: enemyUnit.x, y: enemyUnit.y };
  let chosenTarget: Unit | null = null;

  if (weapon && weapon.type !== WeaponType.Item && weapon.type !== WeaponType.Staff) {
    for (const [, moveTile] of reachable) {
      // 不能停在已被其他存活单位占据的格子上 (除非是原位)
      const isOccupied = livingUnits.some(
        (u) => u.id !== enemyUnit.id && u.x === moveTile.x && u.y === moveTile.y
      );
      if (isOccupied) continue;

      for (const player of playerUnits) {
        const dist = getDistance(moveTile.x, moveTile.y, player.x, player.y);
        if (dist >= weapon.minRange && dist <= weapon.maxRange) {
          const forecast = getCombatForecast(
            enemyUnit,
            player,
            dist,
            terrainGrid[player.y]?.[player.x],
            terrainGrid[moveTile.y]?.[moveTile.x]
          );

          // 综合战术评分
          let score = forecast.attackerDamage * 10;
          // 致命斩杀加成
          if (forecast.attackerDamage >= player.stats.hp) {
            score += 2000;
          }
          // 命中率权衡
          score += forecast.attackerHit * 2;
          // 武器相克加成
          if (forecast.attackerAdvantage === 'advantage') score += 50;
          if (forecast.attackerAdvantage === 'disadvantage') score -= 30;
          // 反击伤害减损
          if (forecast.canDefenderCounter) {
            score -= forecast.defenderDamage * 6;
          }
          // 优先打击薄弱单位 (如医官/魔道士)
          if (player.unitClass === 'cleric' || player.unitClass === 'mage') {
            score += 100;
          }

          if (score > bestScore) {
            bestScore = score;
            bestDestination = { x: moveTile.x, y: moveTile.y };
            chosenTarget = player;
          }
        }
      }
    }
  }

  if (chosenTarget) {
    return {
      unit: enemyUnit,
      destination: bestDestination,
      actionType: 'attack',
      targetUnit: chosenTarget,
    };
  }

  // 守卫型 AI 若无人在射程内，则保持原地不动
  if (aiType === 'guard') {
    return { unit: enemyUnit, destination: { x: enemyUnit.x, y: enemyUnit.y }, actionType: 'wait' };
  }

  // 进攻型 AI 搜寻最近的玩家单位靠拢
  let closestDist = 999;
  let targetMove = { x: enemyUnit.x, y: enemyUnit.y };

  for (const player of playerUnits) {
    for (const [, tile] of reachable) {
      const isOccupied = livingUnits.some(
        (u) => u.id !== enemyUnit.id && u.x === tile.x && u.y === tile.y
      );
      if (isOccupied) continue;

      const d = getDistance(tile.x, tile.y, player.x, player.y);
      if (d < closestDist) {
        closestDist = d;
        targetMove = { x: tile.x, y: tile.y };
      }
    }
  }

  return {
    unit: enemyUnit,
    destination: targetMove,
    actionType: 'wait',
  };
}
