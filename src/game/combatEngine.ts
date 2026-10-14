/**
 * 三国志·烈火之誓 - 核心战斗计算与战损结算引擎
 * 严格按照 GBA 火纹原版数值公式实现
 */

import {
  Unit,
  Item,
  WeaponType,
  CombatForecast,
  CombatAction,
  LevelUpGain,
  TerrainType,
} from '../types';
import { getTerrainBonus } from '../data/classesData';

/**
 * 判定武器三角相克关系 (Weapon Triangle Advantage)
 * 物理系：剑 > 斧 > 枪 > 剑
 * 魔法系：理 > 光 > 暗 > 理
 */
export function getWeaponAdvantage(
  atkType?: WeaponType,
  defType?: WeaponType
): 'advantage' | 'disadvantage' | 'neutral' {
  if (!atkType || !defType) return 'neutral';

  // 物理武器三角
  if (atkType === WeaponType.Sword && defType === WeaponType.Axe) return 'advantage';
  if (atkType === WeaponType.Axe && defType === WeaponType.Lance) return 'advantage';
  if (atkType === WeaponType.Lance && defType === WeaponType.Sword) return 'advantage';

  if (atkType === WeaponType.Axe && defType === WeaponType.Sword) return 'disadvantage';
  if (atkType === WeaponType.Lance && defType === WeaponType.Axe) return 'disadvantage';
  if (atkType === WeaponType.Sword && defType === WeaponType.Lance) return 'disadvantage';

  // 魔法武器三角
  if (atkType === WeaponType.Anima && defType === WeaponType.Light) return 'advantage';
  if (atkType === WeaponType.Light && defType === WeaponType.Dark) return 'advantage';
  if (atkType === WeaponType.Dark && defType === WeaponType.Anima) return 'advantage';

  if (atkType === WeaponType.Light && defType === WeaponType.Anima) return 'disadvantage';
  if (atkType === WeaponType.Dark && defType === WeaponType.Light) return 'disadvantage';
  if (atkType === WeaponType.Anima && defType === WeaponType.Dark) return 'disadvantage';

  return 'neutral';
}

/**
 * 计算攻击速度 (Attack Speed)
 * 攻速 = 速度 - max(0, 武器重量 - 体格)
 */
export function calculateAttackSpeed(unit: Unit, weapon: Item | null): number {
  if (!weapon) return unit.stats.spd;
  const encumbrance = Math.max(0, weapon.weight - unit.stats.con);
  return Math.max(0, unit.stats.spd - encumbrance);
}

/**
 * 计算回避率 (Avoid)
 * 回避 = 攻速 × 2 + 幸运 + 地形回避
 */
export function calculateAvoid(unit: Unit, weapon: Item | null, terrain: TerrainType = TerrainType.Plains): number {
  const as = calculateAttackSpeed(unit, weapon);
  const terrainBonus = getTerrainBonus(terrain);
  return as * 2 + unit.stats.lck + terrainBonus.avoid;
}

/**
 * 检查武器特效克制 (如弓克飞行，破甲剑克重装，破马枪克骑兵)
 */
export function isEffectiveAgainst(weapon: Item | null, target: Unit): boolean {
  if (!weapon || !weapon.effectiveAgainst) return false;
  return weapon.effectiveAgainst.includes(target.unitClass as unknown as string);
}

/**
 * 计算单方战斗能力指标
 */
export function calculateCombatMetrics(
  attacker: Unit,
  defender: Unit,
  weapon: Item | null,
  defenderWeapon: Item | null,
  defenderTerrain: TerrainType = TerrainType.Plains
) {
  if (!weapon) {
    return { damage: 0, hit: 0, crit: 0, attackSpeed: attacker.stats.spd, advantage: 'neutral' as const };
  }

  const advantage = getWeaponAdvantage(weapon.type, defenderWeapon?.type);
  const triangleDmg = advantage === 'advantage' ? 1 : advantage === 'disadvantage' ? -1 : 0;
  const triangleHit = advantage === 'advantage' ? 15 : advantage === 'disadvantage' ? -15 : 0;

  // 基础攻击力判定 (魔法 vs 物理)
  const isMagical = weapon.type === WeaponType.Anima || weapon.type === WeaponType.Light || weapon.type === WeaponType.Dark;
  const offensiveStat = isMagical ? attacker.stats.mag : attacker.stats.str;
  const defensiveStat = isMagical ? defender.stats.res : defender.stats.def;

  // 特效威力加成 (3倍武器威力)
  const effective = isEffectiveAgainst(weapon, defender);
  const might = effective ? weapon.might * 3 : weapon.might;

  const rawDamage = offensiveStat + might + triangleDmg - defensiveStat - getTerrainBonus(defenderTerrain).def;
  const damage = Math.max(0, rawDamage);

  // 命中率计算
  // 命中 = 武器命中 + 技巧×2 + 幸运/2 - 敌回避
  const defAvoid = calculateAvoid(defender, defenderWeapon, defenderTerrain);
  const rawHit = weapon.hit + attacker.stats.skl * 2 + Math.floor(attacker.stats.lck / 2) + triangleHit - defAvoid;
  const hit = Math.min(100, Math.max(0, rawHit));

  // 必杀率计算
  // 必杀 = 武器必杀 + 技巧/2 - 敌方幸运
  const rawCrit = weapon.crit + Math.floor(attacker.stats.skl / 2) - defender.stats.lck;
  const crit = Math.min(100, Math.max(0, rawCrit));

  const attackSpeed = calculateAttackSpeed(attacker, weapon);

  return { damage, hit, crit, attackSpeed, advantage };
}

/**
 * 生成战前预报 (Combat Forecast)
 */
export function getCombatForecast(
  attacker: Unit,
  defender: Unit,
  distance: number,
  defenderTerrain: TerrainType = TerrainType.Plains,
  attackerTerrain: TerrainType = TerrainType.Plains
): CombatForecast {
  const atkWeapon = attacker.inventory[attacker.equippedWeaponIndex] || null;
  const defWeapon = defender.inventory[defender.equippedWeaponIndex] || null;

  const atkMetrics = calculateCombatMetrics(attacker, defender, atkWeapon, defWeapon, defenderTerrain);

  // 守方是否能够反击 (在射程内且有装备武器且非杖)
  const canDefenderCounter =
    defWeapon !== null &&
    defWeapon.type !== WeaponType.Staff &&
    defWeapon.type !== WeaponType.Item &&
    distance >= defWeapon.minRange &&
    distance <= defWeapon.maxRange;

  const defMetrics = canDefenderCounter
    ? calculateCombatMetrics(defender, attacker, defWeapon, atkWeapon, attackerTerrain)
    : { damage: 0, hit: 0, crit: 0, attackSpeed: defender.stats.spd, advantage: 'neutral' as const };

  // 追击判定 (攻速差 >= 4 触发追击)
  const attackerDouble = atkMetrics.attackSpeed - defMetrics.attackSpeed >= 4;
  const defenderDouble = canDefenderCounter && defMetrics.attackSpeed - atkMetrics.attackSpeed >= 4;

  return {
    attacker,
    defender,
    attackerWeapon: atkWeapon,
    defenderWeapon: defWeapon,
    attackerDamage: atkMetrics.damage,
    attackerHit: atkMetrics.hit,
    attackerCrit: atkMetrics.crit,
    attackerDouble,
    defenderDamage: defMetrics.damage,
    defenderHit: defMetrics.hit,
    defenderCrit: defMetrics.crit,
    defenderDouble,
    canDefenderCounter,
    attackerAdvantage: atkMetrics.advantage,
    defenderAdvantage: defMetrics.advantage,
  };
}

/**
 * 完整模拟单场交战结算 (执行攻守、追击、暴击判定与耐久消耗)
 */
export function simulateCombat(
  attacker: Unit,
  defender: Unit,
  distance: number,
  defenderTerrain: TerrainType = TerrainType.Plains,
  attackerTerrain: TerrainType = TerrainType.Plains
): {
  actions: CombatAction[];
  attackerDied: boolean;
  defenderDied: boolean;
  expGained: number;
} {
  const forecast = getCombatForecast(attacker, defender, distance, defenderTerrain, attackerTerrain);
  const actions: CombatAction[] = [];

  let curAtkHp = attacker.stats.hp;
  let curDefHp = defender.stats.hp;

  const atkWeapon = forecast.attackerWeapon;
  const defWeapon = forecast.defenderWeapon;

  // 辅助执行单次攻击
  const executeHit = (isAttacker: boolean) => {
    const activeUnit = isAttacker ? attacker : defender;
    const targetUnit = isAttacker ? defender : attacker;
    const activeWeapon = isAttacker ? atkWeapon : defWeapon;
    const hitRate = isAttacker ? forecast.attackerHit : forecast.defenderHit;
    const critRate = isAttacker ? forecast.attackerCrit : forecast.defenderCrit;
    const baseDamage = isAttacker ? forecast.attackerDamage : forecast.defenderDamage;

    // 命中与暴击判定 (采用 GBA 经典真随机 RNG)
    const rollHit = Math.random() * 100;
    const isHit = rollHit < hitRate;

    let isCrit = false;
    let actualDmg = 0;

    if (isHit) {
      const rollCrit = Math.random() * 100;
      isCrit = rollCrit < critRate;
      actualDmg = isCrit ? baseDamage * 3 : baseDamage;
    }

    if (isAttacker) {
      curDefHp = Math.max(0, curDefHp - actualDmg);
    } else {
      curAtkHp = Math.max(0, curAtkHp - actualDmg);
    }

    let weaponBroke = false;
    if (activeWeapon && activeWeapon.uses > 0) {
      activeWeapon.uses -= 1;
      if (activeWeapon.uses <= 0) {
        weaponBroke = true;
      }
    }

    actions.push({
      isAttacker,
      isHit,
      isCrit,
      damage: actualDmg,
      defenderHpRemaining: curDefHp,
      attackerHpRemaining: curAtkHp,
      weaponBroke,
    });
  };

  // 1. 发起方首击
  executeHit(true);

  // 2. 守方反击 (若守方未死且可以反击)
  if (curDefHp > 0 && forecast.canDefenderCounter) {
    executeHit(false);
  }

  // 3. 追击判定
  if (curDefHp > 0 && curAtkHp > 0) {
    if (forecast.attackerDouble) {
      executeHit(true);
    } else if (forecast.defenderDouble && forecast.canDefenderCounter) {
      executeHit(false);
    }
  }

  // 经验值结算
  let expGained = 0;
  if (attacker.faction === 'player') {
    if (curDefHp <= 0) {
      // 击破击杀经验
      const levelDiff = defender.level - attacker.level;
      const bossBonus = defender.isBoss ? 40 : 0;
      expGained = Math.min(100, Math.max(10, 30 + levelDiff * 4 + bossBonus));
    } else {
      // 造成伤害经验
      expGained = Math.min(100, Math.max(1, 10 + (defender.level - attacker.level) * 2));
    }
  }

  return {
    actions,
    attackerDied: curAtkHp <= 0,
    defenderDied: curDefHp <= 0,
    expGained,
  };
}

/**
 * 角色升级属性成长随机摇点 (Level Up Stat Roll)
 */
export function rollLevelUp(unit: Unit): LevelUpGain {
  const rollStat = (growth: number): number => {
    let gain = 0;
    // 超过100%必加1点，溢出部分继续摇点
    while (growth > 100) {
      gain += 1;
      growth -= 100;
    }
    if (Math.random() * 100 < growth) {
      gain += 1;
    }
    return gain;
  };

  return {
    hp: rollStat(unit.growths.hp),
    str: rollStat(unit.growths.str),
    mag: rollStat(unit.growths.mag),
    skl: rollStat(unit.growths.skl),
    spd: rollStat(unit.growths.spd),
    lck: rollStat(unit.growths.lck),
    def: rollStat(unit.growths.def),
    res: rollStat(unit.growths.res),
  };
}

/**
 * 应用升级属性增长至角色
 */
export function applyLevelUp(unit: Unit, gains: LevelUpGain): Unit {
  return {
    ...unit,
    level: unit.level + 1,
    exp: 0,
    stats: {
      ...unit.stats,
      hp: unit.stats.hp + gains.hp,
      maxHp: unit.stats.maxHp + gains.hp,
      str: unit.stats.str + gains.str,
      mag: unit.stats.mag + gains.mag,
      skl: unit.stats.skl + gains.skl,
      spd: unit.stats.spd + gains.spd,
      lck: unit.stats.lck + gains.lck,
      def: unit.stats.def + gains.def,
      res: unit.stats.res + gains.res,
    },
  };
}
